// app/HealthProfileViewScreen.js
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileService from '../services/ProfileService';

export default function HealthProfileViewScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const p = await ProfileService.fetchProfile();
        setProfile(p);
      } catch (e) {
        setErr(String(e?.message || e));
      }
    })();
  }, []);

  const dv = useMemo(() => ProfileService.computeDerived(profile), [profile]);

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.title}>Chưa có hồ sơ</Text>
        <Text style={styles.dim}>{err ? `Lỗi: ${err}` : 'Hãy điền hồ sơ sức khỏe trước.'}</Text>
        <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={() => router.push('HomeScreen')}>
          <Text style={styles.btnText}>Bắt đầu tạo hồ sơ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const b = profile.basic || {};
  const conditions = profile.conditions || [];
  const allergies = profile.allergies || [];
  const goals = profile.goals || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Thông Tin Sức Khỏe</Text>

      {/* Thông tin cơ bản */}
      <View style={styles.card}>
        <Text style={styles.section}>Thông tin cơ bản</Text>
        <Row k="Tuổi" v={b.age ?? '-'} />
        <Row k="Giới tính" v={(b.sex === 'female' ? 'Nữ' : 'Nam')} />
        <Row k="Cân nặng" v={b.weight_kg ? `${b.weight_kg} kg` : '-'} />
        <Row k="Chiều cao" v={b.height_cm ? `${b.height_cm} cm` : '-'} />
        <Row k="Mức vận động" v={{
          sedentary:'Ít vận động', light:'Vận động nhẹ', moderate:'Vận động vừa', high:'Vận động nhiều', athlete:'Vận động cường độ cao'
        }[(b.activity_level||'moderate')] || '-' } />
      </View>

      {/* Chỉ số suy luận */}
      <View style={styles.card}>
        <Text style={styles.section}>Chỉ số ước tính</Text>
        <Row k="BMI" v={dv.bmi != null ? `${dv.bmi} (${dv.bmi_cat})` : '-'} />
        <Row k="BMR" v={dv.bmr != null ? `${dv.bmr} kcal/ngày` : '-'} />
        <Row k="TDEE" v={dv.tdee != null ? `${dv.tdee} kcal/ngày` : '-'} />
      </View>

      {/* Tình trạng sức khỏe */}
      <View style={styles.card}>
        <Text style={styles.section}>Tình trạng sức khỏe</Text>
        {conditions.length ? (
          <View style={styles.tagsWrap}>{conditions.map((c, i) => <Tag key={i} text={labelOfCondition(c)} />)}</View>
        ) : <Text style={styles.dim}>— Không có —</Text>}
      </View>

      {/* Dị ứng & hạn chế */}
      <View style={styles.card}>
        <Text style={styles.section}>Dị ứng & hạn chế</Text>
        {allergies.length ? (
          <View style={styles.tagsWrap}>{allergies.map((a, i) => <Tag key={i} text={labelOfAllergy(a)} kind="danger" />)}</View>
        ) : <Text style={styles.dim}>— Không có —</Text>}
      </View>

      {/* Mục tiêu */}
      <View style={styles.card}>
        <Text style={styles.section}>Mục tiêu sức khỏe</Text>
        {goals.length ? (
          <View style={styles.tagsWrap}>{goals.map((g, i) => <Tag key={i} text={labelOfGoal(g)} kind="success" />)}</View>
        ) : <Text style={styles.dim}>— Chưa đặt mục tiêu —</Text>}
        {!!profile.notes && <Text style={{ marginTop: 8, color: '#214d37' }}>Ghi chú: {profile.notes}</Text>}
      </View>

      <TouchableOpacity style={[styles.btn, { alignSelf: 'center', marginBottom: 24 }]} onPress={() => router.push('HomeScreen')}>
        <Text style={styles.btnText}>Chỉnh sửa hồ sơ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ k, v }) {
  return (
    <View style={styles.row}>
      <Text style={styles.key}>{k}</Text>
      <Text style={styles.val}>{String(v)}</Text>
    </View>
  );
}
function Tag({ text, kind = 'neutral' }) {
  const map = {
    neutral: { bg: '#eef5f0', fg: '#1c5a41', bd: '#cfe6da' },
    danger:  { bg: '#fde8e7', fg: '#b12a21', bd: '#f3c9c6' },
    success: { bg: '#e6f7ed', fg: '#0f7a4a', bd: '#cbead7' },
  }[kind];
  return (
    <View style={[styles.tag, { backgroundColor: map.bg, borderColor: map.bd }]}>
      <Text style={[styles.tagText, { color: map.fg }]}>{text}</Text>
    </View>
  );
}

// map code -> nhãn hiển thị (chỉnh theo danh sách của bạn)
const labelOfCondition = (c) => ({
  diabetes: 'Tiểu đường',
  hypertension: 'Huyết áp cao',
  cardiovascular: 'Bệnh tim mạch',
  underweight: 'Thiếu cân',
  obesity: 'Béo phì',
  respiratory_failure: 'Suy hô hấp',
}[c] || c);

const labelOfAllergy = (a) => ({
  gluten: 'Gluten', lactose: 'Lactose', peanut: 'Đậu phộng', shellfish: 'Tôm cua', cheese: 'Phô mai',
}[a] || a);

const labelOfGoal = (g) => ({
  lose_weight: 'Giảm cân', maintain_weight: 'Duy trì cân nặng', cardio_health: 'Cải thiện tim mạch',
  energy_up: 'Tăng năng lượng', gain_weight: 'Tăng cân', muscle_gain: 'Tăng cơ bắp',
  digestion: 'Cải thiện tiêu hóa', glycemic_control: 'Kiểm soát đường huyết', better_sleep: 'Ngủ ngon hơn',
  stress_down: 'Giảm stress',
}[g] || g);

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f3fdf7' },
  header: { fontSize: 22, fontWeight: '800', color: '#0b1020', marginBottom: 10 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#e5efe9' },
  section: { fontSize: 16, fontWeight: '800', color: '#163c2a', marginBottom: 8 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e8efe9' },
  key: { color: '#214d37' },
  val: { color: '#0c1e15', fontWeight: '700' },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  tagText: { fontWeight: '700' },

  dim: { color: '#7c8f84' },
  btn: { backgroundColor: '#1d7a46', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
});
