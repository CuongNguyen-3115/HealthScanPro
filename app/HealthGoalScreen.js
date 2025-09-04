// app/HealthGoalScreen.js
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ProgressBar from '../app/ProgressBar'; // giữ nguyên path bạn đang dùng
import ProfileService from '../services/ProfileService';
import { GOAL_CODES } from '../services/profileCodes';

// Map ngược: code -> nhãn hiển thị
const CODE_TO_GOAL_LABEL = useMemoCreateInverse(GOAL_CODES);

// Danh sách mục tiêu theo UI của bạn
const GOAL_LABELS = [
  'Giảm cân', 'Duy trì cân nặng', 'Cải thiện tim mạch', 'Tăng năng lượng',
  'Giảm stress', 'Tăng cân', 'Tăng cơ bắp', 'Kiểm soát đường huyết',
  'Cải thiện tiêu hóa', 'Ngủ ngon hơn',
];

export default function HealthGoalScreen() {
  const [selectedGoals, setSelectedGoals] = useState([]); // Lưu NHÃN để hiển thị
  const [note, setNote] = useState('');
  const TOTAL_STEPS = 4;
  const CURRENT_STEP = 4;

  // Prefill từ bản nháp
  useEffect(() => {
    (async () => {
      const d = await ProfileService.loadDraft();
      // goals trong nháp có thể là code -> map ra label; nếu không map được thì giữ nguyên chuỗi
      const labels = Array.isArray(d.goals) ? d.goals.map((g) => CODE_TO_GOAL_LABEL[g] || g) : [];
      const dedup = Array.from(new Set(labels.filter(Boolean)));
      setSelectedGoals(dedup);
      if (d.notes) setNote(String(d.notes));
    })();
  }, []);

  const toggleGoal = (goalLabel) => {
    setSelectedGoals(prev =>
      prev.includes(goalLabel)
        ? prev.filter(g => g !== goalLabel)
        : [...prev, goalLabel]
    );
  };

  const onFinish = async () => {
    try {
      // Map nhãn -> code (nếu có); nếu không có trong bảng, giữ nguyên chuỗi người dùng chọn
      const goalCodesOrText = selectedGoals.map((label) => GOAL_CODES[label] || label);

      await ProfileService.saveDraft({ goals: goalCodesOrText, notes: note });
      await ProfileService.persistToServer(); // -> lưu profiles/{id}.json trên server

      // Điều hướng sang màn xem hồ sơ
      router.replace('/HealthProfileViewScreen');
    } catch (e) {
      Alert.alert('Lỗi lưu hồ sơ', String(e?.message || e));
    }
  };

  // Gợi ý có trạng thái (đã chọn/chưa)
  const goalItems = useMemo(
    () => GOAL_LABELS.map(l => ({ label: l, active: selectedGoals.includes(l) })),
    [selectedGoals]
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.topLayer} />

      {/* Progress bar */}
      <ProgressBar step={CURRENT_STEP} total={TOTAL_STEPS} />

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="green" />
      </TouchableOpacity>

      {/* Icon + Heading */}
      <Ionicons name="heart" size={40} color="green" style={styles.icon} />
      <Text style={styles.title}>Mục Tiêu Sức Khỏe</Text>
      <Text style={styles.subtitle}>Bạn muốn cải thiện điều gì?</Text>

      {/* Nội dung chính */}
      <ScrollView contentContainerStyle={styles.goalsContainer}>
        <Text style={styles.sectionTitle}>Chọn mục tiêu (có thể chọn nhiều)</Text>
        <View style={styles.goalGrid}>
          {goalItems.map(({ label, active }) => (
            <TouchableOpacity
              key={label}
              style={[styles.goalButton, active && styles.goalButtonSelected]}
              onPress={() => toggleGoal(label)}
            >
              <Text style={[styles.goalText, active && styles.goalTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Ghi chú thêm (tùy chọn)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Những thông tin khác về sức khỏe..."
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
          placeholderTextColor="#666"
        />
      </ScrollView>

      {/* Hoàn thành */}
      <TouchableOpacity style={styles.finishButton} onPress={onFinish}>
        <Text style={styles.finishText}>Hoàn thành</Text>
        <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </View>
  );
}

/** Helper tạo map ngược (code -> label) ngoài component tree */
function useMemoCreateInverse(obj) {
  // không phụ thuộc lifecycle của component, nhưng dùng để giữ code gọn
  return useMemo(() => Object.fromEntries(Object.entries(obj).map(([label, code]) => [code, label])), []);
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F2FBF5',
    paddingTop: 50,
    paddingHorizontal: 16,
    position: 'relative',
  },
  topLayer: {
    position: 'absolute',
    top: 0,
    height: '35%',
    width: '100%',
    backgroundColor: '#FFF',
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    zIndex: -1,
  },
  backButton: {
    position: 'absolute',
    top: 90,
    left: 16,
    zIndex: 1,
  },
  icon: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  goalsContainer: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalButton: {
    borderWidth: 1.5,
    borderColor: 'green',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    width: '48%',
    backgroundColor: 'white',
  },
  goalButtonSelected: {
    backgroundColor: 'green',
  },
  goalText: {
    color: 'green',
    textAlign: 'center',
    fontWeight: '500',
  },
  goalTextSelected: {
    color: 'white',
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'white',
    marginTop: 10,
    color: '#000',
  },
  finishButton: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
    backgroundColor: 'green',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
