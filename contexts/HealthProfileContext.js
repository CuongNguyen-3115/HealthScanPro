import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../app/config/api';

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

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth.split('/').reverse().join('-'));
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Load profile từ MongoDB và AsyncStorage khi khởi động
  useEffect(() => {
    loadProfile();
  }, []);

  // Load profile từ MongoDB và AsyncStorage
  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Thử load từ AsyncStorage trước (cache local)
      const savedProfile = await AsyncStorage.getItem('healthProfile');
      if (savedProfile) {
        setHealthProfile(JSON.parse(savedProfile));
      }
      
      // Sau đó load từ MongoDB để đồng bộ
      const savedUser = await AsyncStorage.getItem('user');
      const savedToken = await AsyncStorage.getItem('token');
      if (savedUser && savedToken) {
        const user = JSON.parse(savedUser);
        const userId = user._id || user.id;
        
        const response = await fetch(`${API_BASE_URL}/api/health-profiles/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });
        
        const result = await response.json();
        
        if (result.success && result.health_profile) {
          // Chuyển đổi format từ MongoDB về format local
          const localProfile = {
            fullName: result.health_profile.basic?.name || '',
            dateOfBirth: '', // Cần tính ngược từ age
            gender: result.health_profile.basic?.gender || '',
            height: result.health_profile.basic?.height?.toString() || '',
            weight: result.health_profile.basic?.weight?.toString() || '',
            bloodType: result.health_profile.medical?.bloodType || '',
            chronicDiseases: result.health_profile.conditions?.selected?.join(', ') || '',
            allergies: result.health_profile.allergies || [],
            phoneNumber: result.health_profile.contact?.phone || '',
            email: result.health_profile.contact?.email || '',
            address: result.health_profile.contact?.address || '',
            healthGoals: result.health_profile.goals?.selected?.join(', ') || '',
            exerciseFrequency: result.health_profile.basic?.activityLevel || '',
            dietType: result.health_profile.goals?.note || '',
            id: result.health_profile._id,
            createdAt: result.health_profile.createdAt,
            updatedAt: result.health_profile.updatedAt
          };
          
          setHealthProfile(localProfile);
          await AsyncStorage.setItem('healthProfile', JSON.stringify(localProfile));
        }
      }
    } catch (error) {
      console.error('Lỗi khi load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lưu profile vào MongoDB và AsyncStorage
  const saveProfile = async (profileData) => {
    try {
      // Lấy user ID từ AsyncStorage (giả sử đã có sau khi login)
      const savedUser = await AsyncStorage.getItem('user');
      const savedToken = await AsyncStorage.getItem('token');
      if (!savedUser || !savedToken) {
        return { success: false, error: 'Chưa đăng nhập' };
      }
      
      const user = JSON.parse(savedUser);
      const userId = user._id || user.id;
      
      // Chuẩn bị dữ liệu để gửi lên server
      const profileToSave = {
        name: 'Hồ sơ chính',
        basic: {
          age: calculateAge(profileData.dateOfBirth),
          gender: profileData.gender,
          weight: profileData.weight ? parseFloat(profileData.weight) : null,
          height: profileData.height ? parseFloat(profileData.height) : null,
          activityLevel: profileData.exerciseFrequency || 'Trung bình'
        },
        conditions: {
          selected: profileData.chronicDiseases ? [profileData.chronicDiseases] : [],
          other: ''
        },
        allergies: profileData.allergies || [],
        goals: {
          selected: profileData.healthGoals ? [profileData.healthGoals] : [],
          note: profileData.dietType || ''
        },
        contact: {
          phone: profileData.phoneNumber || '',
          email: profileData.email || '',
          address: profileData.address || ''
        },
        medical: {
          bloodType: profileData.bloodType || '',
          chronicDiseases: profileData.chronicDiseases || ''
        }
      };
      
      // Gửi lên server MongoDB
      const response = await fetch(`${API_BASE_URL}/api/health-profiles/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify(profileToSave)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Lưu vào AsyncStorage để cache local
        const localProfile = {
          ...profileData,
          id: result.health_profile._id,
          createdAt: result.health_profile.createdAt,
          updatedAt: result.health_profile.updatedAt
        };
        
        await AsyncStorage.setItem('healthProfile', JSON.stringify(localProfile));
        setHealthProfile(localProfile);
        
        console.log('Đã lưu hồ sơ sức khỏe vào MongoDB:', result.health_profile);
        return { success: true, profile: localProfile };
      } else {
        return { success: false, error: result.error || 'Không thể lưu hồ sơ' };
      }
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
