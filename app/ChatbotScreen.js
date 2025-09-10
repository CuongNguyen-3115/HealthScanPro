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

/** Parse ts về Date an toàn */
function toValidDate(input) {
  if (input instanceof Date) return input;
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}
function reviveMsgDates(msgs = []) {
  return msgs.map(m => ({ ...m, ts: toValidDate(m.ts) || new Date() }));
}

/** Sessions */
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

/* ====== FAQ builder ====== */
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

/* ====== Lỗi dạng 3 dòng cho Gemini 429 ====== */
function formatBackendError(s) {
  const msg = String(s || '');
  if (/Gemini.*429/i.test(msg) && /RuntimeError/i.test(msg)) {
    return [
      'Xin lỗi, có lỗi khi xử lý:',
      'Gemini error: RuntimeError',
      'Gemini 429: Hết quota Free Tier/đang quá tải. Hãy bật billing hoặc giảm tần suất gọi.',
    ].join('\n');
  }
  return `Xin lỗi, có lỗi khi xử lý:\n${msg}`;
}

/* ====== Markdown giải thích (đã rút gọn để không tràn ngang) ====== */
const HEALTH_INFO_MD = `
**Điểm sức khỏe (cá nhân hoá) là gì?**

- Thang **0–8** (8 là tốt nhất). Cá nhân hoá theo **hồ sơ** của bạn (tình trạng, mục tiêu).
- Dùng để **so sánh nhanh** trong cùng nhóm khi mua sắm.

**Cách tính (rút gọn / 100 g):**
- Đường: ≤ **5 g** → **+2**; 5–8 g → **+1**; >8 g → **−1**
- Natri: ≤ **120 mg** → **+2**; >400 mg → **−1**
- Bão hoà: ≤ **3 g** → **+1**; >5 g → **−1**
- Nếu mục tiêu **tăng cơ**: **Protein ≥10 g** → **+2**
- Nếu mục tiêu **tiêu hoá/giảm cân**: **Chất xơ ≥5 g** → **+1**
- Với **snack**: năng lượng > **480 kcal/100 g** → **−1**

**Đọc điểm:**
- **≥ 6.5**  → *Phù hợp*
- **4.0–6.4** → *Cần cân nhắc*
- **1.0–3.9** → *Hạn chế*
- **< 1.0**   → *Tránh* (đặc biệt nếu có **trans fat** hoặc **dị ứng**)

**Ví dụ:** Mì khô 100 g: đường 3.5 g (+2), natri 90 mg (+2), bão hoà 1.2 g (+1), protein 11 g (+2 nếu tăng cơ), xơ 2 g (0), năng lượng 300 kcal (0) → **7/8** (*Phù hợp*).

*Lưu ý: thang nội bộ HealthScan tham chiếu khuyến nghị WHO, FDA; không thay thế tư vấn y khoa.*
`;

const NUTRI_INFO_MD = `
**Nutri-Score (tham khảo) là gì?**

- Nhãn 5 mức **A → E** theo **100 g / 100 ml**, giúp so sánh **nhanh** trong *cùng nhóm*.
- **Điểm tổng =** (năng lượng + đường + bão hoà + natri) **−** (chất xơ + protein + % trái cây/rau/hạt + dầu tốt).
- **Quy đổi (đồ ăn):**
  - Tổng điểm **≤ −1** → **A**
  - **≤ 2** → **B**
  - **≤ 10** → **C**
  - **≤ 18** → **D**
  - **> 18** → **E**
  - *(Đồ uống có quy tắc riêng.)*

**Minh hoạ ngưỡng:**
- Đường ~4.5/9/13.5/18/22.5… g → tăng dần **điểm trừ**
- Natri ~90/180/270/…/900 mg → tăng dần **điểm trừ**
- Xơ ~1/2/3/3.5/4.7 g → tăng dần **điểm cộng**
- Protein ~1.6/3.2/4.8/6.4/8 g → tăng dần **điểm cộng**

**Ví dụ:** Ngũ cốc 100 g: ~1600 kJ, đường 18 g, bão hoà 1.5 g, natri 200 mg, xơ 7 g, protein 11 g → tổng **≈3–6** ⇒ **C–B** (tham khảo).

**Cách dùng đúng:**
- So sánh **nhanh** trong **cùng nhóm**; **không** cá nhân hoá theo bệnh nền/mục tiêu.
- Trên HealthScan, Nutri-Score chỉ là **tham khảo**; quyết định dựa trên **Điểm sức khỏe cá nhân hoá**.

**Nguồn:** Santé publique France (Nutri-Score), EFSA/EU, WHO, FDA. Ứng dụng dùng phiên bản **rút gọn** bám sát quy tắc gốc.
`;

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

  // trạng thái đang gửi & AbortController
  const [isPending, setIsPending] = useState(false);
  const abortRef = useRef(null);

  // Modals
  const [showHealthInfo, setShowHealthInfo] = useState(false);
  const [showNutriInfo, setShowNutriInfo] = useState(false);

  // Load profile, last label, sessions
  useEffect(() => {
    (async () => {
      try { const p = await getProfile(); setProfile(Object.keys(p || {}).length ? p : null); } catch {}
      try { const raw = await AsyncStorage.getItem('last_scan_label'); setLastLabel(raw ? JSON.parse(raw) : null); } catch {}
      const ss = await loadSessions(); setSessions(ss);
    })();
  }, []);

  useEffect(() => { if (!pulseFAQ) return; const t = setTimeout(() => setPulseFAQ(false), 1600); return () => clearTimeout(t); }, [pulseFAQ]);

  // Persist session
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

  // New chat
  const newChat = async () => {
    chatIdRef.current = `chat-${Date.now()}`;
    setMessages([{ role: 'bot', text: 'Bắt đầu cuộc trò chuyện mới. Bạn muốn hỏi gì về sản phẩm hoặc sức khỏe? 😊', ts: new Date() }]);
  };

  const onSend = async (textOverride) => {
    if (isPending) return;
    const t = (textOverride ?? input).trim();
    if (!t) return;

    const now = new Date();
    const nextUserMsgs = [...messages, { role: 'user', text: t, ts: now }];
    setMessages(nextUserMsgs);
    setInput('');
    chatRef.current?.scrollToEnd({ animated: true });

    const typing = { role: 'bot', text: 'Đang phân tích...', ts: new Date(), _typing: true };
    setMessages(prev => [...prev, typing]);

    setIsPending(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(`${BACKEND}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
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
        const errMsgs = [...nextUserMsgs, { role: 'bot', text: formatBackendError(data.error), ts: new Date() }];
        setMessages(errMsgs);
        await persistSession(errMsgs);
        return;
      }
      const botMsgs = [...nextUserMsgs, { role: 'bot', text: data.reply_markdown || '...', ts: new Date() }];
      setMessages(botMsgs);
      await persistSession(botMsgs);
    } catch (e) {
      setMessages(prev => prev.filter(m => !m._typing));
      if (e?.name === 'AbortError') {
        const stopMsgs = [...nextUserMsgs, { role: 'bot', text: '⏹️ Đã dừng phân tích theo yêu cầu.', ts: new Date() }];
        setMessages(stopMsgs);
        await persistSession(stopMsgs);
      } else {
        const errMsgs = [...nextUserMsgs, { role: 'bot', text: `Mạng lỗi: ${String(e)}`, ts: new Date() }];
        setMessages(errMsgs);
        await persistSession(errMsgs);
      }
    } finally {
      setIsPending(false);
      abortRef.current = null;
      chatRef.current?.scrollToEnd({ animated: true });
    }
  };

  /* ===== Đề xuất: 5 mục/lần qua /chat để đồng nhất format ===== */
  const requestRecommend = () => { if (!isPending) onSend('Sản phẩm thay thế'); };
  const requestMoreRecommend = () => { if (!isPending) onSend('Bổ sung sản phẩm thay thế'); };

  const addQuick = (q) => { if (!isPending) onSend(q); };
  const FAQ = useMemo(() => buildPersonalFAQ(profile || {}), [profile]);
  const toggleFAQ = () => { setShowFAQ(v => !v); if (!showFAQ) setPulseFAQ(true); };
  const onStop = () => { abortRef.current?.abort(); };

  const renderBotTools = (isLast) => {
    if (!isLast) return null;
    return (
      <View style={styles.toolChipsRow}>
        <TouchableOpacity style={[styles.toolChip, isPending && { opacity: 0.5 }]} onPress={() => addQuick('Xem hồ sơ')} disabled={isPending}>
          <MaterialIcons name="badge" size={14} color={COLOR.green} /><Text style={styles.toolChipText}>Xem hồ sơ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolChip, isPending && { opacity: 0.5 }]} onPress={() => addQuick('Xem thành phần')} disabled={isPending}>
          <MaterialIcons name="inventory" size={14} color={COLOR.green} /><Text style={styles.toolChipText}>Xem thành phần</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolChip, isPending && { opacity: 0.5 }]} onPress={requestRecommend} disabled={isPending}>
          <MaterialIcons name="recommend" size={14} color={COLOR.green} /><Text style={styles.toolChipText}>Sản phẩm thay thế</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolChip, isPending && { opacity: 0.5 }]} onPress={requestMoreRecommend} disabled={isPending}>
          <MaterialIcons name="playlist-add" size={14} color={COLOR.green} /><Text style={styles.toolChipText}>Bổ sung 5 sản phẩm</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolChip, isPending && { opacity: 0.5 }]} onPress={() => setShowHealthInfo(true)} disabled={isPending}>
          <MaterialIcons name="monitor-heart" size={14} color={COLOR.green} /><Text style={styles.toolChipText}>Điểm sức khỏe?</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolChip, isPending && { opacity: 0.5 }]} onPress={() => setShowNutriInfo(true)} disabled={isPending}>
          <MaterialIcons name="science" size={14} color={COLOR.green} /><Text style={styles.toolChipText}>Nutri-Score?</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* MENU */}
      <Modal visible={menuOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={async () => { setMenuOpen(false); await newChat(); }}>
              <MaterialIcons name="chat" size={18} color="#111827" />
              <Text style={styles.menuText}>Cuộc chat mới</Text>
            </TouchableOpacity>

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
          </View>
        </TouchableOpacity>
      </Modal>

      {/* WELCOME */}
      <View style={styles.welcomeCard}>
        <View style={styles.toolbarRow}>
          <View style={styles.toolbarSide}>
            <TouchableOpacity
              style={styles.toolbarBtn}
              onPress={() => router.push('HomeScreen')}
              accessibilityLabel="Quay lại"
            >
              <MaterialIcons name="arrow-back" size={20} color={COLOR.green} />
            </TouchableOpacity>
          </View>

          <View style={styles.toolbarCenter}>
            <MaterialIcons name="health-and-safety" size={30} color={COLOR.green} style={{ marginRight: 6 }} />
            <Text style={styles.toolbarTitle}>Chào mừng đến với HealthScan</Text>
          </View>

          <View style={[styles.toolbarSide, { alignItems: 'flex-end' }]}>
            <TouchableOpacity
              style={styles.toolbarBtn}
              onPress={() => setMenuOpen(true)}
              accessibilityLabel="Mở menu"
            >
              <MaterialIcons name="add" size={22} color={COLOR.green} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.welcomeSub}>
          AI phân tích thành phần & tư vấn sức khỏe cá nhân hóa
        </Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <MaterialIcons name="psychology" size={16} color={COLOR.green} />
            <Text style={styles.badgeText}>AI Analysis</Text>
          </View>
          <View style={styles.badge}>
            <MaterialIcons name="verified" size={16} color={COLOR.green} />
            <Text style={styles.badgeText}>Tư vấn an toàn</Text>
          </View>
        </View>
      </View>

      {/* FAQ */}
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
              <TouchableOpacity
                key={idx}
                style={[styles.faqCard, { width: QUICK_CARD_WIDTH, paddingHorizontal: QUICK_CARD_PH, paddingVertical: QUICK_CARD_PV }, isPending && { opacity: 0.6 }]}
                activeOpacity={0.85}
                onPress={() => onSend(f.q)}
                disabled={isPending}
              >
                <Text style={[styles.faqTag, { fontSize: QUICK_CARD_TAG_FS }]}>{f.tag}</Text>
                <Text style={[styles.faqQuestion, { fontSize: QUICK_CARD_BODY_FS }]} numberOfLines={3}>{f.q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* CHAT */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          ref={chatRef}
          style={styles.chat}
          contentContainerStyle={{ paddingVertical: 10 }}
          onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}
        >
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

          {/* render time an toàn */}
          {(() => {
            if (!messages.length) return null;
            const rawTs = messages[messages.length - 1]?.ts;
            const d = toValidDate(rawTs);
            if (!d) return null;
            return (
              <Text style={styles.tsText}>
                {new Intl.DateTimeFormat('vi-VN', {
                  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                }).format(d)}
              </Text>
            );
          })()}
        </ScrollView>

        {/* Composer */}
        <View style={styles.composer}>
          <TouchableOpacity onPress={toggleFAQ} style={[styles.compIconBtn, isPending && { opacity: 0.5 }]} accessibilityLabel="Ẩn/hiện câu hỏi nhanh" disabled={isPending}>
            <MaterialIcons name="help-outline" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={[styles.compIconBtn, isPending && { opacity: 0.5 }]} disabled={isPending}>
            <MaterialIcons name="keyboard-voice" size={20} color="#64748b" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={isPending ? "Đang phân tích… nhấn ⏸ để dừng" : "Đặt câu hỏi về sức khỏe hoặc sản phẩm..."}
            placeholderTextColor="#8aa0a6"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => !isPending && onSend()}
            editable={!isPending}
            returnKeyType="send"
          />
          {isPending ? (
            <TouchableOpacity onPress={() => abortRef.current?.abort()} style={[styles.sendBtn, styles.stopBtn]} activeOpacity={0.9}>
              <MaterialIcons name="pause" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => onSend()} style={styles.sendBtn} activeOpacity={0.9}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* INFO: Health Score */}
      <Modal visible={showHealthInfo} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowHealthInfo(false)}>
          <View style={styles.centerWrap}>
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <MaterialIcons name="monitor-heart" size={18} color={COLOR.green} />
                <Text style={styles.infoTitle}>Điểm sức khỏe (cá nhân hoá)</Text>
                <TouchableOpacity onPress={() => setShowHealthInfo(false)}><MaterialIcons name="close" size={18} color="#111827" /></TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                <Markdown style={mdStyles}>{HEALTH_INFO_MD}</Markdown>
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* INFO: Nutri-Score */}
      <Modal visible={showNutriInfo} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowNutriInfo(false)}>
          <View style={styles.centerWrap}>
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <MaterialIcons name="science" size={18} color={COLOR.green} />
                <Text style={styles.infoTitle}>Nutri-Score (tham khảo)</Text>
                <TouchableOpacity onPress={() => setShowNutriInfo(false)}><MaterialIcons name="close" size={18} color="#111827" /></TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                <Markdown style={mdStyles}>{NUTRI_INFO_MD}</Markdown>
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR.bg },

  /* modal common */
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.16)' },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12 },
  infoCard: {
    width: '92%',
    maxWidth: 760,
    maxHeight: '80%',
    backgroundColor: COLOR.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLOR.border,
    elevation: 20,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  infoTitle: { color: '#0f172a', fontWeight: '800' },

  /* menu */
  menuOverlay: { flex: 1 },
  menu: {
    position: 'absolute', top: 70, right: 12, backgroundColor: COLOR.white, width: 240,
    borderRadius: 12, borderWidth: 1, borderColor: COLOR.border, paddingVertical: 8,
    elevation: 24, zIndex: 9999, shadowColor: '#000', shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  menuText: { color: '#111827', fontWeight: '600' },

  /* welcome & faq */
  welcomeCard: { backgroundColor: COLOR.header, borderRadius: 10, marginHorizontal: 12, marginTop: 10, padding: 14, borderWidth: 1, borderColor: COLOR.border },
  welcomeSub: { marginTop: 6, color: COLOR.textMuted, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLOR.white, borderWidth: 1, borderColor: COLOR.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { color: COLOR.green, fontWeight: '700' },

  faqWrapCard: { backgroundColor: COLOR.white, borderRadius: 10, margin: 12, borderWidth: 1, borderColor: COLOR.border },
  faqHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  faqHideBtn: { marginLeft: 'auto', padding: 4 },
  faqHeader: { fontWeight: '800', color: '#1e293b' },
  faqRow: { paddingHorizontal: 10, paddingVertical: 12, gap: 10 },
  faqPulse: { borderBottomWidth: 2, borderBottomColor: COLOR.green },
  faqCard: { backgroundColor: COLOR.grayCard, borderRadius: 12, borderWidth: 1, borderColor: COLOR.border, justifyContent: 'space-between', marginRight: 10 },
  faqTag: { color: COLOR.tagGreen, fontWeight: '900', marginBottom: 6 },
  faqQuestion: { color: '#1f2937', fontWeight: '600' },

  /* chat */
  chat: { flex: 1, paddingHorizontal: 12 },
  msgRow: { flexDirection: 'row', gap: 8, marginVertical: 6, alignItems: 'flex-end', width: '100%' },
  msgRowRight: { flexDirection: 'row-reverse', alignItems: 'flex-end', justifyContent: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#c6f0d9', justifyContent: 'center', alignItems: 'center' },
  bubble: { maxWidth: '84%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  bubbleBot: { backgroundColor: COLOR.white, borderColor: COLOR.border },
  bubbleUser: { backgroundColor: '#eaf6ef', borderColor: COLOR.border, alignSelf: 'flex-end' },
  textUser: { color: '#0f172a', fontWeight: '600', textAlign: 'right' },
  tsText: { color: '#7c8f84', fontSize: 12, marginLeft: 50, marginTop: 4 },

  /* tools & composer */
  toolChipsRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  toolChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0faf4', borderWidth: 1, borderColor: '#d3ecd9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  toolChipText: { color: COLOR.green, fontWeight: '700' },

  composer: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8, borderTopWidth: 1, borderColor: COLOR.border, backgroundColor: COLOR.white },
  compIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLOR.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLOR.border },
  input: { flex: 1, borderWidth: 1, borderColor: COLOR.border, borderRadius: 22, paddingHorizontal: 14, color: '#000', backgroundColor: COLOR.white, height: 40 },
  sendBtn: { paddingHorizontal: 14, height: 40, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLOR.green },
  stopBtn: { backgroundColor: '#ef4444' },

  /* history */
  historyCard: { position: 'absolute', top: 100, left: 12, right: 12, backgroundColor: COLOR.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLOR.border, elevation: 16 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  historyTitle: { color: '#0f172a', fontWeight: '800' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLOR.border, padding: 10, borderRadius: 10, marginBottom: 8 },

  /* toolbar */
  toolbarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  toolbarSide: { width: 42, alignItems: 'flex-start' },
  toolbarCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  toolbarBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLOR.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLOR.border },
  toolbarTitle: { fontSize: 25, fontWeight: '800', color: COLOR.green, textAlign: 'center' },
});

const mdStyles = {
  body: { color: '#111827', lineHeight: 20 },
  strong: { fontWeight: '800', color: '#0f172a' },
  em: { fontStyle: 'italic' },
  bullet_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  blockquote: { borderLeftWidth: 3, borderLeftColor: '#c8ebd3', paddingLeft: 10, color: '#0f172a', backgroundColor: '#f7fbf8' },
  code_block: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  code_inline: { backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  table: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden', marginVertical: 6, minWidth: 280 },
  thead: { backgroundColor: '#eef7f2' },
  th: { backgroundColor: '#eef7f2', padding: 8, borderRightWidth: 1, borderColor: '#e5e7eb', fontWeight: '800' },
  tr: { borderBottomWidth: 1, borderColor: '#e5e7eb' },
  td: { padding: 8, borderRightWidth: 1, borderColor: '#e5e7eb' },
};
