import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../services/AuthService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      setLoading(true);
      const savedUser = await AsyncStorage.getItem('user');
      const savedToken = await AsyncStorage.getItem('token');
      
      if (savedUser && savedToken) {
        const userData = JSON.parse(savedUser);
        
        // Tạm thời set user mà không verify token để tránh block
        setUser(userData);
        setToken(savedToken);
        setIsAuthenticated(true);
        
        // Verify token trong background (không block UI)
        setTimeout(async () => {
          try {
            const verifyResult = await AuthService.verifyToken(savedToken);
            if (!verifyResult.success) {
              // Token không hợp lệ, xóa dữ liệu cũ
              await AsyncStorage.removeItem('user');
              await AsyncStorage.removeItem('token');
              setUser(null);
              setToken(null);
              setIsAuthenticated(false);
            }
          } catch (error) {
            console.error('Lỗi khi verify token:', error);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Lỗi khi load user:', error);
      // Xóa dữ liệu cũ nếu có lỗi
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      
      const result = await AuthService.login(username, password);
      
      if (result.success) {
        // Lưu user và token vào AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        await AsyncStorage.setItem('token', result.token);
        
        setUser(result.user);
        setToken(result.token);
        setIsAuthenticated(true);
        
        return { success: true, user: result.user, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      return { success: false, error: 'Có lỗi xảy ra khi đăng nhập' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      
      const result = await AuthService.register(userData);
      
      if (result.success) {
        return { success: true, user: result.user, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error);
      return { success: false, error: 'Có lỗi xảy ra khi đăng ký' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await AuthService.logout(token);
      }
      
      // Xóa dữ liệu khỏi AsyncStorage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      
      return { success: true, message: 'Đăng xuất thành công!' };
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      return { success: false, error: 'Có lỗi xảy ra khi đăng xuất' };
    }
  };

  const updateUser = async (updatedData) => {
    try {
      if (!token) {
        return { success: false, error: 'Chưa đăng nhập' };
      }

      const result = await AuthService.updateUser(user.id, updatedData, token);
      
      if (result.success) {
        // Cập nhật user trong state và AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        setUser(result.user);
        
        return { success: true, user: result.user, message: result.message };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật user:', error);
      return { success: false, error: 'Có lỗi xảy ra khi cập nhật' };
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admin có tất cả quyền
    if (user.role === 'admin' || user.permissions.includes('all')) {
      return true;
    }
    
    // Kiểm tra quyền cụ thể
    return user.permissions.includes(permission);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const getUserRole = () => {
    return user?.role || 'guest';
  };

  const getUserDisplayName = () => {
    return user?.fullName || user?.username || 'Guest';
  };

  const getUserAvatar = () => {
    return user?.avatar || '👤';
  };

  const checkConnection = async () => {
    return await AuthService.checkConnection();
  };

  const createAdminAccount = async () => {
    return await AuthService.createAdminAccount();
  };

  // ==== Health Profile Methods ====

  const getHealthProfiles = async () => {
    if (!user) {
      return { success: false, error: 'Chưa đăng nhập' };
    }
    return await AuthService.getHealthProfiles(user._id);
  };

  const createHealthProfile = async (profileData) => {
    if (!user) {
      return { success: false, error: 'Chưa đăng nhập' };
    }
    return await AuthService.createHealthProfile(user._id, profileData);
  };

  const updateHealthProfile = async (profileId, profileData) => {
    if (!user) {
      return { success: false, error: 'Chưa đăng nhập' };
    }
    return await AuthService.updateHealthProfile(user._id, profileId, profileData);
  };

  const setCurrentHealthProfile = async (profileId) => {
    if (!user) {
      return { success: false, error: 'Chưa đăng nhập' };
    }
    return await AuthService.setCurrentHealthProfile(user._id, profileId);
  };

  const hasHealthProfile = () => {
    return user?.health_profiles && user.health_profiles.length > 0;
  };

  const getCurrentHealthProfile = () => {
    if (!user || !user.health_profiles) return null;
    
    const currentProfileId = user.current_health_profile;
    if (!currentProfileId) return user.health_profiles[0] || null;
    
    return user.health_profiles.find(profile => profile.id === currentProfileId) || user.health_profiles[0] || null;
  };

  const value = {
    user, isAuthenticated, loading, token, login, register, logout, updateUser,
    hasPermission, isAdmin, getUserRole, getUserDisplayName, getUserAvatar,
    checkConnection, createAdminAccount,
    // Health Profile methods
    getHealthProfiles, createHealthProfile, updateHealthProfile, setCurrentHealthProfile,
    hasHealthProfile, getCurrentHealthProfile
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

