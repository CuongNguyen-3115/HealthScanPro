import { Platform } from 'react-native';

// Helper function to get local IP address
const getLocalIPAddress = () => {
  // Trên iOS Simulator hoặc iPhone thật, cần dùng IP thật của máy
  // Trên Android Emulator, dùng 10.0.2.2
  // Trên web, dùng localhost
  
  if (Platform.OS === 'web') {
    return 'localhost';
  } else if (Platform.OS === 'ios') {
    // Trên iOS, cần dùng IP thật của máy host
    // Các IP phổ biến - bạn có thể thay đổi theo IP thật của máy
    const possibleIPs = [
      '192.168.1.100',  // IP mặc định
      '192.168.0.100',  // IP phổ biến khác
      '10.0.0.100',     // IP mạng khác
      '172.20.10.1',    // IP hotspot iPhone
    ];
    
    // IP thật của máy bạn
    return '192.168.0.118';
  } else if (Platform.OS === 'android') {
    // Trên Android Emulator, dùng 10.0.2.2
    return '10.0.2.2';
  }
  
  return 'localhost';
};

// API Configuration
const API_CONFIG = {
  // Base URL for backend API - adjust based on platform
  BASE_URL: `http://${getLocalIPAddress()}:8888`,
  
  // Export BASE_URL for direct use
  API_BASE_URL: `http://${getLocalIPAddress()}:8888`,
  
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY: '/api/auth/verify',
    LOGOUT: '/api/auth/logout',
    CREATE_ADMIN: '/api/auth/create-admin',
  },
  
  // Health Profile endpoints
  HEALTH_PROFILES: {
    GET: '/api/health-profiles',
    CREATE: '/api/health-profiles',
    UPDATE: '/api/health-profiles',
    SET_CURRENT: '/api/health-profiles',
  },
  
  // Image Analysis endpoints
  IMAGE_ANALYSIS: {
    ANALYZE: '/label/analyze',
    ADVICE: '/advice',
    DETAILED_ANALYSIS: '/detailed-analysis',
    RECOMMEND: '/recommend',
    CHAT: '/chat',
    ASR: '/asr',
  },
  
  // Health check endpoints
  HEALTH: {
    CHECK: '/api/health',
    INFO: '/_health',
  }
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth token from storage
export const getAuthToken = async () => {
  try {
    // You can implement token storage logic here
    // For now, return null
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to set auth token in storage
export const setAuthToken = async (token) => {
  try {
    // You can implement token storage logic here
    // For now, just log it
    console.log('Token set:', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

// Export API_CONFIG as named export
export { API_CONFIG };

// Export API_BASE_URL for direct use
export const API_BASE_URL = API_CONFIG.API_BASE_URL;

// Also export as default for backward compatibility
export default API_CONFIG;


