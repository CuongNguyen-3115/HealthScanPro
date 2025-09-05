// app/AllergyScreen.js
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ProfileService from '../services/ProfileService';
import { ALLERGY_CODES } from '../services/profileCodes';
import ProgressBar from './ProgressBar';

const commonAllergies = ['Gluten', 'Lactose', 'Đậu phộng', 'Tôm cua', 'Trứng', 'Đậu nành', 'Hạt phỉ', 'Cá', 'Dâu tây', 'Chocolate'];

// Map ngược: code -> nhãn hiển thị
const CODE_TO_LABEL = Object.fromEntries(
  Object.entries(ALLERGY_CODES).map(([label, code]) => [code, label])
);

export default function AllergyScreen() {
  const [input, setInput] = useState('');
  // selected lưu NHÃN để hiển thị; khi lưu sẽ map nhãn -> code.
  const [selected, setSelected] = useState([]);
  const TOTAL_STEPS = 4;
  const CURRENT_STEP = 3;

  // Prefill từ bản nháp
  useEffect(() => {
    (async () => {
      const d = await ProfileService.loadDraft();
      const arr = Array.isArray(d.allergies) ? d.allergies : [];
      // allergies trong nháp có thể là code (gluten, lactose, ...) hoặc chuỗi tự do
      const labels = arr.map((a) => CODE_TO_LABEL[a] || a);
      // chống trùng
      const dedup = Array.from(new Set(labels.filter(Boolean)));
      setSelected(dedup);
    })();
  }, []);

  const toggleAllergy = (label) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const addCustom = () => {
    const t = (input || '').trim();
    if (!t) return;
    setSelected((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setInput('');
  };

  const onNext = async () => {
    // Map nhãn -> code nếu có; nếu không có trong bảng, giữ nguyên chuỗi người dùng nhập
    const finalCodesOrText = selected.map((label) => ALLERGY_CODES[label] || label);
    await ProfileService.saveDraft({ allergies: finalCodesOrText });
    router.push('HealthGoalScreen');
  };

  // Tạo danh sách gợi ý (ưu tiên sắp xếp: những cái đã chọn lên trước)
  const commonWithState = useMemo(
    () =>
      commonAllergies.map((l) => ({
        label: l,
        active: selected.includes(l),
      })),
    [selected]
  );

  return (
    <View style={styles.container}>
      <ProgressBar step={CURRENT_STEP} total={TOTAL_STEPS} />

      {/* Back */}
      <TouchableOpacity onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={24} color="green" />
      </TouchableOpacity>

      {/* Warning icon + Title */}
      <MaterialIcons
        name="warning"
        size={48}
        color="#FFCC00"
        style={{ alignSelf: 'center', marginTop: 10 }}
      />
      <Text style={styles.title}>Dị Ứng & Hạn Chế</Text>
      <Text style={styles.subtitle}>Những thành phần cần tránh</Text>

      {/* Add allergy */}
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Nhập tên chất gây dị ứng..."
          value={input}
          onChangeText={setInput}
          style={styles.input}
          placeholderTextColor="#666"
        />
        <TouchableOpacity onPress={addCustom} style={styles.addBtn}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Common tags */}
      <Text style={styles.sectionTitle}>Dị ứng phổ biến</Text>
      <View style={styles.tagContainer}>
        {commonWithState.map(({ label, active }) => (
          <TouchableOpacity
            key={label}
            onPress={() => toggleAllergy(label)}
            style={[styles.tag, active && styles.selectedTag]}
          >
            <Text style={[styles.tagText, active && styles.selectedTagText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected list */}
      {selected.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Dị ứng của bạn</Text>
          <View style={styles.tagContainer}>
            {selected.map((label) => (
              <View key={label} style={styles.selectedItem}>
                <Text style={{ color: 'white' }}>{label}</Text>
                <TouchableOpacity onPress={() => toggleAllergy(label)}>
                  <MaterialIcons
                    name="close"
                    size={16}
                    color="white"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Next */}
      <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextText}>Tiếp theo</Text>
        <MaterialIcons name="arrow-forward" color="white" size={20} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2FBF5', padding: 16, paddingTop: 50 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 8, color: 'black' },
  subtitle: { textAlign: 'center', marginBottom: 20, color: 'black' },

  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 10,
    marginRight: 10,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addBtn: { backgroundColor: 'green', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },

  sectionTitle: { fontWeight: 'bold', marginVertical: 10, color: 'black' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap' },

  tag: {
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  tagText: { color: '#333' },
  selectedTag: { backgroundColor: 'green' },
  selectedTagText: { color: 'white' },

  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'red',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 4,
  },

  nextBtn: {
    flexDirection: 'row',
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    marginHorizontal: 30,
    marginTop: 40,
    marginBottom: 40,
  },
  nextText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
