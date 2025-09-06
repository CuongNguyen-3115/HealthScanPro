import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import CompactHamburger from '../../components/CompactHamburger';

export default function TestMenuFunctions() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header với Hamburger Menu */}
      <View style={styles.header}>
        <CompactHamburger />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Test Menu Functions</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Text style={styles.text}>🍔 Hamburger Menu với Logic xử lý!</Text>
        <Text style={styles.subtext}>Nhấn vào button 3 gạch để mở menu</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Các chức năng menu:</Text>
          <Text style={styles.infoItem}>• 🧑 Hồ sơ → Điều hướng đến ProfileScreen</Text>
          <Text style={styles.infoItem}>• ✏️ Chỉnh sửa → Điều hướng đến UpdateProfileScreen</Text>
          <Text style={styles.infoItem}>• ⏰ Lịch sử → Điều hướng đến EditHistoryScreen</Text>
        </View>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Cách hoạt động:</Text>
          <Text style={styles.demoText}>1. Nhấn button 3 gạch</Text>
          <Text style={styles.demoText}>2. Menu kéo từ trái sang phải</Text>
          <Text style={styles.demoText}>3. Nhấn vào từng chức năng</Text>
          <Text style={styles.demoText}>4. Menu tự động đóng và điều hướng</Text>
        </View>

        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>Tính năng mới:</Text>
          <Text style={styles.featureItem}>✅ Không có overlay che phủ</Text>
          <Text style={styles.featureItem}>✅ Logic xử lý cho từng menu item</Text>
          <Text style={styles.featureItem}>✅ Điều hướng tự động</Text>
          <Text style={styles.featureItem}>✅ Xử lý lỗi với Alert</Text>
          <Text style={styles.featureItem}>✅ Console logs để debug</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1fef4'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#e4f7f3'
  },
  headerContent: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black'
  },
  headerRight: {
    width: 50
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 10
  },
  subtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 10,
    textAlign: 'center'
  },
  infoItem: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5
  },
  demoBox: {
    backgroundColor: '#e8f5e8',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 20
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 10,
    textAlign: 'center'
  },
  demoText: {
    fontSize: 14,
    color: '#388E3C',
    marginBottom: 5
  },
  featureBox: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3'
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 10,
    textAlign: 'center'
  },
  featureItem: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 5
  }
});
