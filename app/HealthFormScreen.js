
//app/HealthFormScreen.js
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ProgressBar from '../app/ProgressBar';


export default function HealthFormScreen() {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState('');
  const TOTAL_STEPS = 4;
  const CURRENT_STEP = 1;


  return (
    <View style={styles.wrapper}>
      <ProgressBar step={CURRENT_STEP} total={TOTAL_STEPS} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.push('HomeScreen')} style={{ alignSelf: 'flex-start' }}>
          <MaterialIcons name="arrow-back" size={24} color="green" />
        </TouchableOpacity>

        <MaterialIcons name="person" size={48} color="green" style={styles.icon} />
        <Text style={styles.heading}>Thông Tin Cơ Bản</Text>
        <Text style={styles.subheading}>Giúp chúng tôi hiểu về bạn</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Tuổi</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            placeholder="Nhập tuổi"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={gender} onValueChange={setGender}>
              <Picker.Item label="Chọn giới tính" value="" />
              <Picker.Item label="Nam" value="male" />
              <Picker.Item label="Nữ" value="female" />
            </Picker>
          </View>

          <Text style={styles.label}>Cân nặng (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="Nhập cân nặng"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Chiều cao (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholder="Nhập chiều cao"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Mức độ vận động</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={activity} onValueChange={setActivity}>
              <Picker.Item label="Chọn mức độ hoạt động" value="" />
              <Picker.Item label="Ít vận động (làm việc văn phòng)" value="1" />
              <Picker.Item label="Vận động nhẹ (1–3 ngày/tuần)" value="2" />
              <Picker.Item label="Vận động trung bình (3–5 ngày/tuần)" value="3" />
              <Picker.Item label="Vận động nhiều (6–7 ngày/tuần)" value="4" />
              <Picker.Item label="Vận động rất nhiều (2 lần/ngày)" value="5" />
            </Picker>
          </View>

          {/* ✅ Đặt nút TIẾP THEO vào cuối form luôn */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.push('HealthConditionScreen')}
          >
            <Text style={styles.nextButtonText}>Tiếp theo</Text>
            <MaterialIcons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F2FBF5',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  container: {
    paddingBottom: 40,
  },
  icon: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  heading: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  subheading: {
    textAlign: 'center',
    marginBottom: 20,
    color: 'black',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    marginTop: 10,
    fontWeight: '600',
    color: 'black',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    color: '#000',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginTop: 5,
    marginBottom: 10,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 8,
  },
});
