// app/AllergyScreen.js
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ProgressBar from './ProgressBar';

const commonAllergies = ['Gluten', 'Lactose', 'Đậu phộng', 'Tôm cua', 'Trứng', 'Đậu nành', 'Hạt phỉ', 'Cá', 'Dâu tây', 'Chocolate'];

export default function AllergyScreen() {
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState([]);
  const TOTAL_STEPS = 4;
  const CURRENT_STEP = 3;


  const toggleAllergy = (item) => {
    setSelected(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  return (
    <View style={styles.container}>
      <ProgressBar step={CURRENT_STEP} total={TOTAL_STEPS} />
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={24} color="green" />
      </TouchableOpacity>

      {/* Warning icon + Title */}
      <MaterialIcons name="warning" size={48} color="#FFCC00" style={{ alignSelf: 'center', marginTop: 10 }} />
      <Text style={styles.title}>Dị Ứng & Hạn Chế</Text>
      <Text style={styles.subtitle}>Những thành phần cần tránh</Text>

      {/* Add allergy */}
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Nhập tên chất gây dị ứng..."
          value={input}
          onChangeText={setInput}
          style={styles.input}
        />
        <TouchableOpacity
          onPress={() => {
            if (input && !selected.includes(input)) setSelected([...selected, input]);
            setInput('');
          }}
          style={styles.addBtn}
        >
          <Text style={{ color: 'white' }}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Common tags */}
      <Text style={styles.sectionTitle}>Dị ứng phổ biến</Text>
      <View style={styles.tagContainer}>
        {commonAllergies.map(item => (
          <TouchableOpacity
            key={item}
            onPress={() => toggleAllergy(item)}
            style={[
              styles.tag,
              selected.includes(item) && styles.selectedTag,
            ]}
          >
            <Text style={[styles.tagText, selected.includes(item) && styles.selectedTagText]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected list */}
      {selected.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Dị ứng của bạn</Text>
          <View style={styles.tagContainer}>
            {selected.map(item => (
              <View key={item} style={styles.selectedItem}>
                <Text style={{ color: 'white' }}>{item}</Text>
                <TouchableOpacity onPress={() => toggleAllergy(item)}>
                  <MaterialIcons name="close" size={16} color="white" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Next */}
      <TouchableOpacity style={styles.nextBtn} onPress={() => router.push('HealthGoalScreen')}>
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
  input: { flex: 1, backgroundColor: 'white', borderRadius: 6, padding: 10, marginRight: 10 },
  addBtn: { backgroundColor: 'green', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  sectionTitle: { fontWeight: 'bold', marginVertical: 10, color: 'black' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: '#eee', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, margin: 4 },
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
