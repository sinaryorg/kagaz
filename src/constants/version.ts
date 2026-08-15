/**
 * Single source of truth for Application Version.
 * Injected automatically from package.json via Vite build process.
 */
export const APP_VERSION = import.meta.env.APP_VERSION || '1.0.0';
