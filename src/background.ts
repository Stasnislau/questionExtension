import { getLlmCompletion } from "./api/mutations/getLlmCompletion";

// A mapping from tab ID to the last processed question text
const processedQuestions: { [tabId: number]: string } = {};

interface ParsedLlmResponse {
  correctAnswers: string[];
  explanation: string;
}

// Helper function to parse the structured LLM response
const parseLlmResponse = (response: string): ParsedLlmResponse => {
  try {
    // Find the first '{' and the last '}' to extract the JSON object
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in the LLM response.");
    }

    const jsonString = jsonMatch[0];
    const parsed = JSON.parse(jsonString);

    const correctAnswers = parsed.correct_answer || [];
    const explanation = parsed.explanation || 'No explanation provided.';
    
    if (Array.isArray(correctAnswers) && typeof explanation === 'string') {
      return { correctAnswers, explanation };
    } else {
      throw new Error("Parsed JSON does not match the expected structure.");
    }
  } catch (error) {
    console.error("Failed to parse LLM JSON response:", error, "Raw response:", response);
    // Fallback for non-JSON or malformed JSON responses
    return { correctAnswers: [], explanation: response }; // return the whole thing as explanation
  }
};

// Listen for messages from the POPUP
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getLlmAnswerFromContent") {
    const { question, elementId, questionType } = request;
    const tabId = sender.tab?.id;

    if (!tabId) {
      console.error("Received message without tab ID.");
      return true; // Keep listener active
    }

    // Immediately notify content script to show loading state
    chrome.tabs.sendMessage(tabId, { action: 'showLoadingState' });
    
    // Immediately set loading state in session storage for the popup
    chrome.storage.session.set({
      isLoading: true,
      lastQuestion: question,
      lastAnswer: null, // Clear previous answer
      lastExplanation: null, // Clear previous explanation
      questionType: questionType,
    });

    chrome.storage.sync.get(
      [
        "isEnabled",
        "selectedProvider",
        "openaiKey",
        "mistralKey",
        "selectedModelName",
        "isBackground",
      ],
      (settings) => {
        if (!settings.isEnabled) {
          return; // Do nothing if the extension is disabled
        }

        const provider = settings.selectedProvider || "openai";
        const model =
          settings.selectedModelName ||
          (provider === "openai" ? "gpt-4o" : "mistral-large-latest");
        const apiKey =
          provider === "openai" ? settings.openaiKey : settings.mistralKey;

        if (!apiKey) {
          console.error(`API key for ${provider} is not set.`);
          return;
        }

        getLlmCompletion({
          question,
          provider,
          apiKey,
          model,
        })
          .then(async (llmResponse: string) => {
            const { correctAnswers, explanation } =
              parseLlmResponse(llmResponse);

            await chrome.storage.session.set({
              isLoading: false,
              lastQuestion: question,
              lastAnswer: correctAnswers.join("\n"),
              lastExplanation: explanation,
              questionType: questionType,
            });

            if (settings.isBackground && correctAnswers.length > 0) {
              chrome.tabs.sendMessage(tabId, {
                action: "highlightAnswers",
                answers: correctAnswers,
                elementId: elementId,
                questionType: questionType,
              });
            }
          })
          .catch(async (error: any) => {
            console.error("Error processing LLM analysis:", error);
            await chrome.storage.session.set({
              isLoading: false,
              lastQuestion: question,
              lastAnswer: `Error: ${error.message}`,
              lastExplanation: "",
              questionType: questionType,
            });
          });
      }
    );

    return true; // Indicates async response
  }
  // Deprecated path, can be removed later
  else if (request.action === "getLlmAnswerFromPopup") {
    console.warn(
      "getLlmAnswerFromPopup is deprecated. Analysis is now automatic."
    );
    sendResponse({
      error: "Analysis is now automatic. This button is deprecated.",
    });
  }
  return true;
});

