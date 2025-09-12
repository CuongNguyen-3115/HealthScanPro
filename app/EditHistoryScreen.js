import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useHealthProfile } from '../contexts/HealthProfileContext';

const EditHistoryScreen = () => {
  const { healthProfile, hasProfile } = useHealthProfile();

  if (!hasProfile()) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/screens/HomeScreen')}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch sử chỉnh sửa</Text>
        </View>
        
        <View style={styles.content}>
          <Ionicons name="time-outline" size={64} color="#999" />
          <Text style={styles.noHistoryText}>Bạn chưa có hồ sơ sức khỏe</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/CreateProfileScreen')}
          >
            <Text style={styles.createButtonText}>Tạo hồ sơ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Mock edit history data
  const editHistory = [
    {
      id: 1,
      date: healthProfile?.createdAt || new Date().toISOString(),
      action: 'Tạo hồ sơ',
      details: 'Tạo hồ sơ sức khỏe lần đầu'
    },
    {
      id: 2,
      date: healthProfile?.updatedAt || new Date().toISOString(),
      action: 'Cập nhật thông tin',
      details: 'Cập nhật thông tin cá nhân và sức khỏe'
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/screens/HomeScreen')}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử chỉnh sửa</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tổng quan</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng số lần chỉnh sửa:</Text>
            <Text style={styles.summaryValue}>{editHistory.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Lần cuối cập nhật:</Text>
            <Text style={styles.summaryValue}>
              {new Date(healthProfile?.updatedAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Chi tiết lịch sử</Text>
          
          {editHistory.map((item, index) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <View style={styles.historyIcon}>
                  <Ionicons 
                    name={item.action === 'Tạo hồ sơ' ? 'add-circle' : 'create'} 
                    size={20} 
                    color="#007AFF" 
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyAction}>{item.action}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.date).toLocaleDateString('vi-VN')} - {new Date(item.date).toLocaleTimeString('vi-VN')}
                  </Text>
                </View>
              </View>
              <Text style={styles.historyDetails}>{item.details}</Text>
              
              {index < editHistory.length - 1 && (
                <View style={styles.historyDivider} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
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
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  historyItem: {
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  historyDetails: {
    fontSize: 14,
    color: '#666',
    marginLeft: 52,
    lineHeight: 20,
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 20,
    marginLeft: 52,
  },
  noHistoryText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignSelf: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditHistoryScreen;
