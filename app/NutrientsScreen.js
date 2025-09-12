import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  FlatList,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const NutrientsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [nutrients] = useState([
    { id: '1', name: 'Vitamin C', category: 'Vitamin', description: 'Chống oxy hóa, tăng cường miễn dịch' },
    { id: '2', name: 'Vitamin D', category: 'Vitamin', description: 'Hỗ trợ hấp thụ canxi, tốt cho xương' },
    { id: '3', name: 'Protein', category: 'Macronutrient', description: 'Xây dựng và sửa chữa cơ bắp' },
    { id: '4', name: 'Calcium', category: 'Mineral', description: 'Cần thiết cho xương và răng chắc khỏe' },
    { id: '5', name: 'Iron', category: 'Mineral', description: 'Vận chuyển oxy trong máu' },
    { id: '6', name: 'Fiber', category: 'Macronutrient', description: 'Hỗ trợ tiêu hóa và sức khỏe tim mạch' },
    { id: '7', name: 'Omega-3', category: 'Fatty Acid', description: 'Tốt cho não và tim mạch' },
    { id: '8', name: 'Magnesium', category: 'Mineral', description: 'Hỗ trợ chức năng cơ và thần kinh' }
  ]);

  const filteredNutrients = nutrients.filter(nutrient =>
    nutrient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nutrient.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    router.push('/screens/HomeScreen');
  };

  const handleNutrientPress = (nutrient) => {
    router.push('/screens/NutrientDetailScreen');
  };

  const renderNutrientItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.nutrientItem} 
      onPress={() => handleNutrientPress(item)}
    >
      <View style={styles.nutrientInfo}>
        <Text style={styles.nutrientName}>{item.name}</Text>
        <Text style={styles.nutrientCategory}>{item.category}</Text>
        <Text style={styles.nutrientDescription}>{item.description}</Text>
      </View>
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
            <Text style={styles.headerTitle}>Các Chất Dinh Dưỡng</Text>
            <Text style={styles.headerSubtitle}>Tìm hiểu về các chất dinh dưỡng</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm chất dinh dưỡng..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <FlatList
          data={filteredNutrients}
          renderItem={renderNutrientItem}
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#374151',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  nutrientItem: {
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
  nutrientInfo: {
    flex: 1,
  },
  nutrientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  nutrientCategory: {
    fontSize: 14,
    color: '#22C55E',
    marginBottom: 4,
  },
  nutrientDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default NutrientsScreen;