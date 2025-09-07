// app/ChatbotScreen.js
import React, { useRef, useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from './lib/profileStorage';

/* ====== API base: giống ScanProductScreen để chạy tốt trên Expo Go/Web/Emu ====== */
function resolveApiBase() {
  let base = 'http://127.0.0.1:8888';
  try {
    const Constants = require('expo-constants').default;
    const extra = Constants?.expoConfig?.extra ?? Constants?.manifestExtra;
    if (extra?.API_BASE) base = String(extra.API_BASE);
  } catch {}
  const fromGlobal = (globalThis && (globalThis.EXPO_PUBLIC_API_BASE || globalThis.API_BASE)) || '';
  if (fromGlobal) base = String(fromGlobal);
  if (Platform.OS === 'android') {
    if (base.includes('localhost') || base.includes('127.0.0.1')) {
      base = base.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
    }
  }
  return base.replace(/\/$/, '');
}
const BACKEND = resolveApiBase();

/* ====== THEME ====== */
const COLOR = {
  bg: '#f4f6f8',
  header: '#e8f6e8',
  white: '#ffffff',
  grayCard: '#f2f4f5',
  border: '#e3e8ee',
  green: '#17863d',
  text: '#0f172a',
  textMuted: '#587164',
  tagGreen: '#0a8a3a',
};

/* ====== tham số card nhỏ ====== */
const QUICK_CARD_WIDTH = 150;
const QUICK_CARD_PH = 10;
const QUICK_CARD_PV = 10;
const QUICK_CARD_TAG_FS = 11;
const QUICK_CARD_BODY_FS = 12;

/* ====== Prompt “chuẩn siêu thị” ====== */
const PROMPT_TEMPLATES = [
  { tag: 'ĐÁNH GIÁ', q: 'Hãy đánh giá tổng quát sản phẩm dựa trên hồ sơ sức khỏe của tôi và thành phần + giá trị dinh dưỡng đã quét.' },
  { tag: 'TẦN SUẤT', q: 'Nếu tôi dùng sản phẩm này thì nên dùng bao nhiêu khẩu phần và với tần suất như thế nào mỗi tuần?' },
  { tag: 'ĐỐI TƯỢNG', q: 'Sản phẩm này có phù hợp cho trẻ em, người già hoặc phụ nữ mang thai không? Cần lưu ý gì?' },
  { tag: 'DỊ ỨNG', q: 'Với hồ sơ dị ứng của tôi, trong sản phẩm có thành phần nào cần tránh không?' },
  { tag: 'TIỂU ĐƯỜNG/NATRI', q: 'Với người tiền tiểu đường hoặc cao huyết áp, sản phẩm này có đường hoặc natri cao không? Nên kiểm soát ra sao?' },
  { tag: 'THAY THẾ', q: 'Gợi ý 2–3 lựa chọn thay thế lành mạnh hơn cùng nhóm sản phẩm.' },
];

export default function ChatbotScreen() {
  const router = useRouter();

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text:
        'Xin chào! Tôi là HealthScan AI - trợ lý sức khỏe thông minh của bạn. Hãy chụp ảnh thành phần của sản phẩm hoặc đặt câu hỏi về sức khỏe nhé! 🥬',
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pulseFAQ, setPulseFAQ] = useState(false);

  // Hồ sơ & nhãn quét gần nhất
  const [profile, setProfile] = useState(null);
  const [lastLabel, setLastLabel] = useState(null);
  const chatRef = useRef(null);
  const chatIdRef = useRef(`chat-${Date.now()}`);

  const profileLoaded = !!profile && Object.keys(profile || {}).length > 0;
  const labelLoaded = !!lastLabel && Object.keys(lastLabel || {}).length > 0;

  useEffect(() => {
    (async () => {
      try {
        const p = await getProfile();
        setProfile(Object.keys(p || {}).length ? p : null);
      } catch {}
      try {
        const raw = await AsyncStorage.getItem('last_scan_label');
        setLastLabel(raw ? JSON.parse(raw) : null);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!pulseFAQ) return;
    const t = setTimeout(() => setPulseFAQ(false), 2000);
    return () => clearTimeout(t);
  }, [pulseFAQ]);

  const onSend = async (textOverride) => {
    const t = (textOverride ?? input).trim();
    if (!t) return;
    const now = new Date();
    setMessages(prev => [...prev, { role: 'user', text: t, ts: now }]);
    setInput('');
    chatRef.current?.scrollToEnd({ animated: true });

    const typing = { role: 'bot', text: 'Đang phân tích...', ts: new Date(), _typing: true };
    setMessages(prev => [...prev, typing]);

    try {
      const resp = await fetch(`${BACKEND}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatIdRef.current,
          message: t,
          profile: profile || {},
          label: lastLabel || {},
        }),
      });
      const data = await resp.json();

      setMessages(prev => prev.filter(m => !m._typing));

      if (!data.ok) {
        setMessages(prev => [...prev, { role: 'bot', text: `Xin lỗi, có lỗi khi xử lý: ${data.error || 'unknown error'}`, ts: new Date() }]);
        return;
      }
      setMessages(prev => [...prev, { role: 'bot', text: data.reply_markdown || '...', ts: new Date() }]);
    } catch (e) {
      setMessages(prev => prev.filter(m => !m._typing));
      setMessages(prev => [...prev, { role: 'bot', text: `Mạng lỗi: ${String(e)}`, ts: new Date() }]);
    } finally {
      chatRef.current?.scrollToEnd({ animated: true });
    }
  };

  const addQuick = (q) => onSend(q);

  const dateStr = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  const timeStr = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date());

  const FAQ = [
    { tag: 'AN TOÀN', q: 'Sản phẩm này có an toàn cho trẻ em không?' },
    { tag: 'DỊ ỨNG', q: 'Thành phần nào trong sản phẩm này có thể gây dị ứng?' },
    { tag: 'SỨC KHỎE', q: 'Sản phẩm này có phù hợp với người tiểu đường không?' },
    { tag: 'THAY THẾ', q: 'Có sản phẩm nào tốt hơn không?' },
    { tag: 'TDP', q: 'Tác dụng phụ của sản phẩm này là gì?' },
    { tag: 'HƯỚNG DẪN', q: 'Hướng dẫn sử dụng sản phẩm này thế nào?' },
    ...PROMPT_TEMPLATES,
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.roundBtn} onPress={() => setMenuOpen(true)}>
          <MaterialIcons name="add" size={22} color={COLOR.green} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{dateStr}</Text>
        <TouchableOpacity style={styles.roundBtn} onPress={() => router.push('HomeScreen')}>
          <MaterialIcons name="arrow-back" size={20} color={COLOR.green} />
        </TouchableOpacity>
      </View>

      {/* MENU */}
      <Modal visible={menuOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setShowHistory(true); }}>
              <MaterialIcons name="schedule" size={18} color="#111827" />
              <Text style={styles.menuText}>Lịch sử chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                setMenuOpen(false);
                try {
                  const p = await getProfile();
                  setProfile(Object.keys(p || {}).length ? p : null);
                } catch {}
                try {
                  const raw = await AsyncStorage.getItem('last_scan_label');
                  setLastLabel(raw ? JSON.parse(raw) : null);
                } catch {}
              }}
            >
              <MaterialIcons name="refresh" size={18} color="#111827" />
              <Text style={styles.menuText}>Tải lại hồ sơ & nhãn</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setPulseFAQ(true); }}>
              <MaterialIcons name="help-outline" size={18} color="#111827" />
              <Text style={styles.menuText}>Câu hỏi nhanh</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* WELCOME */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeHead}>
          <MaterialIcons name="star" size={20} color={COLOR.green} />
          <Text style={styles.welcomeTitle}>Chào mừng đến với HealthScan</Text>
          <Text style={styles.clock}>{timeStr}</Text>
        </View>
        <Text style={styles.welcomeSub}>AI thông minh giúp phân tích thành phần sản phẩm và tư vấn sức khỏe cá nhân hóa</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}><MaterialIcons name="psychology" size={16} color={COLOR.green} /><Text style={styles.badgeText}>AI Analysis</Text></View>
          <View style={styles.badge}><MaterialIcons name="verified" size={16} color={COLOR.green} /><Text style={styles.badgeText}>Tư vấn an toàn</Text></View>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.infoPill, profileLoaded ? styles.okPill : styles.missPill]}>
            <MaterialIcons name={profileLoaded ? 'check-circle' : 'error-outline'} size={14} color={profileLoaded ? '#0a7f2e' : '#8a6d3b'} />
            <Text style={[styles.infoText, { color: profileLoaded ? '#0a7f2e' : '#8a6d3b' }]}>{profileLoaded ? 'Đã tải Hồ sơ' : 'Chưa có Hồ sơ'}</Text>
          </View>
          <View style={[styles.infoPill, labelLoaded ? styles.okPill : styles.missPill]}>
            <MaterialIcons name={labelLoaded ? 'check-circle' : 'error-outline'} size={14} color={labelLoaded ? '#0a7f2e' : '#8a6d3b'} />
            <Text style={[styles.infoText, { color: labelLoaded ? '#0a7f2e' : '#8a6d3b' }]}>{labelLoaded ? 'Đã có Nhãn quét' : 'Chưa có Nhãn quét'}</Text>
          </View>
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.faqWrapCard}>
        <View style={styles.faqHeaderRow}>
          <MaterialIcons name="help-outline" size={18} color="#1e293b" />
          <Text style={styles.faqHeader}>Câu hỏi thường gặp</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.faqRow, pulseFAQ && styles.faqPulse]}>
          {[
            { tag: 'AN TOÀN', q: 'Sản phẩm này có an toàn cho trẻ em không?' },
            { tag: 'DỊ ỨNG', q: 'Thành phần nào trong sản phẩm này có thể gây dị ứng?' },
            { tag: 'SỨC KHỎE', q: 'Sản phẩm này có phù hợp với người tiểu đường không?' },
            { tag: 'THAY THẾ', q: 'Có sản phẩm nào tốt hơn không?' },
            { tag: 'TDP', q: 'Tác dụng phụ của sản phẩm này là gì?' },
            { tag: 'HƯỚNG DẪN', q: 'Hướng dẫn sử dụng sản phẩm này thế nào?' },
            ...PROMPT_TEMPLATES,
          ].map((f, idx) => (
            <TouchableOpacity key={idx} style={[styles.faqCard, { width: QUICK_CARD_WIDTH, paddingHorizontal: QUICK_CARD_PH, paddingVertical: QUICK_CARD_PV }]} activeOpacity={0.85} onPress={() => addQuick(f.q)}>
              <Text style={[styles.faqTag, { fontSize: QUICK_CARD_TAG_FS }]}>{f.tag}</Text>
              <Text style={[styles.faqQuestion, { fontSize: QUICK_CARD_BODY_FS }]} numberOfLines={3}>{f.q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CHAT */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView ref={chatRef} style={styles.chat} contentContainerStyle={{ paddingVertical: 10 }} onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((m, i) => (
            <View key={i} style={[styles.msgRow, m.role === 'user' && styles.msgRowRight]}>
              {m.role === 'bot' && <View style={styles.avatar}><FontAwesome5 name="robot" size={16} color="#0a4127" /></View>}
              <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={m.role === 'user' ? styles.textUser : styles.textBot}>{m.text}</Text>
              </View>
            </View>
          ))}
          {messages.length > 0 && (
            <Text style={styles.tsText}>
              {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(messages[messages.length - 1].ts)}
            </Text>
          )}
        </ScrollView>

        <View style={styles.composer}>
          <TouchableOpacity onPress={() => setPulseFAQ(true)} style={styles.compIconBtn}>
            <MaterialIcons name="image" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.compIconBtn}>
            <MaterialIcons name="keyboard-voice" size={20} color="#64748b" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Đặt câu hỏi về sức khỏe hoặc sản phẩm..."
            placeholderTextColor="#8aa0a6"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => onSend()}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={() => onSend()} style={styles.sendBtn} activeOpacity={0.9}>
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* HISTORY MODAL */}
      <Modal visible={showHistory} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowHistory(false)}>
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <MaterialIcons name="schedule" size={18} color={COLOR.green} />
              <Text style={styles.historyTitle}>Lịch sử chat</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <MaterialIcons name="close" size={18} color="#111827" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {messages.map((m, i) => (
                <View key={i} style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: '600', color: '#0f172a' }}>{m.role === 'user' ? 'Bạn' : 'HealthScan AI'}</Text>
                  <Text style={{ color: '#111827' }}>{m.text}</Text>
                </View>
              ))}
              {messages.length === 0 && <Text style={{ color: '#6b7280' }}>Chưa có tin nhắn.</Text>}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR.bg },
  headerRow: { backgroundColor: COLOR.white, borderBottomWidth: 1, borderBottomColor: COLOR.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  roundBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLOR.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLOR.border },
  dateText: { color: '#0b2e13', fontWeight: '700', flex: 1 },

  menuOverlay: { flex: 1 },
  menu: { position: 'absolute', top: 70, left: 12, backgroundColor: COLOR.white, width: 240, borderRadius: 12, borderWidth: 1, borderColor: COLOR.border, paddingVertical: 8, elevation: 24, zIndex: 9999, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  menuText: { color: '#111827', fontWeight: '600' },

  welcomeCard: { backgroundColor: COLOR.header, borderRadius: 10, marginHorizontal: 12, marginTop: 10, padding: 14, borderWidth: 1, borderColor: COLOR.border },
  welcomeHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  welcomeTitle: { fontSize: 18, fontWeight: '800', color: COLOR.green, flex: 1 },
  clock: { color: '#0b2e13', fontWeight: '700' },
  welcomeSub: { marginTop: 6, color: COLOR.textMuted },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLOR.white, borderWidth: 1, borderColor: COLOR.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: COLOR.green, fontWeight: '700' },

  infoRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  infoPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  okPill: { backgroundColor: '#e7f7ec', borderColor: '#c8ebd3' },
  missPill: { backgroundColor: '#fff5e6', borderColor: '#ffe0b2' },
  infoText: { fontWeight: '700' },

  faqWrapCard: { backgroundColor: COLOR.white, borderRadius: 10, margin: 12, borderWidth: 1, borderColor: COLOR.border },
  faqHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  faqHeader: { fontWeight: '800', color: '#1e293b' },
  faqRow: { paddingHorizontal: 10, paddingVertical: 12, gap: 10 },
  faqPulse: { borderBottomWidth: 2, borderBottomColor: COLOR.green },

  faqCard: { backgroundColor: COLOR.grayCard, borderRadius: 12, borderWidth: 1, borderColor: COLOR.border, justifyContent: 'space-between', marginRight: 10 },
  faqTag: { color: COLOR.tagGreen, fontWeight: '900', marginBottom: 6 },
  faqQuestion: { color: '#1f2937', fontWeight: '600' },

  chat: { flex: 1, paddingHorizontal: 12 },
  msgRow: { flexDirection: 'row', gap: 8, marginVertical: 6, alignItems: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#c6f0d9', justifyContent: 'center', alignItems: 'center' },
  bubble: { maxWidth: '84%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  bubbleBot: { backgroundColor: COLOR.white, borderColor: COLOR.border },
  bubbleUser: { backgroundColor: '#eaf6ef', borderColor: COLOR.border, alignSelf: 'flex-end' },
  textBot: { color: '#111827' },
  textUser: { color: '#0f172a', fontWeight: '600', textAlign: 'right' },
  tsText: { color: '#7c8f84', fontSize: 12, marginLeft: 50, marginTop: 4 },

  composer: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, borderTopWidth: 1, borderColor: COLOR.border, backgroundColor: COLOR.white },
  compIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLOR.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLOR.border },
  input: { flex: 1, borderWidth: 1, borderColor: COLOR.border, borderRadius: 22, paddingHorizontal: 14, color: '#000', backgroundColor: COLOR.white, height: 40 },
  sendBtn: { paddingHorizontal: 14, height: 40, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.green },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.16)' },
  historyCard: { position: 'absolute', top: 100, left: 12, right: 12, backgroundColor: COLOR.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLOR.border, elevation: 16 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  historyTitle: { color: '#0f172a', fontWeight: '800' },

  msgRowRight: { justifyContent: 'flex-end', alignItems: 'flex-end' },
});
