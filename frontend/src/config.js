// Centralized configuration
const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://atm-case-management.onrender.com/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'https://atm-case-management.onrender.com',
  appName: import.meta.env.VITE_APP_NAME || 'ATM Case Management',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
};

export const API_URL = config.apiUrl;
export const SOCKET_URL = config.socketUrl;

export default config;