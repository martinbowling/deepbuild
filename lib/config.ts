type ModelType = 'deepseek' | 'hyperbolic';

interface ChatConfig {
  model: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
  stream: false;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface Config {
  deepseekKey: string | null;
  hyperbolicKey: string | null;
  selectedModel: ModelType;
  deepseekConfig: ChatConfig;
  hyperbolicConfig: ChatConfig;
  apiBase: {
    deepseek: string;
    hyperbolic: string;
  };
  advanced: {
    cacheEnabled: boolean;
    requestTimeout: number;
  };
}

// Initial configuration state
const INITIAL_CONFIG: Config = {
  deepseekKey: null,
  hyperbolicKey: null,
  selectedModel: 'deepseek',
  deepseekConfig: {
    model: 'deepseek-chat',
    max_tokens: 8000,
    temperature: 0.7,
    top_p: 0.9,
    stream: false,
    frequency_penalty: 0,
    presence_penalty: 0
  },
  hyperbolicConfig: {
    model: 'deepseek-ai/DeepSeek-V3',
    max_tokens: 512,
    temperature: 0.7,
    top_p: 0.9,
    stream: false,
    frequency_penalty: 0,
    presence_penalty: 0
  },
  apiBase: {
    deepseek: 'https://api.deepseek.com/v1',
    hyperbolic: 'https://api.hyperbolic.xyz'
  },
  advanced: {
    cacheEnabled: true,
    requestTimeout: 60000
  }
};

// Environment variable getters
const getEnvVar = (key: string): string | undefined => 
  process.env[key] || process.env[`NEXT_PUBLIC_${key}`] || undefined;

const getEnvBool = (key: string): boolean | undefined => {
  const val = process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
  return val ? val.toLowerCase() === 'true' : undefined;
};

const getEnvNumber = (key: string): number | undefined => {
  const val = process.env[key] || process.env[`NEXT_PUBLIC_${key}`];
  return val ? Number(val) : undefined;
};

// Get environment configuration
function getEnvConfig(): Partial<Config> {
  const config: Partial<Config> = {};
  
  const deepseekKey = getEnvVar('DEEPSEEK_API_KEY');
  const hyperbolicKey = getEnvVar('HYPERBOLIC_API_KEY');
  const selectedModel = getEnvVar('API_PROVIDER');
  
  if (deepseekKey) config.deepseekKey = deepseekKey;
  if (hyperbolicKey) config.hyperbolicKey = hyperbolicKey;
  if (selectedModel === 'deepseek' || selectedModel === 'hyperbolic') {
    config.selectedModel = selectedModel;
  }

  const envChatConfig: Partial<ChatConfig> = {
    model: getEnvVar('MODEL_VERSION'),
    max_tokens: getEnvNumber('MAX_TOKENS'),
    temperature: getEnvNumber('TEMPERATURE'),
    top_p: getEnvNumber('TOP_P'),
    stream: false,
    frequency_penalty: getEnvNumber('FREQUENCY_PENALTY'),
    presence_penalty: getEnvNumber('PRESENCE_PENALTY')
  };

  if (Object.keys(envChatConfig).some(k => envChatConfig[k as keyof ChatConfig] !== undefined)) {
    config.deepseekConfig = { ...INITIAL_CONFIG.deepseekConfig, ...envChatConfig };
    config.hyperbolicConfig = { ...INITIAL_CONFIG.hyperbolicConfig, ...envChatConfig };
  }

  const deepseekBase = getEnvVar('DEEPSEEK_API_BASE');
  const hyperbolicBase = getEnvVar('HYPERBOLIC_API_BASE');
  if (deepseekBase || hyperbolicBase) {
    config.apiBase = {
      deepseek: deepseekBase || INITIAL_CONFIG.apiBase.deepseek,
      hyperbolic: hyperbolicBase || INITIAL_CONFIG.apiBase.hyperbolic
    };
  }

  const cacheEnabled = getEnvBool('CACHE_ENABLED');
  const requestTimeout = getEnvNumber('REQUEST_TIMEOUT');
  if (cacheEnabled !== undefined || requestTimeout !== undefined) {
    config.advanced = {
      cacheEnabled: cacheEnabled ?? INITIAL_CONFIG.advanced.cacheEnabled,
      requestTimeout: requestTimeout ?? INITIAL_CONFIG.advanced.requestTimeout
    };
  }

  return config;
}

export function getConfig(): Config {
  // If running on server, use environment variables or initial config
  if (typeof window === 'undefined') {
    const envConfig = getEnvConfig();
    return { ...INITIAL_CONFIG, ...envConfig };
  }
  
  try {
    // Check localStorage first
    const stored = localStorage.getItem('ai-config');
    if (stored) {
      const storedConfig = JSON.parse(stored);
      // Merge with initial config to ensure all required fields exist
      return { ...INITIAL_CONFIG, ...storedConfig };
    }
  } catch (error) {
    console.warn('Error reading stored config:', error);
  }

  // Fall back to environment variables or initial config
  const envConfig = getEnvConfig();
  return { ...INITIAL_CONFIG, ...envConfig };
}

export function updateConfig(updates: Partial<Config>) {
  const current = getConfig();
  const newConfig = { ...current, ...updates };
  localStorage.setItem('ai-config', JSON.stringify(newConfig));
  return newConfig;
}

export function getActiveApiKey(): string | null {
  const config = getConfig();
  return config.selectedModel === 'deepseek' ? config.deepseekKey : config.hyperbolicKey;
}

export function getSelectedModel(): ModelType {
  return getConfig().selectedModel;
}

export function getActiveChatConfig(): ChatConfig {
  const config = getConfig();
  return config.selectedModel === 'deepseek' ? config.deepseekConfig : config.hyperbolicConfig;
}

export function isConfigured(): boolean {
  const config = getConfig();
  return (config.selectedModel === 'deepseek' && config.deepseekKey !== null) ||
         (config.selectedModel === 'hyperbolic' && config.hyperbolicKey !== null);
} 