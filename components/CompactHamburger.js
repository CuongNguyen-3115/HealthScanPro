import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions, Animated, TouchableWithoutFeedback, Alert, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthProfile } from '../../contexts/HealthProfileContext';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.5; // Menu chiếm 50% màn hình

const CompactHamburger = () => {
  const [open, setOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const { healthProfile, hasProfile } = useHealthProfile();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;

  useEffect(() => {
    if (open) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [open, slideAnim]);





  // Xử lý khi nhấn vào Thiết lập ngôn ngữ
  const handleLanguageSettings = () => {
    setOpen(false);
    Alert.alert(
      'Thiết lập ngôn ngữ',
      'Chọn ngôn ngữ cho ứng dụng:',
      [
        {
          text: 'Tiếng Việt',
          onPress: () => {
            // TODO: Implement language change to Vietnamese
            console.log('Chuyển sang Tiếng Việt');
          }
        },
        {
          text: 'English',
          onPress: () => {
            // TODO: Implement language change to English
            console.log('Switch to English');
          }
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
    setOpen(false);
    Alert.alert(
      'Chọn giao diện',
      'Chọn giao diện cho ứng dụng:',
      [
        {
          text: 'Giao diện sáng',
          onPress: () => {
            setIsDarkMode(false);
            console.log('Chuyển sang giao diện sáng');
          }
        },
        {
          text: 'Giao diện tối',
          onPress: () => {
            setIsDarkMode(true);
            console.log('Chuyển sang giao diện tối');
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
    setOpen(false);
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement logout logic
            console.log('Đăng xuất');
            router.replace('/LoginScreen');
          }
        }
      ]
    );
  };

  return (
    <View>
      {/* Hamburger Button */}
      <TouchableOpacity 
        style={styles.hamburger} 
        onPress={() => setOpen(true)}
      >
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      {/* Modal Menu */}
      <Modal 
        transparent 
        visible={open} 
        animationType="none" 
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.modalContainer}>
            {/* Menu drawer - không có overlay che phủ */}
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.menuTitle}>Menu</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setOpen(false)}
                  >
                    <Ionicons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Menu Items */}

                <View style={styles.separator} />

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleLanguageSettings}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="language-outline" size={22} color="#06B6D4" />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>Thiết lập ngôn ngữ</Text>
                    <Text style={styles.menuItemSubtitle}>Chọn ngôn ngữ</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleThemeToggle}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={isDarkMode ? "moon-outline" : "sunny-outline"} size={22} color="#F59E0B" />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>
                      {isDarkMode ? "Giao diện sáng" : "Giao diện tối"}
                    </Text>
                    <Text style={styles.menuItemSubtitle}>Thay đổi theme</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>Đăng xuất</Text>
                    <Text style={styles.menuItemSubtitle}>Thoát khỏi ứng dụng</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  hamburger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  line: {
    width: 20,
    height: 2,
    backgroundColor: '#333',
    marginVertical: 2,
    borderRadius: 1
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row'
  },
  drawer: {
    width: MENU_WIDTH,
    backgroundColor: '#fff',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F8F9FA',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 5
  },
  profileStatus: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#E0F2F7',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center'
  },
  profileStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF'
  },
  profileStatusSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: 'white',
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
    shadowOffset: { width: 0, height: 1 },
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
    lineHeight: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 15,
    marginHorizontal: 15
  },
  themeText: {
    color: '#FF9500'
  },
  logoutText: {
    color: '#FF3B30'
  }
});

export default CompactHamburger;
