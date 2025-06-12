import React from "react";

interface MainProps {
    isEnabled: boolean;
    answer: string;
    explanation: string;
    question: string;
    isLoading: boolean;
    questionType: string;
}

const Main: React.FC<MainProps> = ({ isEnabled, answer, explanation, question, isLoading, questionType }) => {
    // This component is now just for display. 
    // All logic is handled by the background script and Layout component.

    return (
        <div className="flex flex-col space-y-4">
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 text-blue-800 shadow-sm">
                <h3 className="font-bold flex items-center"><span className="mr-2">ℹ️</span> Status</h3>
                <p className="mt-1 text-sm">
                    {isEnabled ? "Auto-analysis is active." : "Extension is currently disabled."}
                    {questionType && <span className="ml-2 font-semibold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full text-xs">{questionType}</span>}
                </p>
            </div>

            {isLoading && (
                 <div className="p-4 border rounded-lg bg-yellow-50 shadow-sm flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-yellow-800 font-semibold">LLM is thinking...</span>
                 </div>
            )}
    
          {question && !isLoading && (
            <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
              <h3 className="text-md font-semibold mb-2 text-gray-700">Detected Question:</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-white p-3 rounded-md border">{question}</pre>
            </div>
          )}
          
          {answer && !isLoading && (
            <div className="p-4 border border-green-200 rounded-lg bg-green-50 shadow-sm">
              <h3 className="text-md font-semibold mb-2 text-green-800">Correct Answer(s):</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-900 bg-white p-3 rounded-md border">{answer}</pre>
            </div>
          )}
          
          {explanation && !isLoading && (
            <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50 shadow-sm">
              <h3 className="text-md font-semibold mb-2 text-indigo-800">LLM Explanation:</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-900 bg-white p-3 rounded-md border">{explanation}</pre>
            </div>
          )}

          {!question && !isLoading && (
            <div className="p-4 text-center text-gray-500">
                <p>Waiting for a question to appear on the page...</p>
            </div>
          )}
        </div>
      );
};

export default Main;
