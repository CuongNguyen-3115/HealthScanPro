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
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../lib/profileStorage';
import Markdown from 'react-native-markdown-display';

/* ====== NEW: Audio recording & file system ====== */
import { AudioRecorder } from 'expo-audio';

/* ====== API base ====== */
function resolveApiBase() {
  let base = 'http://127.0.0.1:8888';
  try {
    const Constants = require('expo-constants').default;
    const extra = Constants?.expoConfig?.extra ?? Constants?.manifestExtra;
    if (extra?.API_BASE) base = String(extra.API_BASE);
  } catch {}
  const fromGlobal =
    (globalThis && (globalThis.EXPO_PUBLIC_API_BASE || globalThis.API_BASE)) ||
    '';
  if (fromGlobal) base = String(fromGlobal);
  if (Platform.OS === 'android') {
    if (base.includes('localhost') || base.includes('127.0.0.1')) {
      base = base
        .replace('localhost', '10.0.2.2')
        .replace('127.0.0.1', '10.0.2.2');
    }
  }
  return base.replace(/\/$/, '');
}
const BACKEND = resolveApiBase();

/* ====== NEW: ASR endpoint (ngrok) ====== */
const ASR_ENDPOINT = `${BACKEND}/asr`;

/* ====== THEME ====== */
const COLOR = {
  bg: '#ffffff',           // White background
  header: '#22C55E',       // Green header
  white: '#ffffff',
  grayCard: '#f8fafc',     // Light gray cards
  border: '#e5e7eb',       // Light borders
  green: '#22C55E',         // Green theme
  text: '#1f2937',         // Dark text
  textMuted: '#6b7280',     // Muted text
  tagGreen: '#22C55E',      // Tag green
  inputBg: '#ffffff',       // White input background
  sidebarBg: '#f8fafc',     // Light sidebar background
  messageBg: '#f0fdf4',     // Light green bot message background
  userBg: '#22C55E',        // Green user message background
  headerText: '#ffffff',    // White text on header
};


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
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
async function saveSessions(sessions) {
  try {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {}
}
function titleFromMessages(msgs) {
  const first = msgs.find(m => m.role === 'user');
  if (!first) return 'Cuộc trò chuyện';
  const t = first.text.trim().replace(/\s+/g, ' ');
  return t.length > 50 ? t.slice(0, 50) + '…' : t;
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

/* ====== Markdown giải thích ====== */
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
`;

/* ====== Parse “Sản phẩm thay thế” (server trả Markdown có ảnh) ====== */
const IMG_RE = /!\[[^\]]*\]\(([^)]+)\)/i;
const IMG_LINE_RE = /^\s*!\[[^\]]*\]\(([^)]+)\)\s*$/i; // cả dòng là ảnh
const ITEM_START_RE = /^\s*(\d+)\.\s*\*\*(.+?)\*\*\s*—\s*([^\n]+?)\s*$/i;

function stripImageLines(md = '') {
  return md
    .split('\n')
    .filter(line => !IMG_LINE_RE.test(line) && !/\<img[\s\S]*src=/i.test(line))
    .join('\n');
}

function parseRecoMarkdown(md = '') {
  const lines = md.split('\n');
  const items = [];
  let cur = null;

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const m = ln.match(ITEM_START_RE);
    if (m) {
      if (cur) items.push(cur);
      cur = {
        idx: parseInt(m[1], 10),
        title: m[2].trim(),
        brand: m[3].replace(/\(.*?\)/g, '').trim(),
        details: [],
        image: null,
        health_score: null,
        health_level: null,
        nutri_grade: null,
        nutri_points: null,
        sugars_g: null,
        sodium_mg: null,
        satfat_g: null,
        protein_g: null,
        kcal: null,
      };
      continue;
    }
    if (!cur) continue;

    const img = ln.match(IMG_RE);
    if (img && !cur.image) {
      cur.image = img[1];
      continue;
    }
    cur.details.push(ln);
  }
  if (cur) items.push(cur);

  // Rút thông tin từ details
  items.forEach(it => {
    const block = it.details.join('\n');

    const hs = block.match(
      /Điểm sức khỏe.*?\*\*([\d.]+)\s*\/\s*[\d.]+\*\*\s*—\s*([^\n]+)/i
    );
    if (hs) {
      it.health_score = parseFloat(hs[1]);
      it.health_level = hs[2].trim();
    }

    const ns = block.match(/Nutri-Score.*?:\s*([A-E])\s*\(điểm\s*([-\d]+)\)/i);
    if (ns) {
      it.nutri_grade = ns[1];
      it.nutri_points = parseInt(ns[2], 10);
    }

    const n = block.match(/Dinh dưỡng\/100g:([^\n]+)/i);
    if (n) {
      const s = n[1];
      const mSug = s.match(/đường\s+([0-9.,-]+)/i);
      if (mSug) it.sugars_g = parseFloat(String(mSug[1]).replace(',', '.'));
      const mNa = s.match(/natri\s+([0-9.,-]+)/i);
      if (mNa)
        it.sodium_mg = parseInt(String(mNa[1]).replace(/[^\d-]/g, ''), 10);
      const mSat = s.match(/bão hoà\s+([0-9.,-]+)/i);
      if (mSat) it.satfat_g = parseFloat(String(mSat[1]).replace(',', '.'));
      const mPro = s.match(/protein\s+([0-9.,-]+)/i);
      if (mPro) it.protein_g = parseFloat(String(mPro[1]).replace(',', '.'));
      const mKcal = s.match(/([0-9]+)\s*kcal/i);
      if (mKcal) it.kcal = parseInt(mKcal[1], 10);
    }
  });

  return items;
}

function isRecoMessage(md = '') {
  return /sản phẩm thay thế/i.test(md) && /\d+\.\s+\*\*/.test(md);
}

/* ====== Markdown rules (ảnh full-width cho các case khác) ====== */
const mdRules = {
  image: node => {
    const src = node.attributes?.src || '';
    if (!src) return null;
    return (
      <Image
        key={node.key}
        source={{ uri: src }}
        style={{
          width: '100%',
          height: 180,
          marginTop: 8,
          borderRadius: 12,
          resizeMode: 'contain',
          backgroundColor: '#f5f5f5',
        }}
        accessible
        accessibilityLabel={node.attributes?.alt || 'image'}
      />
    );
  },
};

/* ====== Audio helpers ====== */
const msToClock = ms => {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

/* ====== Component ====== */
export default function ChatbotScreen() {
  const router = useRouter();

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Xin chào! Tôi là HealthScan AI — trợ lý sức khỏe thông minh của bạn. Hãy chụp ảnh thành phần hoặc đặt câu hỏi nhé! 🥬',
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Gallery modal
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryProducts, setGalleryProducts] = useState([]);

  // Recording state
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const recordStartRef = useRef(0);
  const recTimerRef = useRef(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Load profile, last label, sessions
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
      const ss = await loadSessions();
      setSessions(ss);
    })();
  }, []);

  // Persist session
  const persistSession = async msgs => {
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
      nextSessions = [
        { id, messages: msgs, updatedAt, title: titleFromMessages(msgs) },
        ...sessions,
      ];
    }
    setSessions(nextSessions);
    await saveSessions(nextSessions);
  };

  // New chat
  const newChat = async () => {
    chatIdRef.current = `chat-${Date.now()}`;
    setMessages([
      {
        role: 'bot',
        text: 'Bắt đầu cuộc trò chuyện mới. Bạn muốn hỏi gì về sản phẩm hoặc sức khỏe? 😊',
        ts: new Date(),
      },
    ]);
  };

  const onSend = async textOverride => {
    if (isPending) return;
    const t = (textOverride ?? input).trim();
    if (!t) return;

    const now = new Date();
    const nextUserMsgs = [...messages, { role: 'user', text: t, ts: now }];
    setMessages(nextUserMsgs);
    setInput('');
    chatRef.current?.scrollToEnd({ animated: true });

    const typing = {
      role: 'bot',
      text: 'Đang phân tích...',
      ts: new Date(),
      _typing: true,
    };
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
        const errMsgs = [
          ...nextUserMsgs,
          { role: 'bot', text: formatBackendError(data.error), ts: new Date() },
        ];
        setMessages(errMsgs);
        await persistSession(errMsgs);
        return;
      }

      // --- Tối ưu hiển thị đề xuất: tách ảnh sang gallery & gắn nút từng sản phẩm ---
      const raw = data.reply_markdown || '...';
      const isReco = isRecoMessage(raw);
      const products = isReco ? parseRecoMarkdown(raw) : [];
      const cleaned = isReco ? stripImageLines(raw) : raw;

      const botMsgs = [
        ...nextUserMsgs,
        {
          role: 'bot',
          text: cleaned,
          ts: new Date(),
          isReco,
          products, // [{title, brand, image, health_score, ...}]
        },
      ];

      setMessages(botMsgs);
      await persistSession(botMsgs);
    } catch (e) {
      setMessages(prev => prev.filter(m => !m._typing));
      if (e?.name === 'AbortError') {
        const stopMsgs = [
          ...nextUserMsgs,
          { role: 'bot', text: '⏹️ Đã dừng phân tích theo yêu cầu.', ts: new Date() },
        ];
        setMessages(stopMsgs);
        await persistSession(stopMsgs);
      } else {
        const errMsgs = [
          ...nextUserMsgs,
          { role: 'bot', text: `Mạng lỗi: ${String(e)}`, ts: new Date() },
        ];
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
  const requestRecommend = () => {
    if (!isPending) onSend('Sản phẩm thay thế');
  };

  const addQuick = q => {
    if (!isPending) onSend(q);
  };

  const openGallery = (prods = []) => {
    setGalleryProducts(prods.filter(p => !!p.image));
    setGalleryOpen(true);
  };

  const renderInlinePhotoRows = msg => {
    if (!msg?.isReco || !(msg?.products?.length)) return null;
    return (
      <View style={styles.inlineRecoWrap}>
        {/* Nút xem tất cả ảnh (nếu có từ 1 ảnh trở lên) */}
        {msg.products.some(p => !!p.image) && (
          <TouchableOpacity
            style={styles.inlineAllBtn}
            onPress={() => openGallery(msg.products)}
          >
            <MaterialIcons name="photo-library" size={16} color={COLOR.green} />
            <Text style={styles.inlineAllBtnText}>
              Xem ảnh minh họa ({msg.products.filter(p => !!p.image).length})
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderBotTools = (msg, isLast) => {
    return null;
  };

  /* ===== Recording controls ===== */
  const startRecording = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Không hỗ trợ',
        'Ghi âm bằng Expo Audio chưa được bật cho bản web. Bạn hãy dùng ứng dụng trên Android/iOS.'
      );
      return;
    }

    try {
      const permission = await AudioRecorder.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Cần quyền micro', 'Hãy cấp quyền để sử dụng nói chuyện.');
        return;
      }

      const recording = new AudioRecorder();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: 'mpeg4',
          audioEncoder: 'aac',
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: 'mpeg4aac',
          audioQuality: 'high',
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      
      await recording.startAsync();

      recordStartRef.current = Date.now();
      setRecordMs(0);
      recTimerRef.current && clearInterval(recTimerRef.current);
      recTimerRef.current = setInterval(() => {
        setRecordMs(Date.now() - recordStartRef.current);
      }, 200);

      setRecording(recording);
      setIsRecording(true);
    } catch (e) {
      Alert.alert('Lỗi ghi âm', String(e?.message || e));
    }
  };

  const stopRecording = async (autoSend = true) => {
    try {
      if (!recording) return null;
      await recording.stopAsync();
      const uri = recording.getURI();
      recTimerRef.current && clearInterval(recTimerRef.current);
      setIsRecording(false);
      setRecording(null);

      if (autoSend && uri) {
        await transcribeAndSend(uri);
      }
      return uri;
    } catch (e) {
      Alert.alert('Lỗi dừng ghi', String(e?.message || e));
      return null;
    }
  };

  const handleMicPress = async () => {
    if (isTranscribing) return;
    if (!isRecording) {
      await startRecording();
    } else {
      await stopRecording(true);
    }
  };

  const transcribeAndSend = async audioUri => {
    setIsTranscribing(true);
    try {
      const form = new FormData();
      // Đuôi mặc định của HIGH_QUALITY là m4a (iOS) hoặc m4a/aac (Android)
      form.append('file', {
        uri: audioUri,
        name: `audio-${Date.now()}.m4a`,
        type: 'audio/m4a',
      });

      // KHÔNG set 'Content-Type' để RN tự thêm boundary
      const resp = await fetch(ASR_ENDPOINT, {
        method: 'POST',
        body: form,
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`ASR HTTP ${resp.status}: ${txt}`);
      }

      let text = '';
      // thử parse json; nếu fail thì lấy text thuần
      try {
        const js = await resp.json();
        text = js.text || js.transcript || js.result || '';
      } catch {
        text = (await resp.text()) || '';
      }

      text = String(text || '').trim();
      if (!text) {
        Alert.alert(
          'Không nhận được nội dung',
          'Hãy thử nói rõ hơn hoặc kiểm tra micro.'
        );
        return;
      }
      // Gửi nội dung transcribe như một tin nhắn
      await onSend(text);
    } catch (e) {
      Alert.alert('ASR lỗi', String(e?.message || e));
    } finally {
      setIsTranscribing(false);
    }
  };

  /* ====== UI ====== */
  const renderRecordingBar = () => {
    if (!isRecording) return null;
    return (
      <View style={styles.recBar}>
        <MaterialIcons name="fiber-manual-record" size={14} color="#ef4444" />
        <Text style={styles.recBarText}>Đang ghi • {msToClock(recordMs)}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
          <TouchableOpacity style={styles.recBtn} onPress={() => stopRecording(true)}>
            <Text style={styles.recBtnText}>Dừng & gửi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const openSession = s => {
    chatIdRef.current = s.id;
    setMessages(reviveMsgDates(s.messages || []));
    setShowHistory(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* MENU */}
      <Modal visible={menuOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Chức năng</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
                <MaterialIcons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                setMenuOpen(false);
                await newChat();
              }}
            >
              <MaterialIcons name="chat" size={20} color={COLOR.green} />
              <Text style={styles.menuText}>Cuộc chat mới</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                setShowHistory(true);
              }}
            >
              <MaterialIcons name="history" size={20} color={COLOR.green} />
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
              <MaterialIcons name="refresh" size={20} color={COLOR.green} />
              <Text style={styles.menuText}>Tải lại hồ sơ & nhãn</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push('HomeScreen')}
          accessibilityLabel="Quay lại"
        >
          <MaterialIcons name="arrow-back" size={24} color={COLOR.headerText} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>HealthScan</Text>
          <Text style={styles.headerSubtitle}>Trợ lý sức khỏe thông minh</Text>
        </View>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuOpen(true)}
          accessibilityLabel="Mở menu"
        >
          <MaterialIcons name="more-vert" size={24} color={COLOR.headerText} />
        </TouchableOpacity>
      </View>


      {/* CHAT */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={chatRef}
          style={styles.chat}
          contentContainerStyle={{ paddingVertical: 10 }}
          onContentSizeChange={() =>
            chatRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((m, i) => {
            const isLastBot = m.role === 'bot' && i === messages.length - 1;
            return (
              <View
                key={i}
                style={[
                  styles.msgRow,
                  m.role === 'user' && styles.msgRowRight,
                ]}
              >
                {m.role === 'bot' && (
                  <View style={styles.avatar}>
                    <MaterialIcons name="psychology" size={20} color={COLOR.green} />
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    m.role === 'user' ? styles.bubbleUser : styles.bubbleBot,
                  ]}
                >
                  {m.role === 'user' ? (
                    <Text style={styles.textUser}>{m.text}</Text>
                  ) : looksLikeTable(m.text) ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Markdown style={mdStyles} rules={mdRules}>
                        {m.text}
                      </Markdown>
                    </ScrollView>
                  ) : (
                    <Markdown style={mdStyles} rules={mdRules}>
                      {m.text}
                    </Markdown>
                  )}

                  {/* Hàng nút "Ảnh" cho từng sản phẩm thay thế */}
                  {renderInlinePhotoRows(m)}

                  {/* Tool chips */}
                  {renderBotTools(m, isLastBot)}
                </View>
                {m.role === 'user' && (
                  <View style={styles.userAvatar}>
                    <MaterialIcons name="person" size={20} color="#fff" />
                  </View>
                )}
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
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }).format(d)}
              </Text>
            );
          })()}
        </ScrollView>

        {/* Recording bar */}
        {renderRecordingBar()}

        {/* Bottom Action Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.bottomBtn, isPending && { opacity: 0.5 }]}
            onPress={() => addQuick('Xem thành phần')}
            disabled={isPending}
          >
            <MaterialIcons name="inventory" size={20} color={COLOR.green} />
            <Text style={styles.bottomBtnText}>Xem thành phần</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomBtn, isPending && { opacity: 0.5 }]}
            onPress={requestRecommend}
            disabled={isPending}
          >
            <MaterialIcons name="recommend" size={20} color={COLOR.green} />
            <Text style={styles.bottomBtnText}>Sản phẩm thay thế</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomBtn, isPending && { opacity: 0.5 }]}
            onPress={() => setShowHealthInfo(true)}
            disabled={isPending}
          >
            <MaterialIcons name="monitor-heart" size={20} color={COLOR.green} />
            <Text style={styles.bottomBtnText}>Điểm sức khỏe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomBtn, isPending && { opacity: 0.5 }]}
            onPress={() => setShowNutriInfo(true)}
            disabled={isPending}
          >
            <MaterialIcons name="science" size={20} color={COLOR.green} />
            <Text style={styles.bottomBtnText}>Nutri-Score</Text>
          </TouchableOpacity>
        </View>

        {/* Composer */}
        <View style={styles.composer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={
                isPending
                  ? 'Đang phân tích… nhấn ⏸ để dừng'
                  : 'Nhập tin nhắn...'
              }
              placeholderTextColor="#9ca3af"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => !isPending && onSend()}
              editable={!isPending}
              returnKeyType="send"
              multiline
              maxLength={500}
            />
            {input.length > 0 && (
              <Text style={styles.charCount}>{input.length}/500</Text>
            )}
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleMicPress}
              style={[
                styles.actionBtn,
                (isPending || isTranscribing) && { opacity: 0.5 },
                isRecording && { 
                  backgroundColor: '#ef4444',
                },
              ]}
              disabled={isPending || isTranscribing}
            >
              {isTranscribing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons
                  name={isRecording ? 'stop' : 'keyboard-voice'}
                  size={20}
                  color={isRecording ? '#fff' : '#6b7280'}
                />
              )}
            </TouchableOpacity>
            
            {isPending ? (
              <TouchableOpacity
                onPress={() => abortRef.current?.abort()}
                style={[styles.sendBtn, styles.stopBtn]}
                activeOpacity={0.9}
              >
                <MaterialIcons name="pause" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => onSend()}
                style={[
                  styles.sendBtn,
                  !input.trim() && styles.sendBtnDisabled
                ]}
                activeOpacity={0.9}
                disabled={!input.trim()}
              >
                <MaterialIcons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* INFO: Health Score */}
      <Modal visible={showHealthInfo} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setShowHealthInfo(false)}
        >
          <View style={styles.centerWrap}>
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <MaterialIcons
                  name="monitor-heart"
                  size={18}
                  color={COLOR.green}
                />
                <Text style={styles.infoTitle}>Điểm sức khỏe (cá nhân hoá)</Text>
                <TouchableOpacity onPress={() => setShowHealthInfo(false)}>
                  <MaterialIcons name="close" size={18} color="#111827" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                <Markdown style={mdStyles} rules={mdRules}>
                  {HEALTH_INFO_MD}
                </Markdown>
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* INFO: Nutri-Score */}
      <Modal visible={showNutriInfo} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setShowNutriInfo(false)}
        >
          <View style={styles.centerWrap}>
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <MaterialIcons name="science" size={18} color={COLOR.green} />
                <Text style={styles.infoTitle}>Nutri-Score (tham khảo)</Text>
                <TouchableOpacity onPress={() => setShowNutriInfo(false)}>
                  <MaterialIcons name="close" size={18} color="#111827" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                <Markdown style={mdStyles} rules={mdRules}>
                  {NUTRI_INFO_MD}
                </Markdown>
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GALLERY: ảnh minh hoạ sản phẩm thay thế */}
      <Modal visible={galleryOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setGalleryOpen(false)}
        >
          <View style={styles.centerWrap}>
            <View style={styles.galleryCard}>
              <View style={styles.galleryHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="photo-library" size={18} color={COLOR.green} />
                  <Text style={styles.galleryTitle}>Ảnh minh họa sản phẩm thay thế</Text>
                </View>
                <TouchableOpacity onPress={() => setGalleryOpen(false)}>
                  <MaterialIcons name="close" size={18} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 6 }}
              >
                {galleryProducts.map((p, idx) => (
                  <View key={idx} style={styles.prodCard}>
                    <View style={styles.prodImageWrap}>
                      {p.image ? (
                        <Image source={{ uri: p.image }} style={styles.prodImage} />
                      ) : (
                        <View
                          style={[
                            styles.prodImage,
                            { justifyContent: 'center', alignItems: 'center' },
                          ]}
                        >
                          <MaterialIcons
                            name="image-not-supported"
                            size={36}
                            color="#94a3b8"
                          />
                        </View>
                      )}
                      <View style={styles.prodBadge}>
                        <Text style={styles.prodBadgeText}>
                          {idx + 1}/{galleryProducts.length}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.prodTitle} numberOfLines={2}>
                      {p.title || 'Sản phẩm'}
                    </Text>
                    <Text style={styles.prodBrand} numberOfLines={1}>
                      {p.brand || '—'}
                    </Text>

                    <View style={styles.chipsRow}>
                      {p.health_score != null && (
                        <View style={styles.chip}>
                          <MaterialIcons
                            name="monitor-heart"
                            size={14}
                            color={COLOR.green}
                          />
                          <Text style={styles.chipText}>
                            {p.health_score}/8 • {p.health_level || ''}
                          </Text>
                        </View>
                      )}
                      {p.nutri_grade && (
                        <View style={styles.chip}>
                          <MaterialIcons name="science" size={14} color={COLOR.green} />
                          <Text style={styles.chipText}>
                            Nutri-Score {p.nutri_grade}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.kvRow}>
                      {p.sugars_g != null && (
                        <Text style={styles.kvItem}>Đường {p.sugars_g} g</Text>
                      )}
                      {p.sodium_mg != null && (
                        <Text style={styles.kvItem}>Natri {p.sodium_mg} mg</Text>
                      )}
                      {p.protein_g != null && (
                        <Text style={styles.kvItem}>Protein {p.protein_g} g</Text>
                      )}
                      {p.kcal != null && (
                        <Text style={styles.kvItem}>{p.kcal} kcal</Text>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* HISTORY */}
      <Modal visible={showHistory} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setShowHistory(false)}
        >
          <View style={styles.centerWrap}>
            <View style={styles.infoCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Lịch sử chat</Text>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <MaterialIcons name="close" size={18} color="#111827" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 420 }}>
                {sessions.length === 0 && (
                  <Text style={{ color: '#475569' }}>
                    Chưa có cuộc trò chuyện nào.
                  </Text>
                )}
                {sessions.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.sessionRow}
                    onPress={() => openSession(s)}
                  >
                    <MaterialIcons
                      name="chat-bubble-outline"
                      size={18}
                      color={COLOR.green}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: '#0f172a' }}>
                        {s.title || 'Cuộc trò chuyện'}
                      </Text>
                      <Text style={{ color: '#64748b', fontSize: 12 }}>
                        {new Date(s.updatedAt).toLocaleString('vi-VN')}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                ))}
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
  menu: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: COLOR.white,
    width: 240,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR.border,
    paddingVertical: 8,
    elevation: 24,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
    marginBottom: 4,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR.text,
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  menuText: { 
    color: COLOR.text, 
    fontWeight: '500',
    fontSize: 15,
  },

  /* header */
  header: { 
    backgroundColor: COLOR.header, 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: COLOR.headerText, 
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLOR.headerText,
    fontWeight: '400',
    opacity: 0.8,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  /* chat */
  chat: { flex: 1, paddingHorizontal: 0, backgroundColor: COLOR.bg },
  msgRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginVertical: 8, 
    alignItems: 'flex-start', 
    width: '100%',
    paddingHorizontal: 20,
  },
  msgRowRight: { 
    flexDirection: 'row-reverse', 
    alignItems: 'flex-start', 
    justifyContent: 'flex-start' 
  },
  avatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#f0fdf4', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: { 
    maxWidth: '80%', 
    borderRadius: 18, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderWidth: 0,
  },
  bubbleBot: { 
    backgroundColor: COLOR.messageBg,
  },
  bubbleUser: { 
    backgroundColor: COLOR.userBg, 
    alignSelf: 'flex-end' 
  },
  textUser: { 
    color: '#ffffff', 
    fontWeight: '500', 
    textAlign: 'right',
    lineHeight: 20,
  },
  tsText: { 
    color: COLOR.textMuted, 
    fontSize: 11, 
    marginLeft: 60, 
    marginTop: 4,
    fontWeight: '400',
  },

  /* inline photo row for reco items */
  inlineRecoWrap: { marginTop: 8, gap: 6 },
  inlineAllBtn: { alignSelf: 'flex-start', marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eef9f0', borderWidth: 1, borderColor: '#cdeed6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  inlineAllBtnText: { color: COLOR.green, fontWeight: '800', fontSize: 12 },

  /* tools & composer */
  toolChipsRow: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 12, 
    flexWrap: 'wrap' 
  },
  toolChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#f0fdf4', 
    borderWidth: 1, 
    borderColor: '#bbf7d0', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toolChipText: { 
    color: COLOR.green, 
    fontWeight: '700',
    fontSize: 12,
  },

  /* bottom buttons */
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLOR.bg,
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
    justifyContent: 'space-around',
  },
  bottomBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLOR.border,
  },
  bottomBtnText: {
    color: COLOR.green,
    fontWeight: '600',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },

  composer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end',
    padding: 16, 
    backgroundColor: COLOR.bg,
    borderTopWidth: 1, 
    borderTopColor: COLOR.border,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  input: { 
    borderWidth: 1, 
    borderColor: COLOR.border, 
    borderRadius: 24, 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    color: COLOR.text, 
    backgroundColor: COLOR.inputBg, 
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16,
    lineHeight: 20,
  },
  charCount: {
    position: 'absolute',
    bottom: -20,
    right: 0,
    fontSize: 11,
    color: COLOR.textMuted,
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLOR.grayCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLOR.border,
  },
  sendBtn: { 
    paddingHorizontal: 16, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: COLOR.green,
  },
  sendBtnDisabled: {
    backgroundColor: COLOR.textMuted,
    opacity: 0.6,
  },
  stopBtn: { 
    backgroundColor: '#ef4444' 
  },

  /* recording bar */
  recBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: COLOR.border,
    backgroundColor: '#fff1f2',
  },
  recBarText: { color: '#0f172a', fontWeight: '700' },
  recBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#ef4444', borderRadius: 8 },
  recBtnText: { color: '#fff', fontWeight: '700' },

  /* history */
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  historyTitle: { color: '#0f172a', fontWeight: '800' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLOR.border, padding: 10, borderRadius: 10, marginBottom: 8 },

  /* toolbar */
  toolbarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  toolbarSide: { width: 42, alignItems: 'flex-start' },
  toolbarCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  toolbarBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLOR.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLOR.border },

  /* gallery modal */
  galleryCard: {
    width: '96%',
    maxWidth: 820,
    maxHeight: '82%',
    backgroundColor: COLOR.white,
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLOR.border,
    elevation: 20,
  },
  galleryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 4 },
  galleryTitle: { color: '#0f172a', fontWeight: '800' },

  prodCard: { width: 280, marginHorizontal: 6, borderWidth: 1, borderColor: COLOR.border, borderRadius: 12, backgroundColor: '#fbfdfc', padding: 10 },
  prodImageWrap: { position: 'relative', width: '100%', height: 170, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f5f5f5' },
  prodImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  prodBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  prodBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  prodTitle: { marginTop: 8, color: '#0f172a', fontWeight: '800' },
  prodBrand: { color: '#475569', fontWeight: '600', marginTop: 2 },

  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eef9f0', borderWidth: 1, borderColor: '#cdeed6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  chipText: { color: COLOR.green, fontWeight: '700', fontSize: 12 },

  kvRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  kvItem: {
    color: '#0f172a',
    fontSize: 12,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});

const mdStyles = {
  body: { color: COLOR.text, lineHeight: 20 },
  strong: { fontWeight: '600', color: COLOR.text },
  em: { fontStyle: 'italic' },
  bullet_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  blockquote: { borderLeftWidth: 3, borderLeftColor: COLOR.green, paddingLeft: 10, color: COLOR.text, backgroundColor: COLOR.messageBg },
  code_block: {
    backgroundColor: COLOR.grayCard,
    borderRadius: 8,
    padding: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  code_inline: { backgroundColor: COLOR.grayCard, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  table: { borderWidth: 1, borderColor: COLOR.border, borderRadius: 6, overflow: 'hidden', marginVertical: 6, minWidth: 280 },
  thead: { backgroundColor: COLOR.messageBg },
  th: { backgroundColor: COLOR.messageBg, padding: 8, borderRightWidth: 1, borderColor: COLOR.border, fontWeight: '600' },
  tr: { borderBottomWidth: 1, borderColor: COLOR.border },
  td: { padding: 8, borderRightWidth: 1, borderColor: COLOR.border },
};

         