import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Admin account credentials
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    fullName: 'Administrator',
    email: 'admin@healthscanpro.com',
    permissions: ['all'],
    avatar: '👑'
  };

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      setLoading(true);
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Lỗi khi load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      let userData = null;

      // Check if it's admin login
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        userData = {
          ...ADMIN_CREDENTIALS,
          id: 'admin-001',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
      } else {
        // For other users, create a basic user account
        userData = {
          id: `user-${Date.now()}`,
          username: username,
          role: 'user',
          fullName: username,
          email: `${username}@example.com`,
          permissions: ['basic'],
          avatar: '👤',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
      }

      // Save user to storage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (updatedData) => {
    try {
      const updatedUser = { ...user, ...updatedData, updatedAt: new Date().toISOString() };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Lỗi khi cập nhật user:', error);
      return { success: false, error: error.message };
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin' || user.permissions.includes('all')) {
      return true;
    }
    
    // Check specific permission
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

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    hasPermission,
    isAdmin,
    getUserRole,
    getUserDisplayName,
    getUserAvatar,
    ADMIN_CREDENTIALS
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

