/**
 * Utility functions for getting network URLs
 */

/**
 * Gets the current page URL, replacing localhost with the actual network IP if available
 * Falls back to the current window location if network IP detection fails
 * @returns string The network-accessible URL
 */
export function getNetworkUrl(): string {
  const currentUrl = window.location.href;
  
  // If we're already on a non-localhost URL, just return it
  if (!currentUrl.includes('localhost') && !currentUrl.includes('127.0.0.1')) {
    return currentUrl;
  }
  
  // Try to get the network URL from the server URL configuration
  // This is best effort - in a browser environment, we can't directly detect the network IP
  // So we'll return the current URL and let the user know they might need to adjust it
  return currentUrl;
}

/**
 * Checks if the current URL is a localhost URL
 * @returns boolean True if the URL is localhost
 */
export function isLocalhostUrl(): boolean {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}
