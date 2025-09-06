import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useHealthProfile } from '../../contexts/HealthProfileContext';

const UpdateProfileScreen = () => {
  const { healthProfile, updateProfile } = useHealthProfile();
  
  // Convert allergies from string to array if it exists
  const parseAllergies = (allergies) => {
    if (Array.isArray(allergies)) return allergies;
    if (typeof allergies === 'string' && allergies.trim()) {
      return allergies.split(',').map(item => item.trim());
    }
    return [];
  };

  // Parse date of birth to get day, month, year
  const parseDateOfBirth = (dateString) => {
    if (!dateString) return { day: 1, month: 1, year: new Date().getFullYear() - 18 };
    
    const dateParts = dateString.split('/');
    if (dateParts.length === 3) {
      return {
        day: parseInt(dateParts[0]) || 1,
        month: parseInt(dateParts[1]) || 1,
        year: parseInt(dateParts[2]) || new Date().getFullYear() - 18
      };
    }
    return { day: 1, month: 1, year: new Date().getFullYear() - 18 };
  };

  const initialDate = parseDateOfBirth(healthProfile?.dateOfBirth);

  const [formData, setFormData] = useState({
    fullName: healthProfile?.fullName || '',
    dateOfBirth: healthProfile?.dateOfBirth || '',
    gender: healthProfile?.gender || '',
    height: healthProfile?.height?.toString() || '',
    weight: healthProfile?.weight?.toString() || '',
    bloodType: healthProfile?.bloodType || '',
    chronicDiseases: healthProfile?.chronicDiseases || '',
    allergies: parseAllergies(healthProfile?.allergies),
    phone: healthProfile?.phone || '',
    email: healthProfile?.email || '',
    address: healthProfile?.address || '',
    customAllergy: '' // New state for custom allergy input
  });

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(initialDate.day);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedYear, setSelectedYear] = useState(initialDate.year);

  // Gender picker state
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // Predefined allergy options
  const allergyOptions = [
    'Đậu phộng',
    'Hải sản',
    'Sữa',
    'Trứng',
    'Đậu nành',
    'Lúa mì',
    'Hạt cây',
    'Thuốc kháng sinh',
    'Phấn hoa',
    'Bụi nhà',
    'Lông thú cưng',
    'Khác'
  ];

  // Gender options
  const genderOptions = ['Nam', 'Nữ'];

  // Generate arrays for date picker
  const days = Array.from({length: 31}, (_, i) => i + 1);
  const months = [
    {value: 1, label: 'Tháng 1'},
    {value: 2, label: 'Tháng 2'},
    {value: 3, label: 'Tháng 3'},
    {value: 4, label: 'Tháng 4'},
    {value: 5, label: 'Tháng 5'},
    {value: 6, label: 'Tháng 6'},
    {value: 7, label: 'Tháng 7'},
    {value: 8, label: 'Tháng 8'},
    {value: 9, label: 'Tháng 9'},
    {value: 10, label: 'Tháng 10'},
    {value: 11, label: 'Tháng 11'},
    {value: 12, label: 'Tháng 12'}
  ];
  const years = Array.from({length: new Date().getFullYear() - 1900 + 1}, (_, i) => 1900 + i).reverse();

  // Update date picker when formData changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const parsedDate = parseDateOfBirth(formData.dateOfBirth);
      setSelectedDay(parsedDate.day);
      setSelectedMonth(parsedDate.month);
      setSelectedYear(parsedDate.year);
    }
  }, [formData.dateOfBirth]);

  const handleDateConfirm = () => {
    const formattedDate = `${selectedDay.toString().padStart(2, '0')}/${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`;
    setFormData({...formData, dateOfBirth: formattedDate});
    setShowDatePicker(false);
  };

  const handleGenderSelect = (gender) => {
    setFormData({...formData, gender: gender});
    setShowGenderPicker(false);
  };

  const handleAllergyToggle = (allergy) => {
    const currentAllergies = formData.allergies || [];
    if (currentAllergies.includes(allergy)) {
      setFormData({
        ...formData, 
        allergies: currentAllergies.filter(item => item !== allergy)
      });
    } else {
      setFormData({
        ...formData, 
        allergies: [...currentAllergies, allergy]
      });
    }
  };

  const handleAddCustomAllergy = () => {
    const customAllergy = formData.customAllergy.trim();
    if (customAllergy && !allergyOptions.includes(customAllergy)) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, customAllergy],
        customAllergy: ''
      });
    }
  };

  const handleSave = async () => {
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!');
        router.push('/screens/HomeScreen');
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể cập nhật hồ sơ');
      }
    } catch (_error) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật hồ sơ');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />
      
      {/* Header giống ProfileScreen */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/screens/HomeScreen')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>Cập Nhật Hồ Sơ</Text>
        </View>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Ionicons name="checkmark" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => setFormData({...formData, fullName: text})}
              placeholder="Nhập họ và tên"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày sinh</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={formData.dateOfBirth ? styles.dateText : styles.placeholderText}>
                {formData.dateOfBirth || 'Chọn ngày sinh'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giới tính</Text>
            <TouchableOpacity 
              style={styles.genderInput}
              onPress={() => setShowGenderPicker(true)}
            >
              <Text style={formData.gender ? styles.genderText : styles.placeholderText}>
                {formData.gender || 'Chọn giới tính'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chiều cao (cm)</Text>
            <TextInput
              style={styles.input}
              value={formData.height}
              onChangeText={(text) => setFormData({...formData, height: text})}
              placeholder="170"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cân nặng (kg)</Text>
            <TextInput
              style={styles.input}
              value={formData.weight}
              onChangeText={(text) => setFormData({...formData, weight: text})}
              placeholder="65"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tình trạng sức khỏe</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nhóm máu</Text>
            <TextInput
              style={styles.input}
              value={formData.bloodType}
              onChangeText={(text) => setFormData({...formData, bloodType: text})}
              placeholder="A, B, AB, O"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bệnh mãn tính</Text>
            <TextInput
              style={styles.input}
              value={formData.chronicDiseases}
              onChangeText={(text) => setFormData({...formData, chronicDiseases: text})}
              placeholder="Tiểu đường, huyết áp cao..."
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dị ứng</Text>
            <View style={styles.allergyContainer}>
              {allergyOptions.map((allergy) => (
                <TouchableOpacity
                  key={allergy}
                  style={styles.allergyItem}
                  onPress={() => handleAllergyToggle(allergy)}
                >
                  <View style={[
                    styles.checkbox,
                    formData.allergies?.includes(allergy) && styles.checkboxChecked
                  ]}>
                    {formData.allergies?.includes(allergy) && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text style={styles.allergyText}>{allergy}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Custom Allergy Input */}
            <View style={styles.customAllergyContainer}>
              <Text style={styles.customAllergyLabel}>Dị ứng khác:</Text>
              <View style={styles.customAllergyInputRow}>
                <TextInput
                  style={styles.customAllergyInput}
                  value={formData.customAllergy}
                  onChangeText={(text) => setFormData({...formData, customAllergy: text})}
                  placeholder="Nhập dị ứng khác..."
                  onSubmitEditing={handleAddCustomAllergy}
                />
                <TouchableOpacity 
                  style={styles.addAllergyButton}
                  onPress={handleAddCustomAllergy}
                >
                  <Text style={styles.addAllergyButtonText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Display Custom Allergies */}
            {formData.allergies && formData.allergies.length > 0 && (
              <View style={styles.customAllergiesDisplay}>
                <Text style={styles.customAllergiesLabel}>Dị ứng đã thêm:</Text>
                <View style={styles.customAllergiesList}>
                  {formData.allergies
                    .filter(allergy => !allergyOptions.includes(allergy))
                    .map((allergy, index) => (
                      <View key={index} style={styles.customAllergyItem}>
                        <Text style={styles.customAllergyItemText}>{allergy}</Text>
                        <TouchableOpacity
                          style={styles.removeAllergyButton}
                          onPress={() => {
                            const updatedAllergies = formData.allergies.filter(item => item !== allergy);
                            setFormData({...formData, allergies: updatedAllergies});
                          }}
                        >
                          <Ionicons name="close-circle" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              placeholder="0123456789"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              placeholder="example@email.com"
              keyboardType="email-address"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(text) => setFormData({...formData, address: text})}
              placeholder="Nhập địa chỉ"
              multiline
            />
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalButton}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chọn ngày sinh</Text>
              <TouchableOpacity onPress={handleDateConfirm}>
                <Text style={styles.modalButton}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerRow}>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Ngày</Text>
                  <Picker
                    selectedValue={selectedDay}
                    onValueChange={setSelectedDay}
                    style={styles.datePicker}
                  >
                    {days.map((day) => (
                      <Picker.Item key={day} label={day.toString()} value={day} />
                    ))}
                  </Picker>
                </View>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Tháng</Text>
                  <Picker
                    selectedValue={selectedMonth}
                    onValueChange={setSelectedMonth}
                    style={styles.datePicker}
                  >
                    {months.map((month) => (
                      <Picker.Item key={month.value} label={month.label} value={month.value} />
                    ))}
                  </Picker>
                </View>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Năm</Text>
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={setSelectedYear}
                    style={styles.datePicker}
                  >
                    {years.map((year) => (
                      <Picker.Item key={year} label={year.toString()} value={year} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Text style={styles.modalButton}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Chọn giới tính</Text>
              <View style={{width: 60}} />
            </View>
            <View style={styles.genderPickerContainer}>
              {genderOptions.map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={styles.genderOption}
                  onPress={() => handleGenderSelect(gender)}
                >
                  <Text style={styles.genderOptionText}>{gender}</Text>
                  {formData.gender === gender && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#22C55E',
    borderBottomWidth: 1,
    borderBottomColor: '#16A34A',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 50,
    textAlign: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genderInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  genderText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  allergyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  allergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minWidth: '45%',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#22C55E',
  },
  allergyText: {
    fontSize: 14,
    color: '#333',
  },
  customAllergyContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  customAllergyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  customAllergyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  customAllergyInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  addAllergyButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addAllergyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  customAllergiesDisplay: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  customAllergiesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  customAllergiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customAllergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  customAllergyItemText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  removeAllergyButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  datePickerContainer: {
    padding: 20,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  datePicker: {
    height: 150,
    width: '100%',
  },
  genderPickerContainer: {
    padding: 20,
  },
  genderOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default UpdateProfileScreen;
