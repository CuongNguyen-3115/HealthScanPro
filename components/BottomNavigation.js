import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const { width } = Dimensions.get('window');

const BottomNavigation = ({ activeTab = 'home' }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Tự động cập nhật active tab dựa trên route hiện tại
  useEffect(() => {
    if (pathname.includes('/screens/HomeScreen')) {
      setCurrentTab('home');
    } else if (pathname.includes('/screens/NutrientsScreen')) {
      setCurrentTab('nutrients');
    } else if (pathname.includes('/screens/ScanProductScreen')) {
      setCurrentTab('scan');
    } else if (pathname.includes('/screens/AnalysisHistoryScreen')) {
      setCurrentTab('history');
    } else if (pathname.includes('/screens/ProfileScreen')) {
      setCurrentTab('profile');
    }
  }, [pathname]);

  const navigationItems = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: 'home-outline',
      activeIcon: 'home',
      color: '#22C55E'
    },
    {
      id: 'nutrients',
      label: 'Các Chất',
      icon: 'leaf-outline',
      activeIcon: 'leaf',
      color: '#6B7280'
    },
    {
      id: 'scan',
      label: 'Quét sản phẩm',
      icon: 'qr-code-outline',
      activeIcon: 'qr-code',
      color: '#22C55E',
      isCenter: true
    },
    {
      id: 'history',
      label: 'Lịch sử',
      icon: 'time-outline',
      activeIcon: 'time',
      color: '#6B7280',
      hasNotification: true
    },
    {
      id: 'profile',
      label: 'Tôi',
      icon: 'person-outline',
      activeIcon: 'person',
      color: '#6B7280'
    }
  ];

  const handleTabPress = (item) => {
    // Nếu đang ở tab hiện tại thì không làm gì
    if (currentTab === item.id) {
      return;
    }
    
    setCurrentTab(item.id);
    
    switch (item.id) {
      case 'home':
        // Luôn navigate về trang chủ, không quan trọng đang ở đâu
        router.replace('/screens/HomeScreen');
        break;
      case 'nutrients':
        router.push('/screens/NutrientsScreen');
        break;
      case 'scan':
        router.push('/screens/ScanProductScreen');
        break;
      case 'history':
        router.push('/screens/AnalysisHistoryScreen');
        break;
      case 'profile':
        router.push('/screens/ProfileScreen');
        break;
      default:
        break;
    }
  };

  const renderTabItem = (item) => {
    const isActive = currentTab === item.id;
    const isCenter = item.isCenter;

    if (isCenter) {
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.centerTab}
          onPress={() => handleTabPress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.centerButton}>
            <Ionicons 
              name={isActive ? item.activeIcon : item.icon} 
              size={28} 
              color="white" 
            />
          </View>
          <View style={styles.centerLabel}>
            <Text style={styles.centerLabelText}>{item.label}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.tabItem}
        onPress={() => handleTabPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconContainer}>
          <Ionicons 
            name={isActive ? item.activeIcon : item.icon} 
            size={24} 
            color={isActive ? item.color : '#6B7280'} 
          />
          {item.hasNotification && (
            <View style={styles.notificationDot} />
          )}
        </View>
        <Text style={[
          styles.tabLabel,
          { color: isActive ? item.color : '#6B7280' }
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.navigationBar}>
        {navigationItems.map(renderTabItem)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 8,
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingTop: 8,
    height: 80,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  tabIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  centerTab: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  centerLabel: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  centerLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: 'white',
  },
});

export default BottomNavigation;
