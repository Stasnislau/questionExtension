interface LlmCompletionParams {
  question: string;
  provider: "openai" | "mistral";
  apiKey: string;
  model: string;
}

export const getLlmCompletion = async ({
  question,
  provider,
  apiKey,
  model,
}: LlmCompletionParams): Promise<string> => {
  if (!apiKey) {
    throw new Error(`API key for ${provider} is not set.`);
  }

  const systemPrompt = `Your entire output MUST be a single, raw JSON object.
Do NOT include any other text, introductory phrases, or markdown formatting like \`\`\`json.
Your response must be directly parsable by \`JSON.parse()\`.

The JSON object must have exactly two keys: "correct_answer" and "explanation".

1.  **"correct_answer"**: An array of strings. Each string is an exact answer text to be highlighted.
    -   For matching questions, each string is a full match, like "Term - Description".
    -   For ordering questions, each string is an item in the correct order.

2.  **"explanation"**: A string containing your detailed, step-by-step reasoning for arriving at the answer. This is where you explain your logic.

Example response:
{
  "correct_answer": [
    "Symbolic - C - Deals with explicit representations of knowledge using symbols and rules."
  ],
  "explanation": "The 'Symbolic' paradigm is defined by its use of explicit symbols and logical rules for knowledge representation and reasoning. Therefore, it directly matches description C."
}

Now, analyze the user's question and provide ONLY the raw JSON object as your response. DO NOT include any other text, introductory phrases, or markdown formatting like \`\`\`json.
---
${question}`;

  let endpoint = "";
  let body: any = {};

  if (provider === "openai") {
    endpoint = "https://api.openai.com/v1/chat/completions";
    body = {
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      max_completion_tokens: 16384,
      response_format: { type: "json_object" },
    };
  } else {
    // mistral
    endpoint = "https://api.mistral.ai/v1/chat/completions";
    body = {
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      max_tokens: 16384,
      response_format: { type: "json_object" },
    };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `API request failed: ${errorData.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
