// Frontend/services/LabelAnalyzerService.js
import { Platform } from "react-native";

// Đổi IP này nếu chạy trên điện thoại thật: dùng IP LAN của máy bạn (vd 192.168.0.125)
// Với web (localhost:8081) dùng 127.0.0.1 là ổn.
const API_BASE =
  Platform.OS === "web" ? "http://127.0.0.1:8888" : "http://192.168.0.125:8888";

export async function analyzeFile(file) {
  const fd = new FormData();
  fd.append("file", file);            // Web: file là đối tượng File từ <input>

  const res = await fetch(`${API_BASE}/label/analyze`, {
    method: "POST",
    body: fd,                         // KHÔNG tự set Content-Type
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

// Dùng cho Expo ImagePicker (Android/iOS) — asset có dạng { uri, fileName?, mimeType? }
export async function analyzeAsset(asset) {
  const file = {
    uri: asset?.uri,
    name: asset?.fileName || (asset?.uri?.split("/")?.pop() || "image.jpg"),
    type: asset?.mimeType || asset?.type || "image/jpeg",
  };
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API_BASE}/label/analyze`, {
    method: "POST",
    body: fd,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export async function analyzeBase64(dataUrlOrBase64) {
  const res = await fetch(`${API_BASE}/label/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: dataUrlOrBase64 }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}
