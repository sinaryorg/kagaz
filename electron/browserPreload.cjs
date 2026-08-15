// Preload script executed BEFORE page scripts run inside WebBrowserDrawer webviews
const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

try {
  // Mock window.chrome for Google Auth verification
  if (!window.chrome) {
    window.chrome = {};
  }
  window.chrome.runtime = window.chrome.runtime || {};
  window.chrome.loadTimes = window.chrome.loadTimes || function() { return {}; };
  window.chrome.csi = window.chrome.csi || function() { return {}; };
  window.chrome.app = window.chrome.app || {};

  // Force desktop screen dimensions so Google Auth never switches to mobile passkey layout on narrow sidebar drawer widths
  try {
    Object.defineProperty(window.screen, 'width', { get: () => 1920, configurable: true });
    Object.defineProperty(window.screen, 'height', { get: () => 1080, configurable: true });
    Object.defineProperty(window.screen, 'availWidth', { get: () => 1920, configurable: true });
    Object.defineProperty(window.screen, 'availHeight', { get: () => 1040, configurable: true });
  } catch (err) {}

  // Completely purge WebAuthn / PublicKeyCredential to prevent Passkey popups
  try {
    delete window.PublicKeyCredential;
    delete window.AuthenticatorResponse;
    delete window.AuthenticatorAssertionResponse;
    delete window.AuthenticatorAttestationResponse;
    delete window.Credential;
    
    Object.defineProperty(navigator, 'credentials', {
      get: () => undefined,
      configurable: true
    });
  } catch (err) {}

  // Override navigator properties to bypass embedded webview detection
  Object.defineProperty(navigator, 'userAgent', {
    get: () => desktopUA,
    configurable: true,
  });

  Object.defineProperty(navigator, 'appVersion', {
    get: () => '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    configurable: true,
  });

  Object.defineProperty(navigator, 'vendor', {
    get: () => 'Google Inc.',
    configurable: true,
  });

  Object.defineProperty(navigator, 'platform', {
    get: () => 'Win32',
    configurable: true,
  });

  // Mock High-Entropy UserAgentData for Google Anti-Bot Checks
  Object.defineProperty(navigator, 'userAgentData', {
    get: () => ({
      brands: [
        { brand: 'Google Chrome', version: '131' },
        { brand: 'Chromium', version: '131' },
        { brand: 'Not_A Brand', version: '24' }
      ],
      mobile: false,
      platform: 'Windows',
      getHighEntropyValues: async () => ({
        architecture: 'x86',
        bitness: '64',
        brands: [
          { brand: 'Google Chrome', version: '131' },
          { brand: 'Chromium', version: '131' },
          { brand: 'Not_A Brand', version: '24' }
        ],
        fullVersionList: [
          { brand: 'Google Chrome', version: '131.0.6778.86' },
          { brand: 'Chromium', version: '131.0.6778.86' },
          { brand: 'Not_A Brand', version: '24.0.0.0' }
        ],
        mobile: false,
        model: '',
        platform: 'Windows',
        platformVersion: '15.0.0',
        uaFullVersion: '131.0.6778.86'
      })
    }),
    configurable: true,
  });

  // Remove Electron & Automation flags
  delete window.process;
  delete window.Buffer;
  delete navigator.webdriver;

  // Enforce desktop layout viewport on Google pages
  window.addEventListener('DOMContentLoaded', () => {
    try {
      if (window.location.hostname.includes('google.com')) {
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'viewport';
          document.head.appendChild(meta);
        }
        meta.content = 'width=1024, initial-scale=1.0';
      }
    } catch (e) {}
  });
} catch (e) {
  // Silent catch
}
