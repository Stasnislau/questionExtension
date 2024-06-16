import React, { useEffect } from 'react';

const App: React.FC = () => {
  const [isEnabled, setIsEnabled] = React.useState(false);

  useEffect(() => {
    chrome.storage.sync.get(['isEnabled'], (result) => {
      setIsEnabled(result.isEnabled || false);
    });
  }, []);

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.sync.set({ isEnabled: newState });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { isEnabled: newState });
      }
    });
  };
  return (
    <div className=' text-gray-900 p-4 w-[200px] h-[200px] overflow-hidden rounded-md'>
      <h1 className='text-2xl font-bold'>
        Test Help
      </h1>
      <p className='text-sm mt-2'>
        Do you want to enable the extension?
      </p>
      <div className='flex items-center mt-2'>
        <button
          className={`${isEnabled ? 'bg-green-500' : 'bg-gray-500'
            } text-white px-4 py-2 rounded-lg`}
          onClick={handleToggle}
        >
          {isEnabled ? 'Disable' : 'Enable '}
        </button>
      </div>
    </div>
  );
};

export default App;
