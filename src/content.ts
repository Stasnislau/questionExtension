import "./content.css";
import { HIGHLIGHT_COLOR } from "./consts";

// --- DOM Manipulation ---

let observer: MutationObserver | null = null;
let originalFooterHTML: string | null = null;
const STEALTH_FOOTER_CLASS = "stealth-footer-answer";
const STEALTH_LOADING_CLASS = "stealth-loading-indicator";

const showLoadingInFooter = () => {
  const footer = document.querySelector<HTMLElement>(
    "#page-footer > div > div.row.footter_cc"
  );
  if (!footer) return;
  const footerChild = document.querySelector<HTMLElement>(
    "#page-footer > div > div.row.footter_cc > div.footter_lc"
  );
  if (!footerChild) return;

  // Clean up any previous indicators to avoid duplicates
  footer.querySelector(`.${STEALTH_LOADING_CLASS}`)?.remove();

  const loadingEl = document.createElement("div");
  loadingEl.className = STEALTH_LOADING_CLASS;
  loadingEl.innerText = "Loading...";
  loadingEl.style.padding = "10px 0";
  loadingEl.style.textAlign = "center";
  loadingEl.style.color = "gray";
  loadingEl.style.fontWeight = "bold";
  loadingEl.style.fontSize = "14px";

  footerChild.appendChild(loadingEl);
};

const displayAnswerInFooter = (htmlContent: string) => {
  const footer = document.querySelector<HTMLElement>(
    "#page-footer > div > div.row.footter_cc"
  );
  if (!footer) return;

  if (originalFooterHTML === null) {
    originalFooterHTML = footer.innerHTML;
  }

  const answerContainer = document.createElement("div");
  answerContainer.className = STEALTH_FOOTER_CLASS;
  answerContainer.innerHTML = htmlContent;
  answerContainer.style.padding = "10px";
  answerContainer.style.textAlign = "center";
  answerContainer.style.fontSize = "14px";
  answerContainer.style.color = "gray";

  footer.innerHTML = ""; // Clear existing footer content
  footer.appendChild(answerContainer);
};

const getFullQuestionContext = (
  questionElement: HTMLElement
): string | null => {
  const qtextElement = questionElement.querySelector<HTMLElement>(".qtext");
  if (!qtextElement) return null;

  const mainQuestionText =
    (qtextElement.cloneNode(true) as HTMLElement).textContent?.trim() || "";

  // Type 4: Ordering question
  const orderingContainer =
    questionElement.querySelector<HTMLElement>(".answer.ordering");
  if (orderingContainer) {
    const items = Array.from(
      orderingContainer.querySelectorAll<HTMLElement>("li.sortableitem")
    )
      .map((item) => item.textContent?.trim())
      .filter(Boolean);
    if (items.length > 0) {
      return `Question: ${mainQuestionText}\n${items
        .map((o) => `- ${o}`)
        .join("\n")}`;
    }
  }

  // Type 3: Matching question
  const matchingTable = questionElement.querySelector<HTMLElement>(
    ".ablock table.answer"
  );
  if (matchingTable) {
    const termsToMatch: string[] = [];
    const availableOptions: string[] = [];
    matchingTable.querySelectorAll("tr").forEach((row, index) => {
      const termElement = row.querySelector<HTMLElement>(".text");
      if (termElement) termsToMatch.push(termElement.innerText.trim());
      if (index === 0) {
        const selectElement = row.querySelector<HTMLSelectElement>("select");
        if (selectElement) {
          Array.from(selectElement.options).forEach((opt) => {
            if (opt.value) availableOptions.push(opt.text.trim());
          });
        }
      }
    });
    if (termsToMatch.length > 0 && availableOptions.length > 0) {
      return `Question: ${mainQuestionText}\n\nMatch the following terms:\n${termsToMatch
        .map((t) => `- ${t}`)
        .join(
          "\n"
        )}\n\nWith one of the following descriptions:\n${availableOptions
        .map((o) => `- ${o}`)
        .join("\n")}`;
    }
  }

  // Type 2: Gap select
  const gapSelectElement =
    qtextElement.querySelector<HTMLSelectElement>("select.select");
  if (gapSelectElement) {
    const qtextClone = qtextElement.cloneNode(true) as HTMLElement;
    qtextClone.querySelector("select.select")?.remove();
    const questionTextWithBlank = (qtextClone.textContent || "")
      .trim()
      .replace(/\s+$/, " [BLANK]");

    const options = Array.from(gapSelectElement.options)
      .map((opt) => opt.text.trim())
      .filter(Boolean);

    if (options.length > 0) {
      return `Fill in the blank.\n\nSentence: ${questionTextWithBlank}\n\nOptions:\n${options
        .map((o) => `- ${o}`)
        .join("\n")}`;
    }
  }

  // Type 1: Standard multiple choice
  const standardOptionsContainer = questionElement.querySelector(".answer");
  if (standardOptionsContainer) {
    const options = Array.from(
      standardOptionsContainer.querySelectorAll<HTMLElement>(".flex-fill")
    )
      .map((el) => el.textContent?.trim() || "")
      .filter(Boolean);
    if (options.length > 0) {
      return `Question: ${mainQuestionText}\n\nOptions:\n${options
        .map((o) => `- ${o}`)
        .join("\n")}`;
    }
  }

  return mainQuestionText;
};

function generateAbbreviations(items: string[]): Record<string, string> {
  const abbreviations: Record<string, string> = {};
  const usedAbbreviations = new Set<string>();

  for (const item of items) {
    let abbr = "";
    let len = 3;
    while (true) {
      abbr = item.substring(0, len);
      if (!usedAbbreviations.has(abbr) || len >= item.length) {
        break;
      }
      len++;
    }
    usedAbbreviations.add(abbr);
    abbreviations[item] = abbr;
  }
  return abbreviations;
}

const determineQuestionType = (questionElement: HTMLElement): string => {
  if (questionElement.querySelector(".answer.ordering")) return "ordering";
  if (questionElement.querySelector(".ablock table.answer")) return "matching";
  if (questionElement.querySelector(".qtext select.select")) return "gapFill";
  return "standard";
};

const highlightAnswers = (
  answers: string[],
  elementId: string,
  questionType: string
) => {
  try {
    const questionElement = document.getElementById(elementId);
    if (!questionElement) return;

    clearHighlights(elementId);

    switch (questionType) {
      case "ordering":
        const initialItems = Array.from(
          questionElement.querySelectorAll<HTMLElement>(
            ".answer.ordering li.sortableitem"
          )
        )
          .map((item) => item.textContent?.trim() || "")
          .filter(Boolean);
        const orderedItemsFromLlm = answers.map((item) =>
          item.replace(/^\d+\.\s/, "").trim()
        );

        if (initialItems.length > 0) {
          const abbrMap = generateAbbreviations(initialItems);
          const abbrSequence = orderedItemsFromLlm
            .map((orderedItem) => abbrMap[orderedItem] || "?")
            .join(", ");
          displayAnswerInFooter(abbrSequence);
        }
        break;
      case "matching":
        const answerMap = new Map<string, string>();
        answers.forEach((a) => {
          // Handles "Term - Description", where description can contain hyphens.
          const parts = a.split(/\s+-\s+/);
          if (parts.length >= 2) {
            const term = parts.shift()?.trim();
            const description = parts.join(" - ").trim();
            if (term) {
              answerMap.set(term, description);
            }
          }
        });

        if (answerMap.size === 0) return;

        const displayParts: string[] = [];
        questionElement
          .querySelectorAll<HTMLElement>(".ablock table.answer tr")
          .forEach((row) => {
            const textEl = row.querySelector<HTMLElement>(".text");
            const term = textEl?.innerText.trim();
            if (term && answerMap.has(term)) {
              const desc = answerMap.get(term)!;
              displayParts.push(`<b>${term}</b> → ${desc}`);
            }
          });

        if (displayParts.length > 0) {
          displayAnswerInFooter(displayParts.join("<br>"));
        }
        break;
      case "gapFill":
        const answerText = answers[0];
        if (!answerText) return;
        const gapSelectElement =
          questionElement.querySelector<HTMLSelectElement>(
            ".qtext select.select"
          );
        if (gapSelectElement) {
          const option = Array.from(gapSelectElement.options).find(
            (o) => o.text.trim() === answerText
          );
          if (option) {
            displayAnswerInFooter(answerText);
          }
        }
        break;
      case "standard":
        questionElement.querySelectorAll(".answer .flex-fill").forEach((el) => {
          const parentRow = el.closest(".d-flex");
          const currentOptionText = el.textContent?.trim() ?? "";
          if (answers.includes(currentOptionText) && parentRow) {
            (parentRow as HTMLElement).style.textDecoration = "underline";
            (parentRow as HTMLElement).style.textDecorationColor =
              HIGHLIGHT_COLOR;
            (parentRow as HTMLElement).style.textDecorationThickness = "2px";
          }
        });

        if (answers.length > 0) {
          displayAnswerInFooter(answers.join("<br>"));
        }
        break;
    }
  } catch (error) {
    console.error("Error in highlightAnswers:", error);
  }
};

const handlePotentialQuestions = () => {
  chrome.storage.sync.get("isAutoMode", (settings) => {
    if (!settings.isAutoMode) return;
    document
      .querySelectorAll<HTMLElement>('.que:not([data-processed="true"])')
      .forEach((questionElement) => {
        const questionId = questionElement.id;
        if (!questionId) return;

        questionElement.dataset.processed = "true";

        const rightAnswerElement = questionElement.querySelector<HTMLElement>(
          ".outcome .feedback .rightanswer"
        );
        if (rightAnswerElement) {
          console.log(
            `Found a pre-answered question (${questionId}), parsing answer directly.`
          );
          const answerText = rightAnswerElement.innerText
            .replace(/^[\s\S]*:\s*/, "")
            .trim();
          const answers = answerText.includes("→")
            ? answerText.split(",").map((a) => a.trim())
            : [answerText];
          const questionType = determineQuestionType(questionElement);
          highlightAnswers(answers, questionId, questionType);
          return;
        }

        const context = getFullQuestionContext(questionElement);
        const questionType = determineQuestionType(questionElement);
        if (context) {
          chrome.runtime.sendMessage({
            action: "getLlmAnswerFromContent",
            question: context,
            elementId: questionId,
            questionType: questionType,
          });
        }
      });
  });
};

const clearHighlights = (elementId?: string) => {
  // Always search the entire document for footer elements, regardless of scope
  document.querySelectorAll(".stealth-loading-indicator").forEach((el) => el.remove());
  document.querySelectorAll(".stealth-footer-answer").forEach((el) => el.remove());

  const scope = elementId ? document.getElementById(elementId) : document;
  if (!scope) return;

  // Clear highlights within the specific question scope if provided
  scope.querySelectorAll(".answer .d-flex").forEach((el) => {
    (el as HTMLElement).style.textDecoration = "none";
  });

  // Restore original footer content if it was saved
  const footer = document.querySelector<HTMLElement>(
    "#page-footer > div > div.row.footter_cc"
  );
  if (footer && originalFooterHTML !== null) {
    footer.innerHTML = originalFooterHTML;
    originalFooterHTML = null;
  }
};

const setupFooterButtonListener = () => {
  const footerButton = document.querySelector<HTMLButtonElement>(
    'button[data-action="footer-popover"]'
  );
  if (footerButton && !footerButton.dataset.listenerAttached) {
    footerButton.dataset.listenerAttached = "true";
    footerButton.addEventListener("click", () => {
      chrome.storage.sync.get("isBackground", (data) => {
        chrome.storage.sync.set({ isBackground: !data.isBackground });
      });
    });
    console.log("Footer popover button listener attached.");
  }
};

// --- Chrome Listeners ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "showLoadingState":
      chrome.storage.sync.get("isEnabled", (settings) => {
        if (settings.isEnabled) {
          showLoadingInFooter();
        }
      });
      break;
    case "highlightAnswers":
      chrome.storage.sync.get(["isEnabled", "isBackground"], (settings) => {
        if (settings.isEnabled && settings.isBackground) {
          const cleanAnswers = request.answers.map((a: string) =>
            a.replace(/^CORRECT_ANSWER:\s*/, "")
          );
          highlightAnswers(
            cleanAnswers,
            request.elementId,
            request.questionType
          );
        }
      });
      break;
    case "clearHighlights":
      clearHighlights();
      break;
  }
  return true;
});

function setupObserver() {
  chrome.storage.sync.get("isAutoMode", (settings) => {
    if (settings.isAutoMode) {
      if (observer) return;
      observer = new MutationObserver(handlePotentialQuestions);
      observer.observe(document.body, { childList: true, subtree: true });
      handlePotentialQuestions();
      console.log("MutationObserver started for auto-analysis.");
    } else {
      if (observer) {
        observer.disconnect();
        observer = null;
        console.log("MutationObserver stopped.");
      }
    }
  });
}

// Listen for changes in settings to enable/disable the observer
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;

  if (changes.isAutoMode) {
    setupObserver();
    // If auto-mode is disabled, also clear highlights
    if (!changes.isAutoMode.newValue) {
      clearHighlights();
    }
  }

  const wasEnabled = changes.isEnabled?.oldValue;
  const isNowEnabled = changes.isEnabled?.newValue;
  const wasHighlighting = changes.isBackground?.oldValue;
  const isNowHighlighting = changes.isBackground?.newValue;

  // When the extension or background highlighting is disabled, clear all visuals.
  if (
    (changes.isEnabled && !isNowEnabled) ||
    (changes.isBackground && !isNowHighlighting)
  ) {
    clearHighlights();
  }

  // When re-enabling, re-process all questions on the page.
  if (
    (changes.isEnabled && isNowEnabled && !wasEnabled) ||
    (changes.isBackground && isNowHighlighting && !wasHighlighting)
  ) {
    document
      .querySelectorAll<HTMLElement>('.que[data-processed="true"]')
      .forEach((el) => {
        el.removeAttribute("data-processed");
      });
    handlePotentialQuestions();
  }
});

// Initial setup
setupObserver();
setInterval(setupFooterButtonListener, 2000); // Periodically check for the button
