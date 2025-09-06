import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import CompactHamburger from '../../components/CompactHamburger';
import { useHealthProfile } from '../../contexts/HealthProfileContext';

export default function TestHealthSystem() {
  const { 
    healthProfile, 
    hasProfile, 
    loading, 
    saveProfile, 
    updateProfile, 
    deleteProfile 
  } = useHealthProfile();

  const handleCreateSampleProfile = async () => {
    const sampleProfile = {
      name: 'Nguyễn Văn A',
      age: 30,
      weight: 70,
      height: 170,
      allergies: ['Đậu phộng', 'Hải sản'],
      healthConditions: ['Tiểu đường type 2'],
      medications: ['Metformin'],
      preferences: ['Ăn chay', 'Không đường'],
      emergencyContact: {
        name: 'Nguyễn Thị B',
        phone: '0123456789',
        relationship: 'Vợ'
      }
    };

    const result = await saveProfile(sampleProfile);
    if (result.success) {
      Alert.alert('Thành công', 'Đã tạo hồ sơ mẫu!');
    } else {
      Alert.alert('Lỗi', 'Không thể tạo hồ sơ: ' + result.error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!hasProfile()) {
      Alert.alert('Lỗi', 'Chưa có hồ sơ để cập nhật!');
      return;
    }

    const updatedData = {
      weight: 72,
      medications: ['Metformin', 'Vitamin D'],
      updatedAt: new Date().toISOString()
    };

    const result = await updateProfile(updatedData);
    if (result.success) {
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ!');
    } else {
      Alert.alert('Lỗi', 'Không thể cập nhật: ' + result.error);
    }
  };

  const handleDeleteProfile = async () => {
    if (!hasProfile()) {
      Alert.alert('Lỗi', 'Chưa có hồ sơ để xóa!');
      return;
    }

    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa hồ sơ sức khỏe?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteProfile();
            if (result.success) {
              Alert.alert('Thành công', 'Đã xóa hồ sơ!');
            } else {
              Alert.alert('Lỗi', 'Không thể xóa: ' + result.error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header với Hamburger Menu */}
      <View style={styles.header}>
        <CompactHamburger />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Test Health System</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Text style={styles.text}>🏥 Hệ thống Hồ sơ Sức khỏe!</Text>
        <Text style={styles.subtext}>Test các chức năng CRUD hoàn chỉnh</Text>
        
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>Trạng thái hiện tại:</Text>
          {loading ? (
            <Text style={styles.statusText}>🔄 Đang tải...</Text>
          ) : hasProfile() ? (
            <View>
              <Text style={styles.statusText}>✅ Có hồ sơ sức khỏe</Text>
              <Text style={styles.statusSubtext}>Tên: {healthProfile?.name}</Text>
              <Text style={styles.statusSubtext}>Tuổi: {healthProfile?.age}</Text>
              <Text style={styles.statusSubtext}>Cập nhật: {new Date(healthProfile?.updatedAt).toLocaleDateString('vi-VN')}</Text>
            </View>
          ) : (
            <Text style={styles.statusText}>❌ Chưa có hồ sơ</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonCreate]} 
            onPress={handleCreateSampleProfile}
          >
            <Text style={styles.buttonText}>➕ Tạo hồ sơ mẫu</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonUpdate, !hasProfile() && styles.buttonDisabled]} 
            onPress={handleUpdateProfile}
            disabled={!hasProfile()}
          >
            <Text style={styles.buttonText}>✏️ Cập nhật hồ sơ</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonDelete, !hasProfile() && styles.buttonDisabled]} 
            onPress={handleDeleteProfile}
            disabled={!hasProfile()}
          >
            <Text style={styles.buttonText}>🗑️ Xóa hồ sơ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Các chức năng đã liên kết:</Text>
          <Text style={styles.infoItem}>• 🍔 Hamburger Menu → Kiểm tra trạng thái hồ sơ</Text>
          <Text style={styles.infoItem}>• 🏠 HomeScreen → Hiển thị trạng thái và điều hướng</Text>
          <Text style={styles.infoItem}>• 📝 HealthFormScreen → Tạo hồ sơ mới</Text>
          <Text style={styles.infoItem}>• 👤 ProfileScreen → Xem hồ sơ chi tiết</Text>
          <Text style={styles.infoItem}>• ✏️ UpdateProfileScreen → Cập nhật hồ sơ</Text>
          <Text style={styles.infoItem}>• ⏰ EditHistoryScreen → Xem lịch sử thay đổi</Text>
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
  statusBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%'
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 10,
    textAlign: 'center'
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 5
  },
  statusSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 3
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center'
  },
  buttonCreate: {
    backgroundColor: '#4CAF50'
  },
  buttonUpdate: {
    backgroundColor: '#2196F3'
  },
  buttonDelete: {
    backgroundColor: '#F44336'
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  infoBox: {
    backgroundColor: '#e8f5e8',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50'
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 10,
    textAlign: 'center'
  },
  infoItem: {
    fontSize: 14,
    color: '#388E3C',
    marginBottom: 5
  }
});
