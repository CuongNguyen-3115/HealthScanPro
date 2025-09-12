import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useHealthProfile } from '../contexts/HealthProfileContext';

const HealthProfileScreen = () => {
  const { healthProfile, hasProfile } = useHealthProfile();

  const handleBack = () => {
    router.push('/HomeScreen');
  };

  const handleEdit = () => {
    router.push('/UpdateProfileScreen');
  };

  const handleCreateProfile = () => {
    router.push('/CreateProfileScreen');
  };

  if (!hasProfile()) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#22C55E" />
        
        <View style={styles.header}>
          <View style={styles.headerBackground} />
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image source={require('../assets/images/logo.png')} style={styles.headerLogo} />
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>HealthScan Pro</Text>
                <Text style={styles.headerSubtitle}>Hồ sơ sức khỏe</Text>
              </View>
            </View>
            <View style={styles.placeholder} />
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={80} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Chưa có hồ sơ sức khỏe</Text>
          <Text style={styles.emptySubtitle}>Hãy tạo hồ sơ để có trải nghiệm tốt nhất</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateProfile}>
            <Text style={styles.createButtonText}>Tạo hồ sơ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          <View style={styles.logoContainer}>
            <Image source={require('../assets/images/logo.png')} style={styles.headerLogo} />
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>HealthScan Pro</Text>
              <Text style={styles.headerSubtitle}>Hồ sơ sức khỏe</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Personal Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Họ và tên:</Text>
            <Text style={styles.infoValue}>{healthProfile.fullName || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày sinh:</Text>
            <Text style={styles.infoValue}>{healthProfile.dateOfBirth || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Giới tính:</Text>
            <Text style={styles.infoValue}>{healthProfile.gender || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chiều cao:</Text>
            <Text style={styles.infoValue}>{healthProfile.height ? `${healthProfile.height} cm` : 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cân nặng:</Text>
            <Text style={styles.infoValue}>{healthProfile.weight ? `${healthProfile.weight} kg` : 'Chưa cập nhật'}</Text>
          </View>
        </View>

        {/* Health Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="medical" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Thông tin sức khỏe</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nhóm máu:</Text>
            <Text style={styles.infoValue}>{healthProfile.bloodType || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bệnh mãn tính:</Text>
            <Text style={styles.infoValue}>{healthProfile.chronicDiseases || 'Không có'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dị ứng:</Text>
            <Text style={styles.infoValue}>
              {healthProfile.allergies && healthProfile.allergies.length > 0 
                ? healthProfile.allergies.join(', ') 
                : 'Không có'}
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="call" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại:</Text>
            <Text style={styles.infoValue}>{healthProfile.phoneNumber || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{healthProfile.email || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={styles.infoValue}>{healthProfile.address || 'Chưa cập nhật'}</Text>
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Thông tin bổ sung</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mục tiêu sức khỏe:</Text>
            <Text style={styles.infoValue}>{healthProfile.healthGoals || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hoạt động thể thao:</Text>
            <Text style={styles.infoValue}>{healthProfile.exerciseFrequency || 'Chưa cập nhật'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chế độ ăn:</Text>
            <Text style={styles.infoValue}>{healthProfile.dietType || 'Chưa cập nhật'}</Text>
          </View>
        </View>
      </ScrollView>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  editButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  card: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HealthProfileScreen;