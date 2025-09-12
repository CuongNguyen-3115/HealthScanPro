import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  FlatList,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getScanHistory, deleteScanResult, getScanStatistics } from '../lib/scanHistoryStorage';

const AnalysisHistoryScreen = () => {
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [statistics, setStatistics] = useState({
    totalScans: 0,
    averageScore: 0,
    bestScore: 0,
    worstScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      const [history, stats] = await Promise.all([
        getScanHistory(),
        getScanStatistics()
      ]);
      setAnalysisHistory(history);
      setStatistics(stats);
    } catch (error) {
      console.error('Lỗi tải lịch sử:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử quét');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa kết quả phân tích này?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteScanResult(itemId);
            if (result.success) {
              await loadHistoryData(); // Reload data
              Alert.alert('Thành công', result.message);
            } else {
              Alert.alert('Lỗi', result.message);
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    router.push('/HomeScreen');
  };

  const handleViewAnalysis = (item) => {
    // Navigate to ProductAnalysisScreen với dữ liệu đã lưu
    router.push({
      pathname: '/ProductAnalysisScreen',
      params: { 
        analysisResult: JSON.stringify(item.rawData),
        fromHistory: 'true'
      }
    });
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.historyItem} 
      onPress={() => handleViewAnalysis(item)}
    >
      <View style={styles.productImagePlaceholder}>
        <Ionicons name="scan-outline" size={30} color="#9ca3af" />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <Text style={styles.scanDate}>Quét ngày: {item.scanDate}</Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>Điểm</Text>
        <Text style={[
          styles.scoreValue,
          { color: (item.compatibilityScore || item.healthScore) >= 80 ? '#22C55E' : 
                   (item.compatibilityScore || item.healthScore) >= 60 ? '#f59e0b' : '#ef4444' }
        ]}>
          {item.compatibilityScore || item.healthScore}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Lịch Sử Quét</Text>
            <Text style={styles.headerSubtitle}>Xem lại các sản phẩm đã quét</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.totalScans}</Text>
            <Text style={styles.statLabel}>Sản phẩm đã quét</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.averageScore}</Text>
            <Text style={styles.statLabel}>Điểm TB</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.bestScore}</Text>
            <Text style={styles.statLabel}>Điểm cao nhất</Text>
          </View>
        </View>

        <FlatList
          data={analysisHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  historyItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  scanDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  scoreContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default AnalysisHistoryScreen;