import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import HamburgerMenu from '../../components/HamburgerMenu';

export default function TestSlide() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header với Hamburger Menu */}
      <View style={styles.header}>
        <HamburgerMenu />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Test Slide Menu</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Text style={styles.text}>🍔 Hamburger Menu mới!</Text>
        <Text style={styles.subtext}>Chỉ kéo một phần từ trái</Text>
        <Text style={styles.subtext}>Không phải toàn bộ màn hình</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Tính năng mới:</Text>
          <Text style={styles.infoItem}>• Menu chỉ chiếm 25% màn hình</Text>
          <Text style={styles.infoItem}>• Chỉ kéo 15% từ trái sang</Text>
          <Text style={styles.infoItem}>• Animation mượt mà 300ms</Text>
          <Text style={styles.infoItem}>• Không che khuất nội dung chính</Text>
        </View>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Cách hoạt động:</Text>
          <Text style={styles.demoText}>1. Nhấn button 3 gạch</Text>
          <Text style={styles.demoText}>2. Menu kéo từ trái sang phải</Text>
          <Text style={styles.demoText}>3. Chỉ hiển thị một phần nhỏ</Text>
          <Text style={styles.demoText}>4. Nhấn bên ngoài để đóng</Text>
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
    borderColor: '#4CAF50'
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
  }
});
