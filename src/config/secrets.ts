// Centralized environment configuration with basic validation
// This module intentionally keeps logic small and deterministic.

// List of required environment variables for runtime validation
export const REQUIRED_VARS = [
  'DATABASE_PATH',
  'API_PORT',
  'API_HOST',
  'DASHBOARD_PORT',
  'JWT_SECRET',
  'LOG_LEVEL'
] as const;
export type RequiredVar = typeof REQUIRED_VARS[number];

/**
 * loadConfig validates that all required environment variables are present.
 * Throws an Error if any are missing. Call this at startup before using config.
 */
export function loadConfig(): void {
  const missing = (REQUIRED_VARS as readonly string[]).filter((key) => {
    // Ensure we treat empty strings as missing as well
    const val = process.env[key];
    return val === undefined || val === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Convenience: return a small config object for the required vars.
 * This does not attempt to coerce types; values are strings.
 */
export function getConfig(): Record<string, string> {
  const cfg: Record<string, string> = {};
  for (const key of REQUIRED_VARS) {
    cfg[key] = (process.env[key] as string) ?? '';
  }
  return cfg;
}
