export interface AIConfig {
  enableCloudAI: boolean;
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  preferExpertFirst: boolean;
}

const STORAGE_KEY = 'cardiag-ai-config';

const DEFAULT_CONFIG: AIConfig = {
  enableCloudAI: false,
  apiKey: '',
  apiBaseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  preferExpertFirst: true,
};

export function getAIConfig(): AIConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveAIConfig(config: Partial<AIConfig>): AIConfig {
  const merged = { ...getAIConfig(), ...config };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }
  return merged;
}

export function isCloudAIReady(): boolean {
  const cfg = getAIConfig();
  return cfg.enableCloudAI && cfg.apiKey.trim().length > 10;
}
