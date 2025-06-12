import React, { useState, useEffect } from "react";
import Main from "../views/Main";
import Settings from "../views/Settings";

const Layout = () => {
    // --- State Management ---
    const [activeTab, setActiveTab] = useState('main');
    const [isEnabled, setIsEnabled] = useState(true);
    const [isHighlighting, setIsHighlighting] = useState(true);
    const [isAutoMode, setIsAutoMode] = useState(true);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [explanation, setExplanation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [questionType, setQuestionType] = useState("");

    // Load initial state from storage AND listen for changes from background script
    useEffect(() => {
        // Load initial state once
        chrome.storage.sync.get(['isEnabled', 'isBackground', 'isAutoMode'], (sync) => {
            if (sync.isEnabled !== undefined) setIsEnabled(sync.isEnabled);
            if (sync.isBackground !== undefined) setIsHighlighting(sync.isBackground);
            if (sync.isAutoMode !== undefined) setIsAutoMode(sync.isAutoMode);
        });
        chrome.storage.session.get(['lastQuestion', 'lastAnswer', 'lastExplanation', 'isLoading', 'questionType'], (session) => {
            if (session.lastQuestion) setQuestion(session.lastQuestion);
            if (session.lastAnswer) setAnswer(session.lastAnswer);
            if (session.lastExplanation) setExplanation(session.lastExplanation);
            if (session.isLoading) setIsLoading(session.isLoading);
            if (session.questionType) setQuestionType(session.questionType);
        });

        // Listen for future changes from the background script
        const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
            if (area === 'session') {
                if (changes.lastQuestion) {
                    setQuestion(changes.lastQuestion.newValue || "");
                }
                if (changes.lastAnswer) {
                    setAnswer(changes.lastAnswer.newValue || "");
                }
                if (changes.lastExplanation) {
                    setExplanation(changes.lastExplanation.newValue || "");
                }
                if (changes.isLoading) {
                    setIsLoading(changes.isLoading.newValue || false);
                }
                if (changes.questionType) {
                    setQuestionType(changes.questionType.newValue || "");
                }
            }
        };
        chrome.storage.onChanged.addListener(storageListener);

        return () => {
            chrome.storage.onChanged.removeListener(storageListener);
        };
    }, []);

    // Save settings to sync storage
    useEffect(() => {
        const timer = setTimeout(() => {
            chrome.storage.sync.set({ isEnabled, isBackground: isHighlighting, isAutoMode });
        }, 200);
        return () => clearTimeout(timer);
    }, [isEnabled, isHighlighting, isAutoMode]);
    

    return (
        <div className="flex flex-col h-full w-full bg-gradient-to-b from-white to-gray-50 overflow-hidden">
            <header className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white flex items-center">
                        Grammar Checker
                    </h1>
                </div>
            </header>

            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('main')}
                    className={`flex-1 py-2 text-center font-semibold text-sm transition-colors focus:outline-none ${activeTab === 'main' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Main
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 py-2 text-center font-semibold text-sm transition-colors focus:outline-none ${activeTab === 'settings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    Settings
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {activeTab === 'main' ? (
                    <Main 
                        isEnabled={isEnabled} 
                        answer={answer}
                        explanation={explanation}
                        question={question}
                        isLoading={isLoading}
                        questionType={questionType}
                    />
                ) : (
                    <Settings 
                        isEnabled={isEnabled} 
                        setIsEnabled={setIsEnabled}
                        isHighlighting={isHighlighting}
                        setIsHighlighting={setIsHighlighting}
                        isAutoMode={isAutoMode}
                        setIsAutoMode={setIsAutoMode}
                    />
                )}
            </div>
        </div>
    );
};

export default Layout; 