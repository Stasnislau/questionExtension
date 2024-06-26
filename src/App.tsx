import React, { useEffect } from 'react';

const App: React.FC = () => {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [isBackground, setIsBackground] = React.useState(false);

  useEffect(() => {
    chrome.storage.sync.get(['isEnabled'], (result) => {
      setIsEnabled(result.isEnabled || false);
    });
  }, []);
  useEffect(() => {
    chrome.storage.sync.get(['isBackground'], (result) => {
      setIsBackground(result.isBackground || false);
    });
  }, [isBackground]);

  const handleEnableToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.sync.set({ isEnabled: newState });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { isEnabled: newState, isBackground: isBackground});
      }
    });
  };

  const handleBackgroundToggle = () => {
    const newState = !isBackground;
    setIsBackground(newState);
    chrome.storage.sync.set({ isBackground: newState });
    if (isEnabled) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { isBackground: newState, isEnabled: isEnabled});
        }
      });
    }
  };

  return (
    <div className="app bg-gray-100 p-4 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-4">Test Help</h1>
      <div className="toggle-container mb-4">
        <p className="text-lg">Enable the extension?</p>
        <label className="switch inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="hidden"
            checked={isEnabled}
            onChange={handleEnableToggle}
          />
          <span className={`w-12 h-6 bg-gray-300 rounded-full shadow-inner flex-shrink-0
            ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span
              className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${isEnabled ? 'translate-x-6' : ''
                }`}
            ></span>
          </span>
        </label>
      </div>
      <div className={`
        ${!isEnabled ? 'pointer-events-none opacity-50' : ''}
        `}>
        <p className="text-lg">Highlight the background?</p>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="hidden"
            checked={isBackground}
            onChange={handleBackgroundToggle}
          />
          <span className={`w-12 h-6 bg-gray-300 rounded-full shadow-inner flex-shrink-0 ${isBackground ? 'bg-green-500' : 'bg-gray-300'}`
          } >
            <span
              className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${isBackground ? 'translate-x-6' : ''
                }`}
            ></span>
          </span>
        </label>
      </div>
    </div >
  );
};

export default App;
