import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.4; // Tăng lên 40% để rộng hơn
const SLIDE_DISTANCE = width * 0.2; // Tăng khoảng cách kéo

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH + SLIDE_DISTANCE)).current;

  useEffect(() => {
    if (open) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH + SLIDE_DISTANCE,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [open, slideAnim]);

  const handleMenuPress = (route) => {
    setOpen(false);
    router.push(route);
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'Hồ sơ',
      icon: 'person-outline',
      route: '/ProfileScreen',
      description: 'Xem thông tin'
    },
    {
      id: 'edit',
      title: 'Chỉnh sửa',
      icon: 'create-outline',
      route: '/UpdateProfileScreen',
      description: 'Cập nhật hồ sơ'
    },
    {
      id: 'history',
      title: 'Lịch sử',
      icon: 'time-outline',
      route: '/EditHistoryScreen',
      description: 'Xem thay đổi'
    }
  ];

  return (
    <View>
      <TouchableOpacity 
        style={styles.hamburger} 
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </TouchableOpacity>

      <Modal 
        transparent 
        visible={open} 
        animationType="none" 
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalContainer}>
          {/* Overlay chỉ che phủ bên trái */}
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={() => setOpen(false)}
          />
          
          {/* Menu drawer */}
          <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.menuTitle}>Menu</Text>
                  <Text style={styles.subtitle}>Quản lý hồ sơ</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setOpen(false)}
              >
                <Ionicons name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemContent}>
                    <View style={styles.iconContainer}>
                      <Ionicons name={item.icon} size={18} color="#007AFF" />
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      <Text style={styles.menuItemDescription}>{item.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>v1.0</Text>
            </View>
          </Animated.View>
        </View>
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
  overlay: {
    width: width * 0.4, // Che phủ 40% màn hình bên trái để phù hợp với menu rộng hơn
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row'
  },
  drawer: {
    width: MENU_WIDTH,
    backgroundColor: '#fff',
    flex: 1,
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
    paddingHorizontal: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F8F9FA'
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  headerText: {
    flex: 1
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400'
  },
  closeButton: {
    padding: 4
  },
  menuContainer: {
    flex: 1,
    paddingTop: 8
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  menuItemText: {
    flex: 1
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 14
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center'
  },
  footerText: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '400'
  }
});

export default HamburgerMenu;


