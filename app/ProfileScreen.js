import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useHealthProfile } from '../contexts/HealthProfileContext';

const ProfileScreen = () => {
  const { healthProfile, hasProfile } = useHealthProfile();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Xử lý khi nhấn vào Chỉnh sửa hồ sơ
  const handleEditProfile = () => {
    router.push('/screens/UpdateProfileScreen');
  };

  // Xử lý khi nhấn vào Lịch sử thay đổi hồ sơ
  const handleHistory = () => {
    Alert.alert('Thông báo', 'Tính năng lịch sử thay đổi hồ sơ đang được phát triển');
  };

  // Xử lý khi nhấn vào Thiết lập ngôn ngữ
  const handleLanguageSettings = () => {
    Alert.alert(
      'Thiết lập ngôn ngữ',
      'Chọn ngôn ngữ cho ứng dụng',
      [
        {
          text: 'Tiếng Việt',
          onPress: () => Alert.alert('Thông báo', 'Đã chuyển sang Tiếng Việt')
        },
        {
          text: 'English',
          onPress: () => Alert.alert('Thông báo', 'Switched to English')
        },
        {
          text: 'Hủy',
          style: 'cancel'
        }
      ]
    );
  };

  // Xử lý khi nhấn vào Chuyển đổi giao diện
  const handleThemeToggle = () => {
    Alert.alert(
      'Giao diện',
      'Chọn giao diện cho ứng dụng',
      [
        {
          text: 'Giao diện sáng',
          onPress: () => {
            setIsDarkMode(false);
            Alert.alert('Thông báo', 'Đã chuyển sang giao diện sáng');
          }
        },
        {
          text: 'Giao diện tối',
          onPress: () => {
            setIsDarkMode(true);
            Alert.alert('Thông báo', 'Đã chuyển sang giao diện tối');
          }
        },
        {
          text: 'Hủy',
          style: 'cancel'
        }
      ]
    );
  };

  // Xử lý khi nhấn vào Đăng xuất
  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement logout logic
            Alert.alert('Thông báo', 'Đã đăng xuất thành công');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/screens/HomeScreen')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Image source={require('../assets/images/logo.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>Tôi</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <Ionicons name="create-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Profile Summary */}
        <View style={styles.profileSummary}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#22C55E" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{healthProfile.fullName || 'Người dùng'}</Text>
            <Text style={styles.profileSubtitle}>
              {hasProfile() ? 'Đã có hồ sơ sức khỏe' : 'Chưa có hồ sơ sức khỏe'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          
          {/* Xem hồ sơ sức khỏe */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/screens/HealthProfileScreen')}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-outline" size={20} color="#22C55E" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>Hồ sơ sức khỏe</Text>
              <Text style={styles.menuItemSubtitle}>Xem thông tin sức khỏe hiện có</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Chỉnh sửa hồ sơ */}
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="create-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>Chỉnh sửa hồ sơ</Text>
              <Text style={styles.menuItemSubtitle}>Cập nhật thông tin cá nhân</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Lịch sử thay đổi hồ sơ */}
          <TouchableOpacity style={styles.menuItem} onPress={handleHistory}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="time-outline" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>Lịch sử thay đổi hồ sơ</Text>
              <Text style={styles.menuItemSubtitle}>Xem các thay đổi gần đây</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          
          {/* Thiết lập ngôn ngữ */}
          <TouchableOpacity style={styles.menuItem} onPress={handleLanguageSettings}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="language-outline" size={20} color="#06B6D4" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>Thiết lập ngôn ngữ</Text>
              <Text style={styles.menuItemSubtitle}>Chọn ngôn ngữ cho ứng dụng</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Giao diện sáng/tối */}
          <TouchableOpacity style={styles.menuItem} onPress={handleThemeToggle}>
            <View style={styles.menuIconContainer}>
              <Ionicons name={isDarkMode ? "moon-outline" : "sunny-outline"} size={20} color="#F59E0B" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>Giao diện</Text>
              <Text style={styles.menuItemSubtitle}>{isDarkMode ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          {/* Đăng xuất */}
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuItemTitle}>Đăng xuất</Text>
              <Text style={styles.menuItemSubtitle}>Thoát khỏi tài khoản</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#22C55E',
    borderBottomColor: '#16A34A',
    borderBottomWidth: 1,
    paddingTop: 30,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    paddingBottom: 100, // Space for bottom navigation
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuSection: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default ProfileScreen;