import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import HamburgerMenu from '../../components/HamburgerMenu';

export default function DemoHamburger() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header với Hamburger Menu */}
      <View style={styles.header}>
        <HamburgerMenu />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Demo Hamburger</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Text style={styles.text}>🍔 Hamburger Menu nhỏ gọn!</Text>
        <Text style={styles.subtext}>Chỉ chiếm 1/6 màn hình</Text>
        <Text style={styles.subtext}>Kéo từ trái sang phải</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Tính năng:</Text>
          <Text style={styles.infoItem}>• Xem hồ sơ</Text>
          <Text style={styles.infoItem}>• Chỉnh sửa hồ sơ</Text>
          <Text style={styles.infoItem}>• Lịch sử chỉnh sửa</Text>
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
    marginBottom: 5
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginTop: 30,
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
  }
});
