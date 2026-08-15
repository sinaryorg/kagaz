import { APP_VERSION } from './version';

/**
 * Centralized Application Configuration & API Endpoints
 * Reads from environment variables with production fallbacks.
 */
export const API_CONFIG = {
  APP_VERSION,
  UPDATE_CHECK_URL: import.meta.env.VITE_UPDATE_CHECK_URL || 'https://api.sinary.org/updates/kagaz/stable/version.json',
  LEARN_URL: import.meta.env.VITE_LEARN_URL || 'https://updates.sinary.org/updates/notification/kagaz/learn/index.html',
};
