// Centralized configuration - HARDCODED FOR PRODUCTION
const config = {
  apiUrl: 'https://atm-case-management.onrender.com/api',
  socketUrl: 'https://atm-case-management.onrender.com',
  appName: 'ATM Case Management',
  version: '1.0.0',
  isProduction: true,
  isDevelopment: false,
};

export const API_URL = config.apiUrl;
export const SOCKET_URL = config.socketUrl;

export default config;