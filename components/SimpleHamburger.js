import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.25; // Tăng lên một chút để dễ nhìn
const SLIDE_DISTANCE = width * 0.15; // Chỉ kéo một phần nhỏ

const SimpleHamburger = () => {
  const [open, setOpen] = useState(false);
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
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => setOpen(false)}
        >
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
            <View style={styles.menuItem}>
              <Ionicons name="person-outline" size={18} color="#007AFF" />
              <Text style={styles.menuItemText}>Hồ sơ</Text>
            </View>

            <View style={styles.menuItem}>
              <Ionicons name="create-outline" size={18} color="#007AFF" />
              <Text style={styles.menuItemText}>Chỉnh sửa</Text>
            </View>

            <View style={styles.menuItem}>
              <Ionicons name="time-outline" size={18} color="#007AFF" />
              <Text style={styles.menuItemText}>Lịch sử</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
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
    width: width * 0.3, // Chỉ che phủ 30% màn hình bên trái
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
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E'
  },
  closeButton: {
    padding: 4
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
    marginLeft: 8
  }
});

export default SimpleHamburger;
