import questions from "./questions.json";

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
  const questionTextElement = potentialQuestionElements[0];
  let questionText = questionTextElement?.textContent?.trim();
  console.log(questionText);
  return questionText;
};

const getOptionsFromPage = (): Option[] => {
  const potentialAnswerElements =
    document.querySelectorAll(".answer .d-flex p");
  const options = Array.from(potentialAnswerElements).map((el) => ({
    text: el.textContent?.trim() || "",
    element: el as HTMLElement,
  }));
  return options;
};

const MarkQuestions = (questions: Question[]) => {
  const questionText = GetQuestionFromPage();
  const options = getOptionsFromPage();

  if (questionText) {
    const matchingQuestion = questions.find((q) =>
      questionText.includes(q.question)
    );
    if (matchingQuestion) {
      displayFoundQuestion(
        matchingQuestion.question,
        matchingQuestion.answers.filter((a) => a.correct).map((a) => a.text)
      );
      options.forEach((option) => {
        // find the option, if it is correct, mark it as correct, if not, mark it as incorrect, if it is not in the list, mark with a warning
        console.log(option.text);
        const matchingAnswer = matchingQuestion.answers.find(
          (a) => a.text === option.text
        );
        if (matchingAnswer) {
          if (matchingAnswer.correct) {
            option.element.style.backgroundColor = "green";
          } else {
            option.element.style.backgroundColor = "red";
          }
        } else {
          option.element.style.backgroundColor = "yellow";
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
    height: "100px",
    backgroundColor: "gray",
    borderRadius: "5px",
    border: "1px solid black",
    shadow: "1px 1px 5px black",
    color: "black",
    padding: "10px",
    zIndex: "100000",
  });
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
    height: "auto",
    backgroundColor: "#f0f0f0",
    borderRadius: "5px",
    fontSize: "0.8rem",
    border: "1px solid black",
    shadow: "1px 1px 5px black",
    color: "black",
    padding: "10px",
    zIndex: "100000",
  });
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

MarkQuestions(questions);
