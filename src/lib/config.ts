interface RuntimeConfig {
  app: string;
  serverUrl: string;
}

let cachedConfig: RuntimeConfig | null = null;

/**
 * Loads the runtime configuration from the public runtime.config.json file.
 * This allows the server URL to be configured at deployment time without rebuilding the app.
 * @returns Promise that resolves to the runtime configuration
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/runtime.config.json');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status}`);
    }
    cachedConfig = await response.json();
    return cachedConfig;
  } catch (error) {
    console.error('Failed to load runtime config, using defaults:', error);
    // Fallback to default config
    cachedConfig = {
      app: 'd714b953697bb20df0a3',
      serverUrl: 'http://localhost:5000'
    };
    return cachedConfig;
  }
}

/**
 * Gets the configured server URL for API requests.
 * If config hasn't been loaded yet, returns empty string.
 * @returns The server URL or empty string if not loaded
 */
export function getServerUrl(): string {
  return cachedConfig?.serverUrl || '';
}

/**
 * Constructs a full API URL from a relative path
 * @param path - The API endpoint path (e.g., '/analyze_and_profile')
 * @returns Full URL to the API endpoint
 */
export function getApiUrl(path: string): string {
  const serverUrl = getServerUrl();
  if (!serverUrl) {
    // If no server URL configured, use relative path (proxy mode)
    return path;
  }
  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Remove trailing slash from serverUrl if present
  const cleanServerUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
  return `${cleanServerUrl}/${cleanPath}`;
}
