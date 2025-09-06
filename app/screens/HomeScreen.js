import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';

const HomeScreen = () => {
  const [notificationCount] = useState(3);

  const handleScanProduct = () => {
    router.push('/screens/ScanProductScreen');
  };

  const handleViewProfile = () => {
    router.push('/screens/HealthProfileScreen');
  };

  const handleAnalysisHistory = () => {
    router.push('/screens/AnalysisHistoryScreen');
  };

  const handleChatBot = () => {
    router.push('/screens/ChatBotScreen');
  };

  const handleNotificationPress = () => {
    Alert.alert('Thông báo', `Bạn có ${notificationCount} thông báo mới`);
  };

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} />
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>HealthScan Pro</Text>
              <Text style={styles.headerSubtitle}>Sức khỏe thông minh</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
            <Ionicons name="notifications-outline" size={24} color="white" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        decelerationRate="fast"
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Daily Information Card */}
        <View style={styles.dailyInfoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="flask" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Thông tin mỗi ngày</Text>
          </View>
          
          <View style={styles.vitaminDSection}>
            <View style={styles.vitaminDHeader}>
              <Text style={styles.vitaminDTitle}>Vitamin D</Text>
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Hôm nay</Text>
              </View>
            </View>
            
            <View style={styles.effectsSection}>
              <View style={styles.effectItem}>
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
                <Text style={styles.effectText}>Hỗ trợ hấp thụ canxi, tăng cường xương</Text>
              </View>
              
              <View style={styles.effectItem}>
                <View style={styles.warningIcon}>
                  <Ionicons name="warning" size={16} color="white" />
                </View>
                <Text style={styles.harmfulText}>Quá liều có thể gây buồn nôn, táo bón</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.mainActions}>
          <TouchableOpacity style={styles.mainActionButton} onPress={handleViewProfile}>
            <View style={styles.mainActionIconContainer}>
              <Ionicons name="person" size={32} color="#22C55E" />
            </View>
            <Text style={styles.mainActionText}>Xem Hồ Sơ Sức Khỏe</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainActionButton} onPress={handleScanProduct}>
            <View style={styles.mainActionIconContainer}>
              <Ionicons name="scan" size={32} color="#22C55E" />
            </View>
            <Text style={styles.mainActionText}>Quét Sản Phẩm</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainActions}>
          <TouchableOpacity style={styles.mainActionButton} onPress={handleChatBot}>
            <View style={styles.mainActionIconContainer}>
              <Ionicons name="chatbubble" size={32} color="#22C55E" />
            </View>
            <Text style={styles.mainActionText}>Trợ Lý AI</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainActionButton} onPress={handleAnalysisHistory}>
            <View style={styles.mainActionIconContainer}>
              <Ionicons name="time" size={32} color="#22C55E" />
            </View>
            <Text style={styles.mainActionText}>Lịch Sử Quét</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab="home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    position: 'relative',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#22C55E',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 50,
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mainActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 16,
  },
  mainActionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mainActionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#dcfce7',
  },
  mainActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  dailyInfoCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  vitaminDSection: {
    marginTop: 8,
  },
  vitaminDHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vitaminDTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  todayBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  todayBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  effectsSection: {
    gap: 12,
  },
  effectItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  warningIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  effectText: {
    fontSize: 14,
    color: '#22C55E',
    flex: 1,
  },
  harmfulText: {
    fontSize: 14,
    color: '#ef4444',
    flex: 1,
  },
});

export default HomeScreen;