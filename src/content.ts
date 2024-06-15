import questions from "./questions.json";

interface Question {
  question: string;
  answers: { text: string; correct: boolean }[];
}

const findAndMarkQuestions = (questions: Question[]) => {
  questions.forEach((q) => {
    const questionElement = Array.from(document.querySelectorAll("*")).find(
      (el) => el.textContent?.includes(q.question)
    );
    if (questionElement) {
      q.answers.forEach((answer) => {
        if (answer.correct) {
          const answerElement = Array.from(document.querySelectorAll("*")).find(
            (el) => el.textContent?.includes(answer.text)
          );
          if (answerElement) {
            answerElement.classList.add("correct-answer");
          }
        }
      });
    } else {
      displayNoDataMessage(q.question);
    }
  });
};

const displayNoDataMessage = (question: string) => {
  const message = document.createElement("div");
  message.textContent = `No data for question: ${question}`;
  message.className = "no-data-message";
  document.body.appendChild(message);
};

findAndMarkQuestions(questions);
