// Centralized config loader with validation (restored from previous plan)

// Required environment variables for this service
export const REQUIRED_VARS = [
  "DATABASE_PATH",
  "API_PORT",
  "API_HOST",
  "DASHBOARD_PORT",
  "JWT_SECRET",
  "LOG_LEVEL",
  "WHATSAPP_CLOUD_API_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "THREADS_ACCESS_TOKEN",
  // Twitter integration credentials
  "TWITTER_BEARER_TOKEN",
  "TWITTER_API_KEY",
  "TWITTER_API_SECRET",
];

// Load and validate configuration from environment
export function loadConfig(): { [key: string]: string } {
  const config: { [key: string]: string } = {};
  for (const key of REQUIRED_VARS) {
    const value = (process.env as any)[key];
    if (!value) {
      throw new Error(`Missing required env var: ${key}`);
    }
    (config as any)[key] = value as string;
  }
  // Optional: additional secrets for webhook/path-based usage
  if ((process.env as any)["WHATSAPP_WEBJS_API_KEY"]) {
    (config as any)["WHATSAPP_WEBJS_API_KEY"] = (process.env as any)["WHATSAPP_WEBJS_API_KEY"];
  }
  return config;
}

// Public accessor returning the canonical config used by the app
export type AppConfig = {
  DATABASE_PATH: string;
  API_PORT: string;
  API_HOST: string;
  DASHBOARD_PORT: string;
  JWT_SECRET: string;
  LOG_LEVEL: string;
  WHATSAPP_CLOUD_API_TOKEN: string;
  TELEGRAM_BOT_TOKEN: string;
  THREADS_ACCESS_TOKEN?: string;
  WHATSAPP_WEBJS_API_KEY?: string;
  TWITTER_BEARER_TOKEN?: string;
  TWITTER_API_KEY?: string;
  TWITTER_API_SECRET?: string;
};

export function getConfig(): AppConfig {
  const cfg = loadConfig();
  // Type assertions for required keys (guaranteed by loadConfig)
  const result: AppConfig = {
    DATABASE_PATH: cfg.DATABASE_PATH,
    API_PORT: cfg.API_PORT,
    API_HOST: cfg.API_HOST,
    DASHBOARD_PORT: cfg.DASHBOARD_PORT,
    JWT_SECRET: cfg.JWT_SECRET,
    LOG_LEVEL: cfg.LOG_LEVEL,
    WHATSAPP_CLOUD_API_TOKEN: cfg.WHATSAPP_CLOUD_API_TOKEN,
    TELEGRAM_BOT_TOKEN: cfg.TELEGRAM_BOT_TOKEN,
  } as AppConfig;
  // Optional threads access token
  if ((cfg as any).THREADS_ACCESS_TOKEN) {
    (result as any).THREADS_ACCESS_TOKEN = (cfg as any).THREADS_ACCESS_TOKEN;
  }
  if ((cfg as any).WHATSAPP_WEBJS_API_KEY) {
    result.WHATSAPP_WEBJS_API_KEY = (cfg as any).WHATSAPP_WEBJS_API_KEY;
  }
  if ((cfg as any).TWITTER_BEARER_TOKEN) {
    result.TWITTER_BEARER_TOKEN = (cfg as any).TWITTER_BEARER_TOKEN;
  }
  if ((cfg as any).TWITTER_API_KEY) {
    result.TWITTER_API_KEY = (cfg as any).TWITTER_API_KEY;
  }
  if ((cfg as any).TWITTER_API_SECRET) {
    result.TWITTER_API_SECRET = (cfg as any).TWITTER_API_SECRET;
  }
  return result;
}
