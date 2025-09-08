// app/ChatbotScreen.js
import React, { useRef, useState, useEffect, useMemo } from 'react';
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
import Markdown from 'react-native-markdown-display';

/* ====== API base ====== */
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

const QUICK_CARD_WIDTH = 170;
const QUICK_CARD_PH = 12;
const QUICK_CARD_PV = 10;
const QUICK_CARD_TAG_FS = 11;
const QUICK_CARD_BODY_FS = 12;

/* ===== Helpers ===== */
const looksLikeTable = (txt = '') =>
  /\|.+\|\s*\n\|\-+/.test(txt) || /\|.+\|.+\|/.test(txt);

/** Phiên chat: { id, title, updatedAt, messages:[{role,text,ts}], firstUser } */
const SESSIONS_KEY = 'chat_sessions_v1';
async function loadSessions() {
  try { const raw = await AsyncStorage.getItem(SESSIONS_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
async function saveSessions(sessions) {
  try { await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)); } catch {}
}
function titleFromMessages(msgs) {
  const first = msgs.find(m => m.role === 'user');
  if (!first) return 'Cuộc trò chuyện';
  const t = first.text.trim().replace(/\s+/g, ' ');
  return t.length > 50 ? t.slice(0, 50) + '…' : t;
}

/* ====== FAQ builder (cá nhân hoá gọn) ====== */
function buildPersonalFAQ(profile) {
  const goals = (profile?.goals?.selected || []);
  const hasWeight = goals.some(g => /giảm cân/i.test(g));
  const hasMuscle = goals.some(g => /tăng cơ/i.test(g));
  return [
    { tag: 'PHÙ HỢP SỨC KHỎE', q: 'Sản phẩm này có phù hợp với tình trạng sức khỏe của tôi không?' },
    { tag: 'DỊ ỨNG', q: 'Sản phẩm này có an toàn với dị ứng của tôi không?' },
    { tag: 'MỤC TIÊU', q: hasWeight ? 'Sản phẩm này có hỗ trợ giảm cân không?' :
                       hasMuscle ? 'Sản phẩm này có hỗ trợ tăng cơ không?' :
                       'Sản phẩm này có phù hợp với mục tiêu sức khỏe của tôi không?' },
    { tag: 'KHẨU PHẦN', q: 'Tôi nên dùng khẩu phần và tần suất thế nào?' },
    { tag: 'ĐÁNH GIÁ', q: 'Đánh giá tổng quan sản phẩm dựa trên hồ sơ sức khỏe của tôi.' },
    { tag: 'THAY THẾ', q: 'Gợi ý lựa chọn lành mạnh hơn cùng nhóm sản phẩm.' },
  ];
}

/* ====== Component ====== */
export default function ChatbotScreen() {
  const router = useRouter();

  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Xin chào! Tôi là HealthScan AI — trợ lý sức khỏe thông minh của bạn. Hãy chụp ảnh thành phần hoặc đặt câu hỏi nhé! 🥬', ts: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // FAQ show/hide
  const [showFAQ, setShowFAQ] = useState(true);
  const [pulseFAQ, setPulseFAQ] = useState(false);

  // Hồ sơ & nhãn
  const [profile, setProfile] = useState(null);
  const [lastLabel, setLastLabel] = useState(null);

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const chatRef = useRef(null);
  const chatIdRef = useRef(`chat-${Date.now()}`);

  const profileLoaded = !!profile && Object.keys(profile || {}).length > 0;
  const labelLoaded = !!lastLabel && Object.keys(lastLabel || {}).length > 0;

  // Load profile, last label, sessions
  useEffect(() => {
    (async () => {
      try { const p = await getProfile(); setProfile(Object.keys(p || {}).length ? p : null); } catch {}
      try { const raw = await AsyncStorage.getItem('last_scan_label'); setLastLabel(raw ? JSON.parse(raw) : null); } catch {}
      const ss = await loadSessions(); setSessions(ss);
    })();
  }, []);

  useEffect(() => { if (!pulseFAQ) return; const t = setTimeout(() => setPulseFAQ(false), 1600); return () => clearTimeout(t); }, [pulseFAQ]);

  // Persist current conversation to sessions storage
  const persistSession = async (msgs) => {
    const id = chatIdRef.current;
    const updatedAt = new Date().toISOString();
    const existing = sessions.find(s => s.id === id);
    let nextSessions;
    if (existing) {
      existing.messages = msgs;
      existing.updatedAt = updatedAt;
      existing.title = titleFromMessages(msgs);
      nextSessions = [...sessions];
    } else {
      nextSessions = [{ id, messages: msgs, updatedAt, title: titleFromMessages(msgs) }, ...sessions];
    }
    setSessions(nextSessions);
    await saveSessions(nextSessions);
  };

  // Start new conversation
  const newChat = async () => {
    chatIdRef.current = `chat-${Date.now()}`;
    setMessages([{ role: 'bot', text: 'Bắt đầu cuộc trò chuyện mới. Bạn muốn hỏi gì về sản phẩm hoặc sức khỏe? 😊', ts: new Date() }]);
  };

  const onSend = async (textOverride) => {
    const t = (textOverride ?? input).trim();
    if (!t) return;
    const now = new Date();
    const nextUserMsgs = [...messages, { role: 'user', text: t, ts: now }];
    setMessages(nextUserMsgs);
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
        const errMsgs = [...nextUserMsgs, { role: 'bot', text: `Xin lỗi, có lỗi khi xử lý: ${data.error || 'unknown error'}`, ts: new Date() }];
        setMessages(errMsgs);
        await persistSession(errMsgs);
        return;
      }
      const botMsgs = [...nextUserMsgs, { role: 'bot', text: data.reply_markdown || '...', ts: new Date() }];
      setMessages(botMsgs);
      await persistSession(botMsgs);
    } catch (e) {
      setMessages(prev => prev.filter(m => !m._typing));
      const errMsgs = [...nextUserMsgs, { role: 'bot', text: `Mạng lỗi: ${String(e)}`, ts: new Date() }];
      setMessages(errMsgs);
      await persistSession(errMsgs);
    } finally {
      chatRef.current?.scrollToEnd({ animated: true });
    }
  };

  const addQuick = (q) => onSend(q);

  // FAQ (cá nhân hoá)
  const FAQ = useMemo(() => buildPersonalFAQ(profile || {}), [profile]);

  const toggleFAQ = () => { setShowFAQ(v => !v); if (!showFAQ) setPulseFAQ(true); };

  // Tool chips dưới câu trả lời bot (nằm dưới tin nhắn cuối cùng của bot)
  const renderBotTools = (isLast) => {
    if (!isLast) return null;
    return (
      <View style={styles.toolChipsRow}>
        <TouchableOpacity style={styles.toolChip} onPress={() => addQuick('Xem hồ sơ')}>
          <MaterialIcons name="badge" size={14} color={COLOR.green} /><Text style={styles.toolChipText}>Xem hồ sơ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolChip} onPress={() => addQuick('Xem thành phần')}>
          <MaterialIcons name="inventory" size={14} color={COLOR.green} /><Text style={styles.toolChipText}>Xem thành phần</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolChip}
          onPress={() => addQuick('Đề xuất các tiêu chí chọn sản phẩm tốt hơn dựa trên nhãn hiện tại và hồ sơ của tôi.')}
        >
          <MaterialIcons name="recommend" size={14} color={COLOR.green} /><Text style={styles.toolChipText}>Tiêu chí tốt hơn</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP BAR (gọn) */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.roundBtn} onPress={() => setMenuOpen(true)}>
          <MaterialIcons name="add" size={22} color={COLOR.green} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.roundBtn} onPress={() => router.push('HomeScreen')}>
          <MaterialIcons name="arrow-back" size={20} color={COLOR.green} />
        </TouchableOpacity>
      </View>

      {/* MENU */}
      <Modal visible={menuOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setShowHistory(true); }}>
              <MaterialIcons name="history" size={18} color="#111827" />
              <Text style={styles.menuText}>Lịch sử chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                setMenuOpen(false);
                try { const p = await getProfile(); setProfile(Object.keys(p || {}).length ? p : null); } catch {}
                try { const raw = await AsyncStorage.getItem('last_scan_label'); setLastLabel(raw ? JSON.parse(raw) : null); } catch {}
              }}
            >
              <MaterialIcons name="refresh" size={18} color="#111827" />
              <Text style={styles.menuText}>Tải lại hồ sơ & nhãn</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={async () => { setMenuOpen(false); await newChat(); }}>
              <MaterialIcons name="chat" size={18} color="#111827" />
              <Text style={styles.menuText}>Cuộc chat mới</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* WELCOME (CỐ ĐỊNH Ở ĐẦU) */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeHead}>
          <MaterialIcons name="star" size={20} color={COLOR.green} />
          <Text style={styles.welcomeTitle}>Chào mừng đến với HealthScan</Text>
          <Text style={styles.clock}>
            {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
          </Text>
        </View>
        <Text style={styles.welcomeSub}>AI phân tích thành phần & tư vấn sức khỏe cá nhân hóa</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}><MaterialIcons name="psychology" size={16} color={COLOR.green} /><Text style={styles.badgeText}>AI Analysis</Text></View>
          <View style={styles.badge}><MaterialIcons name="verified" size={16} color={COLOR.green} /><Text style={styles.badgeText}>Tư vấn an toàn</Text></View>
        </View>
      </View>

      {/* FAQ — có thể ẩn/hiện bằng nút ở composer */}
      {showFAQ && (
        <View style={styles.faqWrapCard}>
          <View style={styles.faqHeaderRow}>
            <MaterialIcons name="help-outline" size={18} color="#1e293b" />
            <Text style={styles.faqHeader}>Câu hỏi gợi ý cho bạn</Text>
            <TouchableOpacity style={styles.faqHideBtn} onPress={toggleFAQ}>
              <MaterialIcons name="close" size={18} color="#1e293b" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.faqRow, pulseFAQ && styles.faqPulse]}>
            {FAQ.map((f, idx) => (
              <TouchableOpacity key={idx} style={[styles.faqCard, { width: QUICK_CARD_WIDTH, paddingHorizontal: QUICK_CARD_PH, paddingVertical: QUICK_CARD_PV }]} activeOpacity={0.85} onPress={() => addQuick(f.q)}>
                <Text style={[styles.faqTag, { fontSize: QUICK_CARD_TAG_FS }]}>{f.tag}</Text>
                <Text style={[styles.faqQuestion, { fontSize: QUICK_CARD_BODY_FS }]} numberOfLines={3}>{f.q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* CHAT */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView ref={chatRef} style={styles.chat} contentContainerStyle={{ paddingVertical: 10 }} onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((m, i) => {
            const isLastBot = m.role === 'bot' && i === messages.length - 1;
            return (
              <View key={i} style={[styles.msgRow, m.role === 'user' && styles.msgRowRight]}>
                {m.role === 'bot' && <View style={styles.avatar}><FontAwesome5 name="robot" size={16} color="#0a4127" /></View>}
                <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
                  {m.role === 'user' ? (
                    <Text style={styles.textUser}>{m.text}</Text>
                  ) : looksLikeTable(m.text) ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Markdown style={mdStyles}>{m.text}</Markdown>
                    </ScrollView>
                  ) : (
                    <Markdown style={mdStyles}>{m.text}</Markdown>
                  )}
                  {renderBotTools(isLastBot)}
                </View>
              </View>
            );
          })}
          {messages.length > 0 && (
            <Text style={styles.tsText}>
              {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(messages[messages.length - 1].ts)}
            </Text>
          )}
        </ScrollView>

        {/* Composer */}
        <View style={styles.composer}>
          <TouchableOpacity onPress={toggleFAQ} style={styles.compIconBtn} accessibilityLabel="Ẩn/hiện câu hỏi nhanh">
            <MaterialIcons name="help-outline" size={20} color="#64748b" />
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

      {/* HISTORY MODAL — danh sách phiên chat */}
      <Modal visible={showHistory} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowHistory(false)}>
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <MaterialIcons name="history" size={18} color={COLOR.green} />
              <Text style={styles.historyTitle}>Lịch sử cuộc trò chuyện</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <MaterialIcons name="close" size={18} color="#111827" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {sessions.length === 0 && <Text style={{ color: '#6b7280' }}>Chưa có phiên chat nào.</Text>}
              {sessions.map((s, idx) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.sessionRow}
                  onPress={() => {
                    setMessages(s.messages || []);
                    chatIdRef.current = s.id;
                    setShowHistory(false);
                  }}
                >
                  <MaterialIcons name="chat" size={18} color={COLOR.green} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: '#0f172a' }}>{s.title || `Cuộc chat #${idx + 1}`}</Text>
                    <Text style={{ color: '#6b7280', fontSize: 12 }}>
                      {new Date(s.updatedAt || Date.now()).toLocaleString('vi-VN')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
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

  // Header nhỏ
  headerRow: {
    backgroundColor: COLOR.white,
    borderBottomWidth: 1, borderBottomColor: COLOR.border,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
  },
  roundBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: COLOR.white,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLOR.border,
  },

  // Menu
  menuOverlay: { flex: 1 },
  menu: {
    position: 'absolute', top: 70, left: 12,
    backgroundColor: COLOR.white, width: 260,
    borderRadius: 12, borderWidth: 1, borderColor: COLOR.border,
    paddingVertical: 8, elevation: 24, zIndex: 9999,
    shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  menuText: { color: '#111827', fontWeight: '600' },

  // Welcome cố định
  welcomeCard: { backgroundColor: COLOR.header, borderRadius: 10, marginHorizontal: 12, marginTop: 10, padding: 14, borderWidth: 1, borderColor: COLOR.border },
  welcomeHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  welcomeTitle: { fontSize: 18, fontWeight: '800', color: COLOR.green, flex: 1 },
  clock: { color: '#0b2e13', fontWeight: '700' },
  welcomeSub: { marginTop: 6, color: COLOR.textMuted },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLOR.white, borderWidth: 1, borderColor: COLOR.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: COLOR.green, fontWeight: '700' },

  // FAQ
  faqWrapCard: { backgroundColor: COLOR.white, borderRadius: 10, margin: 12, borderWidth: 1, borderColor: COLOR.border },
  faqHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  faqHideBtn: { marginLeft: 'auto', padding: 4 },
  faqHeader: { fontWeight: '800', color: '#1e293b' },
  faqRow: { paddingHorizontal: 10, paddingVertical: 12, gap: 10 },
  faqPulse: { borderBottomWidth: 2, borderBottomColor: COLOR.green },
  faqCard: { backgroundColor: COLOR.grayCard, borderRadius: 12, borderWidth: 1, borderColor: COLOR.border, justifyContent: 'space-between', marginRight: 10 },
  faqTag: { color: COLOR.tagGreen, fontWeight: '900', marginBottom: 6 },
  faqQuestion: { color: '#1f2937', fontWeight: '600' },

  // Chat
  chat: { flex: 1, paddingHorizontal: 12 },
  msgRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
    alignItems: 'flex-end',
    width: '100%',                 // <— thêm để hàng chiếm full width
  },
  msgRowRight: {
    flexDirection: 'row-reverse',  // <— đảo thứ tự avatar/bubble
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#c6f0d9', justifyContent: 'center', alignItems: 'center' },
  bubble: { maxWidth: '84%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  bubbleBot: { backgroundColor: COLOR.white, borderColor: COLOR.border },
  bubbleUser: { backgroundColor: '#eaf6ef', borderColor: COLOR.border, alignSelf: 'flex-end' },
  textUser: { color: '#0f172a', fontWeight: '600', textAlign: 'right' },
  tsText: { color: '#7c8f84', fontSize: 12, marginLeft: 50, marginTop: 4 },

  // Tool chips dưới câu trả lời bot
  toolChipsRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  toolChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0faf4', borderWidth: 1, borderColor: '#d3ecd9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  toolChipText: { color: COLOR.green, fontWeight: '700' },

  // Composer
  composer: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, borderTopWidth: 1, borderColor: COLOR.border, backgroundColor: COLOR.white },
  compIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLOR.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLOR.border },
  input: { flex: 1, borderWidth: 1, borderColor: COLOR.border, borderRadius: 22, paddingHorizontal: 14, color: '#000', backgroundColor: COLOR.white, height: 40 },
  sendBtn: { paddingHorizontal: 14, height: 40, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.green },

  // History (sessions)
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.16)' },
  historyCard: { position: 'absolute', top: 100, left: 12, right: 12, backgroundColor: COLOR.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLOR.border, elevation: 16 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  historyTitle: { color: '#0f172a', fontWeight: '800' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLOR.border, padding: 10, borderRadius: 10, marginBottom: 8 },
});

// Markdown styles
const mdStyles = {
  body: { color: '#111827', lineHeight: 20 },
  strong: { fontWeight: '800', color: '#0f172a' },
  em: { fontStyle: 'italic' },
  bullet_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  blockquote: { borderLeftWidth: 3, borderLeftColor: '#c8ebd3', paddingLeft: 10, color: '#0f172a', backgroundColor: '#f7fbf8' },
  code_block: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // Bảng
  table: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden', marginVertical: 6, minWidth: 280 },
  thead: { backgroundColor: '#eef7f2' },
  th: { backgroundColor: '#eef7f2', padding: 8, borderRightWidth: 1, borderColor: '#e5e7eb', fontWeight: '800' },
  tr: { borderBottomWidth: 1, borderColor: '#e5e7eb' },
  td: { padding: 8, borderRightWidth: 1, borderColor: '#e5e7eb' },
};
