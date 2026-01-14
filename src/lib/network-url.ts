/**
 * Utility functions for getting network URLs
 */

/**
 * Gets the current page URL
 * Note: In a browser environment, we cannot directly detect the network IP.
 * Returns the current window location URL as-is.
 * For localhost URLs, users may need to manually replace 'localhost' with their network IP.
 * @returns string The current page URL
 */
export function getNetworkUrl(): string {
  return window.location.href;
}

/**
 * Checks if the current URL is a localhost URL
 * @returns boolean True if the URL is localhost
 */
export function isLocalhostUrl(): boolean {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}
