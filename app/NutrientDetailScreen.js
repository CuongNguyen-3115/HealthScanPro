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

const NutrientDetailScreen = () => {
  const nutrientData = {
    name: 'Vitamin C',
    category: 'Vitamin',
    description: 'Vitamin C (axit ascorbic) là một vitamin tan trong nước, có vai trò quan trọng trong nhiều chức năng của cơ thể.',
    benefits: [
      'Tăng cường hệ miễn dịch',
      'Chống oxy hóa, bảo vệ tế bào',
      'Hỗ trợ sản xuất collagen',
      'Tăng cường hấp thụ sắt',
      'Giảm nguy cơ mắc bệnh tim mạch'
    ],
    sources: [
      'Cam, chanh, bưởi',
      'Ớt chuông',
      'Dâu tây',
      'Kiwi',
      'Bông cải xanh',
      'Cà chua'
    ],
    dailyRequirement: '90mg/ngày (nam giới), 75mg/ngày (nữ giới)',
    deficiencySymptoms: [
      'Mệt mỏi, yếu sức',
      'Chảy máu nướu răng',
      'Vết thương lâu lành',
      'Da khô, thô ráp',
      'Dễ bị nhiễm trùng'
    ]
  };

  const handleBack = () => {
    router.push('/screens/HomeScreen');
  };

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
              <Text style={styles.headerSubtitle}>Chi tiết chất dinh dưỡng</Text>
            </View>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Nutrient Header */}
        <View style={styles.nutrientHeader}>
          <View style={styles.nutrientIcon}>
            <Ionicons name="leaf" size={40} color="#22C55E" />
          </View>
          <View style={styles.nutrientTitleContainer}>
            <Text style={styles.nutrientName}>{nutrientData.name}</Text>
            <Text style={styles.nutrientCategory}>{nutrientData.category}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mô tả</Text>
          <Text style={styles.description}>{nutrientData.description}</Text>
        </View>

        {/* Benefits */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lợi ích sức khỏe</Text>
          {nutrientData.benefits.map((benefit, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.listText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Sources */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nguồn thực phẩm</Text>
          {nutrientData.sources.map((source, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="restaurant" size={16} color="#22C55E" />
              <Text style={styles.listText}>{source}</Text>
            </View>
          ))}
        </View>

        {/* Daily Requirement */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nhu cầu hàng ngày</Text>
          <Text style={styles.requirementText}>{nutrientData.dailyRequirement}</Text>
        </View>

        {/* Deficiency Symptoms */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Triệu chứng thiếu hụt</Text>
          {nutrientData.deficiencySymptoms.map((symptom, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="warning" size={16} color="#ef4444" />
              <Text style={styles.listText}>{symptom}</Text>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  nutrientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  nutrientIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nutrientTitleContainer: {
    flex: 1,
  },
  nutrientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  nutrientCategory: {
    fontSize: 16,
    color: '#22C55E',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  requirementText: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '600',
  },
});

export default NutrientDetailScreen;