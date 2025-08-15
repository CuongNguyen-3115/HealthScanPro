// app/ProductAnalysisScreen.js

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
// Giảm kích thước để chắc chắn chart hiển thị trọn vẹn
const CHART_SIZE = width * 0.35;

// Dữ liệu mẫu
const SAMPLE_INGREDIENTS = [
  { name: 'Aqua', riskLevel: 'safe', riskScore: 1, function: 'Dung môi', concerns: [], usage: 'Giữ ẩm cho da' },
  { name: 'Methylparaben', riskLevel: 'harmful', riskScore: 8, function: 'Chất bảo quản', concerns: ['Có thể gây rối loạn nội tiết'], usage: 'Bảo quản sản phẩm' },
  { name: 'Glycerin', riskLevel: 'safe', riskScore: 2, function: 'Dưỡng ẩm', concerns: [], usage: 'Tăng độ ẩm' },
  { name: 'Sodium Laureth Sulfate', riskLevel: 'moderate', riskScore: 6, function: 'Tạo bọt', concerns: ['Có thể làm khô da nếu dùng nhiều'], usage: 'Tạo bọt làm sạch' },
  { name: 'Fragrance', riskLevel: 'moderate', riskScore: 5, function: 'Hương liệu', concerns: ['Có thể gây kích ứng'], usage: 'Tạo mùi thơm' },
  { name: 'Alcohol Denat', riskLevel: 'harmful', riskScore: 7, function: 'Dung môi', concerns: ['Gây khô da'], usage: 'Tan dầu cho công thức' },
];

const SAMPLE_ALTERNATIVES = [
  {
    name: 'CeraVe Foaming Cleanser',
    brand: 'CeraVe',
    score: 2,
    price: '320.000đ',
    keyBenefits: ['Không paraben', 'Có ceramide', 'Dịu nhẹ'],
    availableAt: ['Guardian', 'Watsons', 'Online'],
  },
  {
    name: 'La Roche-Posay Toleriane Wash',
    brand: 'La Roche-Posay',
    score: 1,
    price: '450.000đ',
    keyBenefits: ['Không sulfate', 'Dành cho da nhạy cảm', 'Nước khoáng'],
    availableAt: ['Pharmacies', 'Guardian', 'Hasaki'],
  },
];

export default function ProductAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const productName  = params.productName  ?? 'Sản phẩm mẫu';
  const overallScore = Number(params.overallScore) || 5;
  let ingredients   = SAMPLE_INGREDIENTS;
  if (params.ingredients) {
    try { ingredients = JSON.parse(params.ingredients); } catch {}
  }
  const profile = params.userProfile
    ? JSON.parse(params.userProfile)
    : {
        skinType: 'Da hỗn hợp',
        skinConcerns: ['Mụn đầu đen'],
        allergies: ['Paraben'],
        ageGroup: '25-35 tuổi',
        isPregnant: false,
      };

  const summary = ingredients.reduce((acc, i) => {
    acc[i.riskLevel] = (acc[i.riskLevel] || 0) + 1;
    return acc;
  }, { safe: 0, moderate: 0, harmful: 0 });

  const chartData = [
    { name: 'An toàn',    count: summary.safe,     color: '#4CAF50' },
    { name: 'Trung bình', count: summary.moderate, color: '#FFC107' },
    { name: 'Có hại',     count: summary.harmful,  color: '#F44336' },
  ];

  const getRiskColor = lvl =>
    lvl === 'safe'     ? '#4CAF50'
  : lvl === 'moderate' ? '#FFC107'
  :                      '#F44336';

  const getScoreLabel = s => {
    if (s <= 3) return { text: 'Sạch',       bg: '#4CAF50' };
    if (s <= 6) return { text: 'Trung bình', bg: '#FFC107' };
    return { text: 'Không sạch', bg: '#F44336' };
  };
  const scoreInfo = getScoreLabel(overallScore);

  const [modalData, setModalData] = useState(null);

  const aiAnalysis = `Dựa trên hồ sơ da (${profile.skinType}, tuổi ${profile.ageGroup}, dị ứng ${profile.allergies.join(' và ')}), sản phẩm có điểm rủi ro ${overallScore}/10.`;
  const handleEvaluate = () => {
    router.push({
      pathname: '/PersonalizedAssessment',
      params: {
        userProfile:       JSON.stringify(profile),
        productScore:      String(overallScore),
        personalizedScore: String(overallScore),
        ingredients:       JSON.stringify(ingredients),
        alternatives:      JSON.stringify(SAMPLE_ALTERNATIVES),
        aiAnalysis,
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Back button với marginTop đủ lớn */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      {/* Overall Score */}
      <View style={styles.card}>
        <Text style={styles.title}>{productName}</Text>
        <View style={styles.scoreBox}>
          <View style={[styles.scoreCircle, { backgroundColor: scoreInfo.bg }]}>
            <Text style={styles.scoreText}>{overallScore}</Text>
          </View>
          <Text style={styles.scoreLabel}>{scoreInfo.text}</Text>
        </View>
      </View>

      {/* Pie Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tổng quan thành phần</Text>
        <View style={styles.chartWrapper}>
          <PieChart
            data={chartData.map(d => ({
              name: d.name,
              population: d.count,
              color: d.color,
              legendFontColor: '#333',
              legendFontSize: 12,
            }))}
            width={CHART_SIZE}
            height={CHART_SIZE}
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: () => '#000',
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="20"
            hasLegend={false}
          />
        </View>
        <View style={styles.legendContainer}>
          {chartData.map((d, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: d.color }]} />
              <Text style={styles.legendLabel}>{d.name} ({d.count})</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Danh sách thành phần: scroll dọc trong vùng cố định */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Danh sách thành phần</Text>
        <View style={styles.ingListWrapper}>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {ingredients.map((ing, i) => (
              <TouchableOpacity
                key={i}
                style={styles.ingItem}
                onPress={() => setModalData(ing)}
              >
                <View style={styles.ingRow}>
                  <Ionicons
                    name={
                      ing.riskLevel === 'harmful'   ? 'warning' :
                      ing.riskLevel === 'moderate'  ? 'alert-circle' :
                                                       'shield-checkmark'
                    }
                    size={20}
                    color={getRiskColor(ing.riskLevel)}
                  />
                  <Text style={styles.ingName}>{ing.name}</Text>
                  <Text style={styles.ingFunc}>{ing.function}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${ing.riskScore * 10}%`,
                        backgroundColor: getRiskColor(ing.riskLevel),
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Nút Đánh giá */}
      <TouchableOpacity style={styles.evalBtn} onPress={handleEvaluate}>
        <Text style={styles.evalText}>Đánh giá</Text>
      </TouchableOpacity>

      {/* Modal chi tiết thành phần */}
      {modalData && (
        <Modal visible onRequestClose={() => setModalData(null)} animationType="slide">
          <ScrollView style={styles.modalContent}>
            <TouchableOpacity onPress={() => setModalData(null)}>
              <MaterialIcons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{modalData.name}</Text>
            <Text style={{ color: getRiskColor(modalData.riskLevel), fontWeight: 'bold' }}>
              {modalData.riskScore}/10
            </Text>
            <Text style={styles.sectionHeader}>Công dụng</Text>
            <Text>{modalData.usage}</Text>
            {modalData.concerns.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Mối quan ngại</Text>
                {modalData.concerns.map((c, j) => <Text key={j}>• {c}</Text>)}
              </>
            )}
          </ScrollView>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, padding: 12, paddingTop: 60, backgroundColor: '#f3fdf7' },
  backButton:       { position: 'absolute', top: 16, left: 16, zIndex: 10 },

  card:             { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, elevation: 2 },
  title:            { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },

  scoreBox:         { alignItems: 'center' },
  scoreCircle:      { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  scoreText:        { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  scoreLabel:       { fontSize: 14, color: '#666' },

  cardTitle:        { fontSize: 16, fontWeight: '600', marginBottom: 8 },

  // Chart wrapper vuông để PieChart không bị méo
  chartWrapper:     { width: CHART_SIZE, height: CHART_SIZE, alignSelf: 'center', marginBottom: 8 },
  legendContainer:  { paddingLeft: 12 },
  legendItem:       { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  legendDot:        { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendLabel:      { fontSize: 12 },

  // Danh sách thành phần: vùng cố định, scroll dọc
  ingListWrapper:   { maxHeight: 200 },  // bạn có thể điều chỉnh chiều cao
  ingItem:          { marginBottom: 12, padding: 8, backgroundColor: '#fafafa', borderRadius: 6 },
  ingRow:           { flexDirection: 'row', alignItems: 'center' },
  ingName:          { flex: 1, marginLeft: 6, fontSize: 14 },
  ingFunc:          { fontSize: 12, color: '#888' },
  progressBar:      { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressFill:     { height: 6 },

  evalBtn:          { backgroundColor: '#198754', padding: 14, borderRadius: 8, alignItems: 'center', marginVertical: 12 },
  evalText:         { color: '#fff', fontWeight: 'bold' },

  modalContent:     { flex: 1, padding: 12, backgroundColor: '#fff' },
  modalTitle:       { fontSize: 22, fontWeight: 'bold', marginVertical: 12 },
  sectionHeader:    { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
});
