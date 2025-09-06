import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HealthProfileContext = createContext();

export const useHealthProfile = () => {
  const context = useContext(HealthProfileContext);
  if (!context) {
    throw new Error('useHealthProfile must be used within a HealthProfileProvider');
  }
  return context;
};

export const HealthProfileProvider = ({ children }) => {
  const [healthProfile, setHealthProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load profile từ AsyncStorage khi khởi động
  useEffect(() => {
    loadProfile();
  }, []);

  // Load profile từ AsyncStorage
  const loadProfile = async () => {
    try {
      setLoading(true);
      const savedProfile = await AsyncStorage.getItem('healthProfile');
      if (savedProfile) {
        setHealthProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Lỗi khi load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lưu profile vào AsyncStorage
  const saveProfile = async (profileData) => {
    try {
      const profileToSave = {
        ...profileData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('healthProfile', JSON.stringify(profileToSave));
      setHealthProfile(profileToSave);
      
      console.log('Đã lưu hồ sơ sức khỏe:', profileToSave);
      return { success: true, profile: profileToSave };
    } catch (error) {
      console.error('Lỗi khi lưu profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Cập nhật profile
  const updateProfile = async (updatedData) => {
    try {
      const profileToUpdate = {
        ...healthProfile,
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('healthProfile', JSON.stringify(profileToUpdate));
      setHealthProfile(profileToUpdate);
      
      console.log('Đã cập nhật hồ sơ sức khỏe:', profileToUpdate);
      return { success: true, profile: profileToUpdate };
    } catch (error) {
      console.error('Lỗi khi cập nhật profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Xóa profile
  const deleteProfile = async () => {
    try {
      await AsyncStorage.removeItem('healthProfile');
      setHealthProfile(null);
      
      console.log('Đã xóa hồ sơ sức khỏe');
      return { success: true };
    } catch (error) {
      console.error('Lỗi khi xóa profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Kiểm tra xem có profile chưa
  const hasProfile = () => {
    return healthProfile !== null;
  };

  const value = {
    healthProfile,
    loading,
    saveProfile,
    updateProfile,
    deleteProfile,
    hasProfile,
    loadProfile
  };

  return (
    <HealthProfileContext.Provider value={value}>
      {children}
    </HealthProfileContext.Provider>
  );
};
