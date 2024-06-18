import questions from "./questions.json";
import "./content.css";
import levenshtein from "./assets/levenshtein";

interface Question {
  question: string;
  answers: { text: string; correct: boolean }[];
}
interface Option {
  text: string;
  element: HTMLElement;
}

const GetQuestionFromPage = () => {
  const potentialQuestionElements = document.getElementsByClassName("qtext");
  if (potentialQuestionElements.length === 0) {
    return "";
  }
  const questionTextElement = potentialQuestionElements[0];
  let questionText = questionTextElement?.textContent?.trim().toLowerCase();
  return questionText;
};

const getOptionsFromPage = (): Option[] => {
  const potentialAnswerElements =
    document.querySelectorAll(".answer .d-flex p");
  if (potentialAnswerElements.length === 0) {
    return [];
  }
  const options = Array.from(potentialAnswerElements).map((el) => ({
    text: el.textContent?.trim().toLowerCase() || "",
    element: el as HTMLElement,
  }));
  return options;
};

const markQuestions = (questions: Question[], isBackground = true) => {
  const questionText = GetQuestionFromPage();
  const options = getOptionsFromPage();

  if (questionText) {
    const matchingQuestion = questions.find(
      (q) => levenshtein(q.question, questionText) < 3
    );
    if (matchingQuestion) {
      displayFoundQuestion(
        matchingQuestion.question,
        matchingQuestion.answers.filter((a) => a.correct).map((a) => a.text)
      );
      options.forEach((option) => {
        const matchingAnswer = matchingQuestion.answers.find(
          (a) => levenshtein(a.text, option.text) < 3
        );
        if (matchingAnswer) {
          if (matchingAnswer.correct) {
            isBackground
              ? (option.element.style.backgroundColor = "#90ee90")
              : (option.element.style.borderBottom = "2px solid #bdd5ff");
          } else {
            isBackground
              ? (option.element.style.backgroundColor = "#FF5733")
              : (option.element.style.borderBottom = "2px solid #E6E6E6");
          }
        } else {
          isBackground
            ? (option.element.style.backgroundColor = "#FFFDE1")
            : (option.element.style.borderBottom = "2px solid #FFFDE1");
        }
      });
    } else {
      displayNoDataMessage(questionText);
    }
  }
};

const displayNoDataMessage = (question: string) => {
  const message = document.createElement("div");
  message.textContent = `No data for question: ${question}`;
  message.className = "no-data-message";
  Object.assign(message.style, {
    position: "fixed",
    top: "10%",
    right: "10%",
    width: "150px",
    maxHeight: "200px",
    overflowY: "auto",
    backgroundColor: "gray",
    borderRadius: "5px",
    border: "1px solid black",
    shadow: "1px 1px 5px black",
    color: "black",
    padding: "10px",
    zIndex: "100000",
  });
  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.style.position = "absolute";
  closeButton.style.top = "0";
  closeButton.style.right = "0";
  closeButton.style.backgroundColor = "#E6E6E6";
  closeButton.style.color = "white";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "5px";
  closeButton.style.cursor = "pointer";
  closeButton.addEventListener("click", () => message.remove());
  message.appendChild(closeButton);

  document.body.appendChild(message);
};

const displayFoundQuestion = (question: string, correctOptions: string[]) => {
  const message = document.createElement("div");
  message.textContent = `Found question: ${question}`;

  message.className = "found-question";
  Object.assign(message.style, {
    position: "fixed",
    top: "10%",
    left: "10%",
    width: "150px",
    maxHeight: "200px",
    overflowY: "auto",
    backgroundColor: "#f0f0f0",
    borderRadius: "5px",
    fontSize: "0.8rem",
    border: "1px solid black",
    shadow: "1px 1px 5px black",
    color: "black",
    padding: "10px",
    zIndex: "100000",
  });

  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.style.position = "absolute";
  closeButton.style.top = "0";
  closeButton.style.right = "0";
  closeButton.style.backgroundColor = "#E6E6E6";
  closeButton.style.color = "white";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "5px";
  closeButton.style.cursor = "pointer";
  closeButton.addEventListener("click", () => message.remove());
  message.appendChild(closeButton);
  const h3 = document.createElement("h3");
  h3.textContent = "Correct options:";
  h3.style.marginBottom = "5px";
  h3.style.fontSize = "0.8rem";
  h3.style.fontWeight = "bold";

  message.appendChild(h3);
  for (const option of correctOptions) {
    const optionElement = document.createElement("div");
    optionElement.style.fontSize = "1rem";
    optionElement.textContent = option;
    message.appendChild(optionElement);
  }
  document.body.appendChild(message);
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.isEnabled !== undefined) {
    if (request.isEnabled) {
      markQuestions(questions);
    } else {
      const noDataMessage = document.querySelector(".no-data-message");
      const foundQuestion = document.querySelector(".found-question");
      if (noDataMessage) {
        noDataMessage.remove();
      }
      if (foundQuestion) {
        foundQuestion.remove();
      }
      const options = getOptionsFromPage();
      options.forEach((option) => {
        option.element.style.backgroundColor = "";
        option.element.style.borderBottom = "";
      });
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.isBackground !== undefined && request.isEnabled) {
    const options = getOptionsFromPage();
    options.forEach((option) => {
      option.element.style.backgroundColor = "";
      option.element.style.borderBottom = "";
    });
    if (request.isBackground) {
      markQuestions(questions, true);
    } else {
      markQuestions(questions, false);
    }
  }
});

chrome.storage.sync.get(["isEnabled", "isBackground"], (result) => {
  if (result.isEnabled) {
    markQuestions(questions, result.isBackground);
  }
});
