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
    // Bạn cần thay đổi IP này thành IP thật của máy
    return '192.168.1.100'; // Thay đổi thành IP thật của máy
  } else if (Platform.OS === 'android') {
    // Trên Android Emulator, dùng 10.0.2.2
    return '10.0.2.2';
  }
  
  return 'localhost';
};

// API Configuration
const API_CONFIG = {
  // Base URL for backend API - adjust based on platform
  BASE_URL: `http://${getLocalIPAddress()}:5000/api`,
  
  // Export BASE_URL for direct use
  API_BASE_URL: `http://${getLocalIPAddress()}:5000/api`,
  
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot',
    VERIFY_OTP: '/auth/verify-otp',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Profile endpoints
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
    DELETE: '/profile',
  },
  
  // Image Analysis endpoints
  IMAGE_ANALYSIS: {
    ANALYZE: '/image-analysis/analyze',
    HISTORY: '/image-analysis/history',
    DETAIL: '/image-analysis/detail',
    DELETE: '/image-analysis/delete',
    STATS: '/image-analysis/stats',
    TRENDS: '/image-analysis/trends',
    TOP_PRODUCTS: '/image-analysis/top-products',
    EXPORT: '/image-analysis/export',
  },
  
  // Scan endpoints
  SCAN: {
    UPLOAD: '/scan/upload',
    ANALYZE: '/scan/analyze',
  },
  
  // Search endpoints
  SEARCH: {
    PRODUCTS: '/search/products',
    INGREDIENTS: '/search/ingredients',
  },
  
  // Health check endpoints
  HEALTH: {
    CHECK: '/health',
    INFO: '/info',
    DEBUG: '/debug',
    TEST_UPLOAD: '/test-upload',
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

export default API_CONFIG;

// Export API_BASE_URL for direct use
export const API_BASE_URL = API_CONFIG.API_BASE_URL;


