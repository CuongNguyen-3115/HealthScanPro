// HealthConditionScreen.js
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ProgressBar from '../app/ProgressBar';

const conditions = [
  { title: 'Tiểu đường', description: 'Bệnh tiểu đường type 1 hoặc 2' },
  { title: 'Huyết áp cao', description: 'Tăng huyết áp' },
  { title: 'Bệnh tim mạch', description: 'Các vấn đề về tim mạch' },
  { title: 'Thừa cân/Béo phì', description: 'BMI > 25' },
  { title: 'Thiếu cân', description: 'BMI < 18.5' },
  { title: 'Bệnh phổi mãn tính', description: 'Bệnh phổi tắc nghe'},
];

export default function HealthConditionScreen() {
  const [selectedConditions, setSelectedConditions] = useState({});
  const TOTAL_STEPS = 4;
  const CURRENT_STEP = 2;
  // và thêm <ProgressBar step={CURRENT_STEP} total={TOTAL_STEPS} /> ngay dưới <View style={styles.wrapper}>


  const toggleCondition = (title) => {
    setSelectedConditions((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <View style={styles.wrapper}>
      <ProgressBar step={CURRENT_STEP} total={TOTAL_STEPS} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start' }}>
          <MaterialIcons name="arrow-back" size={24} color="green" />
        </TouchableOpacity>

        {/* Icon + Heading */}
        <MaterialIcons name="favorite" size={48} color="green" style={styles.icon} />
        <Text style={styles.heading}>Tình Trạng Sức Khỏe</Text>
        <Text style={styles.subheading}>Những vấn đề sức khỏe hiện tại</Text>

        {/* List */}
        <View style={styles.cardList}>
          {conditions.map(({ title, description }, index) => (
            <View key={index} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
              </View>
              <Switch
                value={!!selectedConditions[title]}
                onValueChange={() => toggleCondition(title)}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Nút tiếp theo ở giữa */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => router.push('AllergyScreen')}
      >
        <Text style={styles.nextButtonText}>Tiếp theo</Text>
        <MaterialIcons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>
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
    paddingBottom: 120,
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
  cardList: {
    marginTop: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  title: {
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  description: {
    color: 'black',
    fontSize: 12,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 100,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    marginRight: 8,
  }
});
