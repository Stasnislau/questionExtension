import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import { ModelProvider, availableModels } from "../../consts";

interface SettingsProps {
  isEnabled: boolean;
  setIsEnabled: Dispatch<SetStateAction<boolean>>;
  isHighlighting: boolean;
  setIsHighlighting: Dispatch<SetStateAction<boolean>>;
  isAutoMode: boolean;
  setIsAutoMode: Dispatch<SetStateAction<boolean>>;
}

const Settings: React.FC<SettingsProps> = ({
  isEnabled,
  setIsEnabled,
  isHighlighting,
  setIsHighlighting,
  isAutoMode,
  setIsAutoMode,
}) => {
  // API & Model Settings
  const [openaiKey, setOpenaiKey] = useState("");
  const [mistralKey, setMistralKey] = useState("");
  const [availableProviders, setAvailableProviders] = useState<ModelProvider[]>(
    []
  );
  const [selectedProvider, setSelectedProvider] =
    useState<ModelProvider>("openai");
  const [selectedModelName, setSelectedModelName] = useState("");

  useEffect(() => {
    // Load API settings from storage on initial render
    chrome.storage.sync.get(
      ["openaiKey", "mistralKey", "selectedProvider", "selectedModelName"],
      (result) => {
        const oaiKey = result.openaiKey || "";
        const misKey = result.mistralKey || "";
        setOpenaiKey(oaiKey);
        setMistralKey(misKey);

        const loadedProvider: ModelProvider =
          result.selectedProvider || "openai";
        setSelectedProvider(loadedProvider);
        setSelectedModelName(
          result.selectedModelName || availableModels[loadedProvider][0]
        );
      }
    );
  }, []);

  useEffect(() => {
    // Dynamically update available providers based on keys
    const providers: ModelProvider[] = [];
    if (openaiKey) providers.push("openai");
    if (mistralKey) providers.push("mistral");
    setAvailableProviders(providers);

    if (providers.length > 0 && !providers.includes(selectedProvider)) {
      const newProvider = providers[0];
      setSelectedProvider(newProvider);
      setSelectedModelName(availableModels[newProvider][0]);
    }
  }, [openaiKey, mistralKey]);

  useEffect(() => {
    // Debounced save for API settings to storage
    const timer = setTimeout(() => {
      chrome.storage.sync.set({
        openaiKey,
        mistralKey,
        selectedProvider,
        selectedModelName,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [openaiKey, mistralKey, selectedProvider, selectedModelName]);

  const handleProviderChange = (provider: ModelProvider) => {
    setSelectedProvider(provider);
    setSelectedModelName(availableModels[provider][0]); // Default to first model of new provider
  };

  return (
    <div className="flex flex-col space-y-4 text-sm">
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">General</h3>
        <div className="flex items-center justify-between">
          <label
            htmlFor="enable-extension"
            className="font-medium text-gray-800"
          >
            Enable Extension
          </label>
          <input
            id="enable-extension"
            type="checkbox"
            checked={isEnabled}
            onChange={() => setIsEnabled((prev) => !prev)}
          />
        </div>
        <div
          className={`flex items-center justify-between mt-3 ${
            !isEnabled ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <label
            htmlFor="highlight-background"
            className="font-medium text-gray-800"
          >
            Highlight
          </label>
          <input
            id="highlight-background"
            type="checkbox"
            checked={isHighlighting}
            onChange={() => setIsHighlighting((prev) => !prev)}
            disabled={!isEnabled}
          />
        </div>
        <div
          className={`flex items-center justify-between mt-3 ${
            !isEnabled ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <label htmlFor="auto-mode" className="font-medium text-gray-800">
            Auto-analysis Mode
          </label>
          <input
            id="auto-mode"
            type="checkbox"
            checked={isAutoMode}
            onChange={() => setIsAutoMode((prev) => !prev)}
            disabled={!isEnabled}
          />
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          API Settings
        </h3>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="openai-key"
              className="block mb-1 font-medium text-gray-800"
            >
              OpenAI API Key
            </label>
            <input
              type="password"
              id="openai-key"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="sk-..."
            />
          </div>
          <div>
            <label
              htmlFor="mistral-key"
              className="block mb-1 font-medium text-gray-800"
            >
              Mistral API Key
            </label>
            <input
              type="password"
              id="mistral-key"
              value={mistralKey}
              onChange={(e) => setMistralKey(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="mistral-..."
            />
          </div>

          {availableProviders.length > 0 && (
            <>
              <div>
                <label
                  htmlFor="provider-select"
                  className="block mb-1 font-medium text-gray-800"
                >
                  Model Provider
                </label>
                <select
                  id="provider-select"
                  value={selectedProvider}
                  onChange={(e) =>
                    handleProviderChange(e.target.value as ModelProvider)
                  }
                  className="w-full p-2 border rounded-md bg-white"
                >
                  {availableProviders.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="model-select"
                  className="block mb-1 font-medium text-gray-800"
                >
                  Model
                </label>
                <select
                  id="model-select"
                  value={selectedModelName}
                  onChange={(e) => setSelectedModelName(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  {availableModels[selectedProvider].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          {availableProviders.length === 0 && (
            <p className="text-center text-gray-500 pt-2">
              Enter an API key to select a model.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
