// app/services/ProfileService.js
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_BASE =
  (Constants?.expoConfig?.extra && Constants.expoConfig.extra.API_BASE) ||
  (Constants?.manifest2?.extra && Constants.manifest2.extra.API_BASE) ||
  'http://127.0.0.1:8888';

const KEYS = {
  draft: 'healthscan.profile_draft',
  id: 'healthscan.profile_id',
};

// tiny storage wrapper (web: localStorage, native: AsyncStorage if available)
const storage = {
  async getItem(k) {
    if (Platform.OS === 'web') return localStorage.getItem(k);
    try {
      const { default: AS } = await import('@react-native-async-storage/async-storage');
      return AS.getItem(k);
    } catch {
      return null;
    }
  },
  async setItem(k, v) {
    if (Platform.OS === 'web') return localStorage.setItem(k, v);
    try {
      const { default: AS } = await import('@react-native-async-storage/async-storage');
      return AS.setItem(k, v);
    } catch {}
  },
  async removeItem(k) {
    if (Platform.OS === 'web') return localStorage.removeItem(k);
    try {
      const { default: AS } = await import('@react-native-async-storage/async-storage');
      return AS.removeItem(k);
    } catch {}
  },
};

function deepMerge(a = {}, b = {}) {
  const out = { ...a };
  for (const k of Object.keys(b)) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) {
      out[k] = deepMerge(a[k], b[k]);
    } else {
      out[k] = b[k];
    }
  }
  return out;
}

export const ProfileService = {
  async loadDraft() {
    const raw = await storage.getItem(KEYS.draft);
    try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  },
  async saveDraft(partial) {
    const cur = await this.loadDraft();
    const next = deepMerge(cur, partial);
    await storage.setItem(KEYS.draft, JSON.stringify(next));
    return next;
  },
  async clearDraft() {
    await storage.removeItem(KEYS.draft);
  },
  async getProfileId() {
    return (await storage.getItem(KEYS.id)) || null;
  },
  async setProfileId(id) {
    await storage.setItem(KEYS.id, id);
  },
  // Ghi file .json trên server
  async persistToServer() {
    const draft = await this.loadDraft();
    const profile_id = await this.getProfileId();
    const resp = await fetch(`${API_BASE}/profile/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ profile: draft, profile_id }),
    });
    const data = await resp.json();
    if (!resp.ok || data?.ok === false) throw new Error(data?.error || `HTTP ${resp.status}`);
    await this.setProfileId(data.profile_id);
    return data.profile;
  },
  // Đọc lại từ server để hiển thị
  async fetchProfile() {
    const id = await this.getProfileId();
    if (!id) return null;
    const resp = await fetch(`${API_BASE}/profile/${id}`);
    const data = await resp.json();
    if (!resp.ok || data?.ok === false) throw new Error(data?.error || `HTTP ${resp.status}`);
    return data.profile;
  },

  // ====== Các thông số suy luận để hiển thị ======
  computeDerived(p) {
    if (!p) return {};
    const basic = p.basic || {};
    const w = Number(basic.weight_kg), h = Number(basic.height_cm), age = Number(basic.age);
    const sex = (basic.sex || 'male').toLowerCase();
    const bmi = w && h ? +(w / Math.pow(h / 100, 2)).toFixed(1) : null;
    let bmr = null;
    if (w && h && age) {
      bmr = sex === 'female'
        ? 10 * w + 6.25 * h - 5 * age - 161
        : 10 * w + 6.25 * h - 5 * age + 5;
      bmr = Math.round(bmr);
    }
    const act = (basic.activity_level || 'moderate').toLowerCase();
    const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725, athlete: 1.9 };
    const tdee = bmr ? Math.round(bmr * (factors[act] || 1.55)) : null;

    let bmi_cat = null;
    if (bmi != null) {
      bmi_cat = bmi < 18.5 ? 'Thiếu cân' : bmi < 23 ? 'Bình thường' : bmi < 25 ? 'Thừa cân' : 'Béo phì';
    }
    return { bmi, bmi_cat, bmr, tdee };
  },
};

export default ProfileService;
