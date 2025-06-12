export const HIGHLIGHT_COLOR = "#f3fffa";

export type ModelProvider = "openai" | "mistral";

export const availableProviders: ModelProvider[] = ["openai", "mistral"];

export const availableModels: Record<ModelProvider, string[]> = {
  openai: [
    "gpt-4o-mini",
    "gpt-4.1-2025-04-14",
    "o3",
    "o4-mini-high",
    "o4-mini",
  ],
  mistral: ["mistral-small-2503", "open-mistral-nemo", "magistral-small-2506"],
};