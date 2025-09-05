// app/PersonalizedAssessmentScreen.js

import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PersonalizedAssessmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 1) Dữ liệu mẫu nếu params rỗng
  const sampleProfile = {
    skinType: 'Da hỗn hợp',
    skinConcerns: ['Mụn đầu đen', 'Lỗ chân lông to', 'Vùng T dầu'],
    allergies: ['Paraben', 'Sulfate'],
    ageGroup: '25-35 tuổi',
    isPregnant: false,
  };
  const profile = params.userProfile
    ? JSON.parse(params.userProfile)
    : sampleProfile;

  const sampleProductScore      = 6;
  const samplePersonalizedScore = 7.5;
  const productScore      = Number(params.productScore)      || sampleProductScore;
  const personalizedScore = Number(params.personalizedScore) || samplePersonalizedScore;

  const sampleIngredients = [
    { name: 'Methylparaben', riskLevel: 'harmful' },
    { name: 'Sodium Laureth Sulfate', riskLevel: 'harmful' },
    { name: 'Fragrance', riskLevel: 'harmful' },
    { name: 'Aqua', riskLevel: 'safe' },
    { name: 'Glycerin', riskLevel: 'safe' },
  ];
  let ingredients = sampleIngredients;
  try {
    ingredients = params.ingredients
      ? JSON.parse(params.ingredients)
      : sampleIngredients;
  } catch {}

  const sampleAlternatives = [
    {
      name: 'CeraVe Foaming Cleanser',
      brand: 'CeraVe',
      score: 2,
      price: '320.000đ',
      keyBenefits: ['Không paraben', 'Có ceramide', 'Dịu nhẹ'],
      availableAt: ['Guardian', 'Watsons', 'Online'],
    },
    {
      name: 'La Roche-Posay Toleriane Caring Wash',
      brand: 'La Roche-Posay',
      score: 1,
      price: '450.000đ',
      keyBenefits: ['Không sulfate', 'Dành cho da nhạy cảm', 'Nước khoáng'],
      availableAt: ['Pharmacies', 'Guardian', 'Hasaki'],
    },
  ];
  let alternatives = sampleAlternatives;
  try {
    alternatives = params.alternatives
      ? JSON.parse(params.alternatives)
      : sampleAlternatives;
  } catch {}

  const aiAnalysis = params.aiAnalysis ||
    'Dựa trên hồ sơ da (Da hỗn hợp, 25-35 tuổi, dị ứng Paraben và Sulfate), sản phẩm này có điểm rủi ro cao hơn so với điểm chung. Thành phần Methylparaben và SLS đặc biệt cần lưu ý vì có thể gây kích ứng và làm mất cân bằng độ ẩm tự nhiên của da bạn. Khuyên bạn chọn sản phẩm thay thế không chứa paraben và sulfate để phù hợp hơn với loại da của bạn.';

  const getScoreColor = score => {
    if (score <= 3) return styles.greenText;
    if (score <= 6) return styles.yellowText;
    return styles.redText;
  };
  const getScoreLabel = score => {
    if (score <= 3) return 'An toàn';
    if (score <= 6) return 'Cần cân nhắc';
    return 'Không khuyến khích';
  };

  const riskFactors = ingredients
    .filter(i => i.riskLevel !== 'safe')
    .map(i => i.name);
  const safeForUser = ingredients
    .filter(i => i.riskLevel === 'safe')
    .map(i => i.name);

  const scores = [
    { label: 'Điểm chung', score: productScore },
    { label: 'Điểm cá nhân hóa', score: personalizedScore },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      {/* Card 1: Scores */}
      <View style={[styles.card, { marginTop: 20 }]}>
        <Text style={styles.cardHeader}>Đánh giá dành riêng cho bạn</Text>
        {scores.map((item, idx) => (
          <View key={idx} style={styles.sliderBlock}>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>{item.label}</Text>
              <Text style={[styles.sliderValue, getScoreColor(item.score)]}>
                {item.score}/10
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              value={item.score}
              disabled
            />
            {idx === 1 && (
              <Text style={[styles.subLabel, getScoreColor(item.score)]}>
                {getScoreLabel(item.score)}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Card 2: Profile */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Hồ sơ sức khỏe của bạn</Text>
        <View style={styles.profileRow}>
          <View style={styles.profileCol}>
            <Text>Loại da: <Text style={styles.bold}>{profile.skinType}</Text></Text>
            <Text>Độ tuổi: <Text style={styles.bold}>{profile.ageGroup}</Text></Text>
            {profile.skinConcerns.length > 0 && <Text>Mối quan tâm:</Text>}
            <View style={styles.tagRow}>
              {profile.skinConcerns.map((c,i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.profileCol}>
            {profile.allergies.length > 0 && (
              <>
                <Text style={styles.redText}>Dị ứng:</Text>
                <View style={styles.tagRow}>
                  {profile.allergies.map((a,i) => (
                    <View key={i} style={[styles.tag, styles.tagRed]}>
                      <Text style={styles.tagTextWhite}>{a}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {profile.isPregnant && (
              <Text style={styles.yellowText}>Đang mang thai</Text>
            )}
          </View>
        </View>
      </View>

      {/* Card 3: Risk & Safe */}
      <View style={styles.card}>
        <View style={styles.riskRow}>
          {riskFactors.length > 0 && (
            <View style={styles.riskBlock}>
              <Text style={[styles.blockHeader, styles.redText]}>
                <Ionicons name="alert-circle-outline" size={16} /> Cần chú ý với bạn
              </Text>
              {riskFactors.map((r,i) => (
                <Text key={i} style={[styles.blockItem, styles.redText]}>
                  • {r}
                </Text>
              ))}
            </View>
          )}
          {safeForUser.length > 0 && (
            <View style={styles.safeBlock}>
              <Text style={[styles.blockHeader, styles.greenText]}>
                <Ionicons name="checkmark-circle-outline" size={16} /> An toàn cho bạn
              </Text>
              {safeForUser.map((s,i) => (
                <Text key={i} style={[styles.blockItem, styles.greenText]}>
                  • {s}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Card 4: AI Analysis */}
      <View style={[styles.card, styles.cardBlue]}>
        <Text style={styles.blockHeader}>Phân tích AI chi tiết</Text>
        <Text style={styles.aiText}>{aiAnalysis}</Text>
      </View>

      {/* Card 5: Alternatives */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>
          <Ionicons name="cart-outline" size={18} /> Sản phẩm thay thế được gợi ý
        </Text>
        {alternatives.map((p,i) => (
          <View key={i} style={styles.altCard}>
            <View style={styles.altRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.altName}>{p.name}</Text>
                <Text style={styles.altBrand}>by {p.brand}</Text>
              </View>
              <View style={styles.altScoreWrap}>
                <Text style={[styles.altScore, getScoreColor(p.score)]}>
                  {p.score}/10
                </Text>
                <Text style={styles.altPrice}>{p.price}</Text>
              </View>
            </View>
            <Text style={styles.subHeader}>Ưu điểm chính:</Text>
            <View style={styles.tagRow}>
              {p.keyBenefits.map((b,j)=>(
                <View key={j} style={styles.tag}>
                  <Text style={styles.tagText}>{b}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.subHeader}>Có tại:</Text>
            <Text>{p.availableAt.join(', ')}</Text>
            <TouchableOpacity style={styles.detailBtn}>
              <Text style={styles.detailBtnText}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Button Quay lại trang chủ */}
      <TouchableOpacity
        style={styles.homeBtn}
        onPress={() => router.push('HomeScreen')}
      >
        <Text style={styles.homeBtnText}>Quay lại trang chủ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex:1, backgroundColor:'#f3fdf7', padding:12, paddingTop:80 },
  backButton:     { position:'absolute', top:-20, left: 0, zIndex:10 },

  card:           { backgroundColor:'#fff', borderRadius:8, padding:16, marginBottom:12, elevation:2 },
  cardHeader:     { fontSize:16, fontWeight:'600', marginBottom:12 },

  // sliders
  sliderBlock:    { marginBottom:16 },
  sliderRow:      { flexDirection:'row', justifyContent:'space-between', marginBottom:4 },
  sliderLabel:    { fontSize:14 },
  sliderValue:    { fontSize:14, fontWeight:'700' },
  slider:         { width:'100%', height:32 },
  subLabel:       { fontSize:12, marginTop:4 },

  greenText:      { color:'#4CAF50' },
  yellowText:     { color:'#FFC107' },
  redText:        { color:'#F44336' },

  // profile
  profileRow:     { flexDirection:'row' },
  profileCol:     { flex:1, paddingRight:8 },
  bold:           { fontWeight:'500' },
  tagRow:         { flexDirection:'row', flexWrap:'wrap', marginTop:4 },
  tag:            { backgroundColor:'#eee', borderRadius:12, paddingHorizontal:8, paddingVertical:4, marginRight:6, marginBottom:6 },
  tagText:        { fontSize:12 },
  tagRed:         { backgroundColor:'#F44336' },
  tagTextWhite:   { color:'#fff', fontSize:12 },

  // risk & safe
  riskRow:        { flexDirection:'row' },
  riskBlock:      { flex:1, paddingRight:8 },
  safeBlock:      { flex:1, paddingLeft:8 },
  blockHeader:    { fontSize:14, fontWeight:'600', marginBottom:6 },
  blockItem:      { fontSize:13, marginBottom:4 },

  // AI
  cardBlue:       { backgroundColor:'#E8F0FE' },
  aiText:         { fontSize:13, lineHeight:20 },

  // alternatives
  altCard:        { backgroundColor:'#fafafa', borderRadius:6, padding:12, marginBottom:12 },
  altRow:         { flexDirection:'row', alignItems:'center', marginBottom:8 },
  altName:        { fontSize:15, fontWeight:'600' },
  altBrand:       { fontSize:12, color:'#555', marginTop:4 },
  altScoreWrap:   { alignItems:'flex-end' },
  altScore:       { fontSize:16, fontWeight:'700' },
  altPrice:       { fontSize:12, color:'#555', marginTop:4 },
  subHeader:      { fontSize:13, fontWeight:'500', marginBottom:4 },
  detailBtn:      { alignSelf:'flex-end', marginTop:8 },
  detailBtnText:  { color:'#198754', fontWeight:'600' },

  // home button
  homeBtn:        { backgroundColor:'#17863d', padding:14, borderRadius:8, alignItems:'center', marginTop:16, marginBottom:40 },
  homeBtnText:    { color:'#fff', fontWeight:'bold' },
});
