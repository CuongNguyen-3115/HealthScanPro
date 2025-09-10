# -*- coding: utf-8 -*-
import os, io, re, json, base64, mimetypes, time, hashlib
from datetime import datetime
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
from dotenv import load_dotenv, find_dotenv
import google.generativeai as genai

# ==== Load env ====
load_dotenv(find_dotenv())
API_KEY = os.getenv("GEMINI_API_KEY")
PORT = int(os.getenv("PORT", "8888"))

# Paths: outputs + Data/*
BASE_DIR = Path(__file__).parent
OUT_DIR = Path(os.getenv("OUT_DIR", BASE_DIR / "outputs"))
OUT_DIR.mkdir(parents=True, exist_ok=True)
LABEL_CACHE_DIR = OUT_DIR / "label_cache"
LABEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)

DATA_DIR = BASE_DIR / "Data"
CATALOG_PATH = os.getenv("CATALOG_PATH", str(DATA_DIR / "health_catalog.json"))
STORES_PATH  = os.getenv("STORES_PATH",  str(DATA_DIR / "hanoi_stores.json"))

APP_VERSION = "2025-09-11-reco+personalized"

if not API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY in .env")

# ==== Gemini config ====
genai.configure(api_key=API_KEY)
VLM_MODEL = genai.GenerativeModel("gemini-1.5-flash")   # đọc nhãn từ ảnh
LLM_MODEL = genai.GenerativeModel("gemini-1.5-flash")   # tư vấn/llm tổng quát

app = Flask(__name__)

# ==== CORS (GET/POST/OPTIONS) ====
ALLOWED = [
    "http://localhost:8081", "http://127.0.0.1:8081",
    "http://localhost:19006", "http://127.0.0.1:19006",
    "http://localhost:19000", "http://127.0.0.1:19000",
    "http://localhost:3000",  "http://127.0.0.1:3000",
]
# Cho phép IP LAN của Expo dạng 192.168.x.x:port
CORS(app,
     resources={r"/*": {"origins": ALLOWED + [r"http://192\.168\.\d+\.\d+:\d+"]}},
     methods=["GET","POST","OPTIONS"],
     allow_headers=["Content-Type"])

# ==== Schema hint (đọc nhãn) ====
SCHEMA_HINT = """
Trả về JSON DUY NHẤT đúng schema:

{
  "language": "vi|en|...",
  "ingredients_raw": "nguyên văn thành phần đọc được",
  "ingredients": [
    {"name":"Bột mì","percentage":56,"is_allergen":true,"notes":"Gluten"},
    {"name":"Đường"},
    {"name":"Siro glucose"}
  ],
  "nutrition_facts": {
    "serving_size":"36.3 g",
    "servings_per_container":"2",
    "calories":"160 kcal",
    "nutrients":[
      {"name":"Fat","amount":"6","unit":"g","daily_value_percent":"?"},
      {"name":"Sodium","amount":"110","unit":"mg"},
      {"name":"Carbohydrate","amount":"24","unit":"g","daily_value_percent":"?"},
      {"name":"Sugars","amount":"12","unit":"g"},
      {"name":"Protein","amount":"2","unit":"g"}
    ]
  },
  "warnings": ["có gluten", "có trứng/sữa", "đường cao"]
}

Nếu không chắc giá trị nào thì vẫn điền chuỗi số/đơn vị theo ảnh, để trống trường không có.
Chỉ in JSON, không thêm giải thích.
"""

# ==== Utils ====
def call_gemini_with_backoff(model, parts, tries=4):
    for i in range(tries):
        try:
            return model.generate_content(parts)
        except Exception as e:
            msg = str(e)
            if "ResourceExhausted" in msg or "429" in msg:
                delay = max(1, 2 ** i)
                m = re.search(r"retry_delay\s*{\s*seconds:\s*(\d+)", msg)
                if m:
                    delay = max(delay, int(m.group(1)))
                time.sleep(min(delay, 60))
                continue
            raise
    raise RuntimeError("Gemini 429: Hết quota Free Tier/đang quá tải. Hãy bật billing hoặc giảm tần suất gọi.")

def _extract_json(text: str) -> dict:
    start = text.find("{"); end = text.rfind("}")
    candidate = text[start:end+1] if (start != -1 and end != -1 and end > start) else text
    try:
        return json.loads(candidate)
    except Exception:
        m = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
        if m: return json.loads(m.group(1))
        raise

def _detect_mime(img_bytes: bytes, fallback: str = "image/jpeg") -> str:
    try:
        im = Image.open(io.BytesIO(img_bytes))
        fmt = (im.format or "").upper()
        mapping = {"JPEG":"image/jpeg","JPG":"image/jpeg","PNG":"image/png","WEBP":"image/webp","BMP":"image/bmp","TIFF":"image/tiff"}
        return mapping.get(fmt, fallback)
    except Exception:
        return fallback

def _sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def _cache_paths(key: str):
    return LABEL_CACHE_DIR / f"{key}.json", LABEL_CACHE_DIR / f"{key}.txt"

def _human_text_from_label(label: dict) -> str:
    lines = []
    lines.append("THÔNG TIN NHÃN TRÍCH XUẤT")
    lines.append(f"Ngôn ngữ: {label.get('language','')}")
    lines.append("")
    lines.append("— THÀNH PHẦN (raw) —")
    lines.append(label.get("ingredients_raw","(không có)"))
    lines.append("")
    lines.append("— THÀNH PHẦN (parse) —")
    for it in label.get("ingredients", []) or []:
        name = it.get("name","?"); pct = f" ({it.get('percentage')}%)" if it.get("percentage") is not None else ""
        allerg = " [ALLERGEN]" if it.get("is_allergen") else ""
        notes = f" — {it.get('notes')}" if it.get("notes") else ""
        lines.append(f"- {name}{pct}{allerg}{notes}")
    lines.append("")
    nf = label.get("nutrition_facts", {}) or {}
    lines.append("— GIÁ TRỊ DINH DƯỠNG —")
    lines.append(f"Khẩu phần: {nf.get('serving_size','-')}")
    lines.append(f"Số khẩu phần/hộp: {nf.get('servings_per_container','-')}")
    lines.append(f"Calories: {nf.get('calories','-')}")
    for n in nf.get("nutrients", []) or []:
        name = n.get("name","?"); amount = n.get("amount",""); unit = n.get("unit","")
        dv = f" ({n.get('daily_value_percent')})" if n.get("daily_value_percent") else ""
        lines.append(f"- {name}: {amount} {unit}{dv}".strip())
    lines.append("")
    warns = label.get("warnings", []) or []
    lines.append("— CẢNH BÁO —")
    if warns: [lines.append(f"- {w}") for w in warns]
    else: lines.append("-")
    return "\n".join(lines)

# ---------- Helpers cá nhân hoá (đặt ngay sau Utils) ----------
def _bar(value, max_value, width=16):
    try:
        v = float(str(value).replace(",", "."))
        m = float(str(max_value).replace(",", "."))
        ratio = max(0.0, min(1.0, v / m))
    except Exception:
        return ""
    filled = int(round(ratio * width))
    return "█" * filled + "░" * (width - filled)

def _safe_float(x):
    if x is None: return None
    s = str(x)
    m = re.search(r"[-+]?\d+(?:[.,]\d+)?", s)
    return float(m.group(0).replace(",", ".")) if m else None

def _nutrients_list(label):
    return (label or {}).get("nutrition_facts", {}).get("nutrients", []) or []

def _find_amount(label, keys=(), prefer="g", to="g"):
    """Tìm amount theo tên (keys), chuyển đơn vị về 'g' hoặc 'mg' theo 'to'."""
    keys = [k.lower() for k in keys]
    for n in _nutrients_list(label):
        name = str(n.get("name","")).lower()
        if any(k in name for k in keys):
            amt = _safe_float(n.get("amount"))
            unit = str(n.get("unit") or "").lower()
            if amt is None: return None
            if to == "mg":
                if unit == "g": return round(amt * 1000, 2)
                return amt  # đã là mg
            if to == "g":
                if unit == "mg": return round(amt / 1000.0, 3)
                return amt  # đã là g
    return None

def _infer_additives_count(label):
    """Đếm thô phụ gia từ chuỗi thành phần."""
    raw = ((label or {}).get("ingredients_raw") or "").lower()
    patterns = [
        r"\be-?\s?\d{3}[a-z]?\b", r"\be\d{3}[a-z]?\b",
        "chất điều vị", "chất bảo quản", "phẩm màu", "phẩm mầu", "tạo ngọt",
        "hương liệu", "emulsifier", "preservative", "colour", "color", "stabilizer",
        "regulator", "thickener", "acidulant", "antioxidant", "sweetener"
    ]
    cnt = 0
    for p in patterns:
        if p.startswith(r"\b"):
            cnt += len(re.findall(p, raw))
        else:
            cnt += raw.count(p)
    return cnt

def _has_transfat(label):
    raw = ((label or {}).get("ingredients_raw") or "").lower()
    keys = ["trans fat","dầu hydro hóa","hydrogenated","partially hydrogenated","shortening","béo chuyển hóa","béo chuyển hoá"]
    return any(k in raw for k in keys)

def _extract_metrics(label):
    """Rút số liệu chính từ nhãn (mỗi khẩu phần)."""
    return {
        "serving_size": (label or {}).get("nutrition_facts", {}).get("serving_size"),
        "sugars_g":  _find_amount(label, ["sugars","đường"], to="g"),
        "sodium_mg": _find_amount(label, ["sodium","natri"], to="mg"),
        "satfat_g":  _find_amount(label, ["saturated","bão hòa","bão hoà"], to="g"),
        "protein_g": _find_amount(label, ["protein","đạm"], to="g"),
        "fiber_g":   _find_amount(label, ["fiber","chất xơ"], to="g"),
        "kcal":      _safe_float((label or {}).get("nutrition_facts", {}).get("calories")),
        "additives_count": _infer_additives_count(label),
        "transfat_flag": _has_transfat(label),
    }

def _list_join(x):
    if not x: return ""
    if isinstance(x, (list, tuple)):
        return ", ".join(str(i) for i in x if str(i).strip())
    return str(x)

def _profile_texts(profile):
    """Ghép chuỗi điều kiện & mục tiêu (lowercase) để heuristic."""
    conditions = (profile.get("conditions") or {})
    goals = (profile.get("goals") or {})
    cond_list = []
    if isinstance(conditions.get("selected"), list): cond_list += conditions["selected"]
    if isinstance(conditions.get("other"), list): cond_list += conditions["other"]
    if isinstance(conditions.get("other"), str): cond_list += [conditions["other"]]
    goal_list = []
    if isinstance(goals.get("selected"), list): goal_list += goals["selected"]
    if isinstance(goals.get("note"), str): goal_list += [goals["note"]]
    return " ".join([_list_join(cond_list), _list_join(goal_list)]).lower()

def _targets_for_profile(profile):
    """
    Xuất ngưỡng SỐ tuỳ hồ sơ, cho mỗi KHẨU PHẦN:
      - đường_good, đường_high
      - natri_good, natri_high (mg)
      - bãohoà_good, bãohoà_high
      - protein_min (nếu mục tiêu tăng cơ/no lâu)
      - fiber_min (nếu mục tiêu tiêu hoá/giảm cân)
      - additives_max
    """
    text = _profile_texts(profile)
    has_diabetes = any(k in text for k in ["tiểu đường","đái tháo đường","diabetes"])
    weight_loss  = "giảm cân" in text
    hypertension = any(k in text for k in ["huyết áp","tăng huyết áp","hypertension"])
    heart        = any(k in text for k in ["tim mạch","cholesterol","mỡ máu"])
    muscle_gain  = any(k in text for k in ["tăng cơ","muscle"])
    digestion    = any(k in text for k in ["tiêu hoá","dạ dày","ibs","ruột kích thích","trào ngược"])

    # Đường
    sugar_good = 5.0 if (has_diabetes or weight_loss) else 8.0
    sugar_high = 12.0  # mốc cảnh báo

    # Natri (mg)
    sodium_good = 200.0 if hypertension else 400.0
    sodium_high = 600.0

    # Bão hoà (g)
    sat_good = 2.0 if heart else 3.0
    sat_high = 3.5 if heart else 5.0

    # Protein/Fiber
    protein_min = 10.0 if muscle_gain else 6.0  # "vừa phải" ~6–10
    fiber_min   = 5.0 if (weight_loss or digestion) else 3.0

    # Phụ gia
    additives_max = 2 if digestion else 4

    return {
        "sugar_good_g": sugar_good, "sugar_high_g": sugar_high,
        "sodium_good_mg": sodium_good, "sodium_high_mg": sodium_high,
        "satfat_good_g": sat_good, "satfat_high_g": sat_high,
        "protein_min_g": protein_min, "fiber_min_g": fiber_min,
        "additives_max": additives_max
    }

def _allergy_text(allergies):
    # [], None, "", "không có"/"none" => Không có dị ứng nào
    if allergies is None:
        return "Không có dị ứng nào"
    if isinstance(allergies, str):
        if allergies.strip() == "" or allergies.strip().lower() in ["không có","khong co","none","no","no allergy","no allergies"]:
            return "Không có dị ứng nào"
        return allergies.strip()
    if isinstance(allergies, (list, tuple)) and len(allergies) == 0:
        return "Không có dị ứng nào"
    return _list_join(allergies)

def _summarize_profile_facts(profile: dict) -> str:
    basic = profile.get("basic") or {}
    conditions = profile.get("conditions") or {}
    allergies = profile.get("allergies") or []
    goals = profile.get("goals") or {}

    age = basic.get("age")
    gender = basic.get("genderLabel") or basic.get("gender_vi") or basic.get("gender")
    weight = basic.get("weight")
    height = basic.get("height")
    activity = basic.get("activityLevel") or basic.get("activity")

    cond_list = []
    sel = conditions.get("selected")
    if isinstance(sel, list): cond_list += sel
    other = conditions.get("other")
    if isinstance(other, list): cond_list += other
    if isinstance(other, str): cond_list.append(other)

    gsel = goals.get("selected") if isinstance(goals, dict) else None
    goal_list = gsel if isinstance(gsel, list) else []
    note = goals.get("note") if isinstance(goals, dict) else None
    if note: goal_list.append(note)

    return (
        f"Tuổi: {age if age is not None else '-'}; "
        f"Giới: {gender if gender else '-'}; "
        f"Cân nặng: {weight if weight is not None else '-'} kg; "
        f"Chiều cao: {height if height is not None else '-'} cm; "
        f"Vận động: {activity if activity else '-'}; "
        f"Dị ứng: {_allergy_text(allergies)}; "
        f"Bệnh nền/Tình trạng: {_list_join(cond_list) or 'Không ghi nhận'}; "
        f"Mục tiêu: {_list_join(goal_list) or 'Chưa thiết lập'}."
    )

def _render_profile_md(profile: dict) -> str:
    if not profile:
        return "Hồ sơ sức khỏe: Chưa có dữ liệu. Vào mục **Hồ sơ** để cập nhật."
    basic = profile.get("basic") or {}
    conditions = profile.get("conditions") or {}
    allergies = profile.get("allergies") or []
    goals = profile.get("goals") or {}
    updated = profile.get("updatedAt") or profile.get("updated_at") or "-"

    age = basic.get("age") or "-"
    gender = basic.get("genderLabel") or basic.get("gender_vi") or basic.get("gender") or "-"
    weight = basic.get("weight") or "-"
    height = basic.get("height") or "-"
    activity = basic.get("activityLevel") or basic.get("activity") or "-"

    cond_list = []
    sel = conditions.get("selected")
    if isinstance(sel, list): cond_list += sel
    other = conditions.get("other")
    if isinstance(other, list): cond_list += other
    if isinstance(other, str): cond_list.append(other)

    goal_list = []
    gsel = goals.get("selected")
    if isinstance(gsel, list): goal_list += gsel
    note = goals.get("note")
    if note: goal_list.append(note)

    allergy_text = _allergy_text(allergies)

    lines = []
    lines.append("Hồ sơ sức khỏe của bạn")
    lines.append(f"- Cập nhật: {updated}")
    lines.append("1. Thông tin cơ bản:")
    lines.append(f"   - Tuổi: {age}")
    lines.append(f"   - Giới tính: {gender}")
    lines.append(f"   - Cân nặng: {weight} kg")
    lines.append(f"   - Chiều cao: {height} cm")
    lines.append(f"   - Mức vận động: {activity}")
    lines.append("2. Tình trạng/bệnh nền:")
    lines.append(f"   - {_list_join(cond_list) or 'Chưa ghi nhận'}")
    lines.append("3. Dị ứng:")
    lines.append(f"   - {allergy_text}")
    lines.append("4. Mục tiêu sức khỏe:")
    lines.append(f"   - {_list_join(goal_list) or 'Chưa thiết lập'}")
    return "\n".join(lines)

def _render_ingredients_md(label: dict) -> str:
    if not label:
        return "Thành phần: Chưa có nhãn đã quét. Vào **Quét sản phẩm** để chụp nhãn."
    ings = label.get("ingredients") or []
    raw = label.get("ingredients_raw") or ""
    lines = []
    lines.append("Thành phần (từ nhãn)")
    if raw:
        lines += [f"- Nguyên văn: {raw.strip()}", ""]
    if ings:
        lines.append("Danh sách parse:")
        for it in ings:
            name = it.get("name","?")
            pct = f" ({it.get('percentage')}%)" if it.get("percentage") is not None else ""
            allerg = " — [ALLERGEN]" if it.get("is_allergen") else ""
            notes = f" — {it.get('notes')}" if it.get("notes") else ""
            lines.append(f"- {name}{pct}{allerg}{notes}")
    return "\n".join(lines)

def _render_nutrition_md(label: dict) -> str:
    if not label:
        return "Giá trị dinh dưỡng: Chưa có nhãn đã quét."
    nf = (label.get("nutrition_facts") or {})
    rows = []
    rows.append("Giá trị dinh dưỡng (mỗi khẩu phần)")
    rows.append(f"- Khẩu phần: {nf.get('serving_size','-')}")
    rows.append(f"- Số khẩu phần/hộp: {nf.get('servings_per_container','-')}")
    rows.append(f"- Năng lượng: {nf.get('calories','-')}")
    rows.append("")
    rows.append("Bảng tóm tắt:")
    rows.append("| Chỉ tiêu | Lượng | %DV |")
    rows.append("|---|---:|---:|")
    for n in nf.get("nutrients", []) or []:
        rows.append(f"| {n.get('name','?')} | {n.get('amount','')} {n.get('unit','')} | {n.get('daily_value_percent','') or ''} |")
    sugar = _find_amount(label, ["sugars","đường"], to="g")
    sodium= _find_amount(label, ["sodium","natri"], to="mg")
    satfat= _find_amount(label, ["saturated","bão hòa","bão hoà"], to="g")
    rows += ["", "Minh hoạ nhanh:"]
    if sugar is not None:
        rows.append(f"- Đường: `{_bar(sugar, 12)}` {sugar} g / mốc tham chiếu 12 g/khẩu phần")
    if sodium is not None:
        rows.append(f"- Natri: `{_bar(sodium, 400)}` {sodium} mg / mốc tham chiếu 400 mg/khẩu phần")
    if satfat is not None:
        rows.append(f"- Bão hoà: `{_bar(satfat, 5)}` {satfat} g / mốc tham chiếu 5 g/khẩu phần")
    return "\n".join(rows)

def _render_label_all_md(label: dict) -> str:
    parts = [_render_ingredients_md(label), "", _render_nutrition_md(label)]
    return "\n".join(p for p in parts if p)

# --- intent detector ---
_PROF_RE = re.compile(r"\b(xem|hiển\s*thị|mở|cho\s*tôi\s*xem)\b.*\b(hồ\s*sơ|profile)\b", re.I)
_ING_RE  = re.compile(r"\b(xem|hiển\s*thị|mở)\b.*\b(thành\s*phần|ingredients?|nhãn|label)\b", re.I)
_NUT_RE  = re.compile(r"\b(xem|hiển\s*thị|mở)\b.*\b(giá\s*trị\s*dinh\s*dưỡng|nutrition)\b", re.I)
_RECO_RE = re.compile(r"\b(đề\s*xuất|gợi\s*ý|thay\s*thế|tốt\s*hơn)\b", re.I)
_EXCLUDE = ("gây dị ứng", "đánh giá", "phù hợp", "an toàn", "bao nhiêu", "tần suất", "so sánh")

def _detect_intent(msg: str):
    t = (msg or "").lower().strip()
    if not t: return None
    if _PROF_RE.search(t): return "SHOW_PROFILE"
    if _ING_RE.search(t):  return "SHOW_INGREDIENTS"
    if _NUT_RE.search(t):  return "SHOW_NUTRITION"
    if _RECO_RE.search(t): return "RECOMMEND"
    return None

def _normalize_md(text: str) -> str:
    out = []
    for line in (text or "").splitlines():
        l = re.sub(r'^\s*#{1,6}\s*', '', line)
        l = re.sub(r'^\s*[*•]\s+', '- ', l)
        out.append(l)
    return "\n".join(out)

# ==== Catalog & Stores (cho /recommend) ====
def _to_float(x):
    try:
        if x is None: return None
        return float(str(x).replace(",", ".").strip())
    except Exception:
        return None

def _load_catalog(path: str):
    p = Path(path)
    if not p.exists():
        print(f"[WARN] Catalog not found at {p.resolve()}")
        return []
    raw = json.loads(p.read_text("utf-8"))
    out = []
    for it in raw:
        if not it or not isinstance(it, dict): continue
        if not it.get("eligible", False):  # chỉ lấy mục đủ dữ liệu
            continue
        name = (it.get("name") or "").strip()
        brand = (it.get("brand") or "").strip()
        if not (name or brand):
            continue
        nut = (it.get("nutrition_100g") or {})
        norm = {
            "sugars_g":  _to_float(nut.get("sugars_g")),
            "carbs_g":   _to_float(nut.get("carbs_g")),
            "sodium_g":  _to_float(nut.get("sodium_g")),
            "salt_g":    _to_float(nut.get("salt_g")),
            "satfat_g":  _to_float(nut.get("satfat_g")),
            "protein_g": _to_float(nut.get("protein_g")),
            "fat_g":     _to_float(nut.get("fat_g")),
            "fiber_g":   _to_float(nut.get("fiber_g")),
            "energy_kcal": _to_float(nut.get("energy_kcal")),
        }
        if sum(v is not None for v in norm.values()) < 3:
            continue
        out.append({
            "barcode": it.get("barcode"),
            "name": name,
            "brand": brand,
            "category": (it.get("category") or "").lower().strip(),
            "countries": it.get("countries") or [],
            "allergens": it.get("allergens") or [],
            "additives": it.get("additives") or [],
            "nutrition_100g": norm
        })
    print(f"[INFO] Catalog loaded: {len(out)} items")
    return out

def _load_stores(path: str):
    p = Path(path)
    if not p.exists():
        print(f"[WARN] Stores file not found at {p.resolve()}")
        return []
    data = json.loads(p.read_text("utf-8"))
    out = []
    for s in data:
        chains = [str(x).lower() for x in (s.get("chains") or [])]
        cats = [str(x).lower() for x in (s.get("categories") or [])]
        out.append({
            "store": s.get("store"),
            "district": s.get("district"),
            "type": s.get("type","supermarket"),
            "chains": chains,
            "categories": cats
        })
    print(f"[INFO] Stores loaded: {len(out)} entries")
    return out

CATALOG = _load_catalog(CATALOG_PATH)
STORES = _load_stores(STORES_PATH)

# ==== Scoring & Recommend ====
_BUCKETS = {
    "beverage": {"beverage","tea","coffee","water","yogurt"},
    "snack":    {"snack","biscuit","cereal"},
    "noodle":   {"noodle/dumpling","noodle","dumpling","vermicelli"},
    "milk":     {"milk","yogurt"},
    "oil":      {"oil","condiment"},
    "condiment":{"condiment"},
    "misc":     {"misc"}
}
def _bucket_of(cat: str):
    cat = (cat or "").lower().strip()
    for k, s in _BUCKETS.items():
        if cat in s: return k
    return "misc"

def _same_bucket(cat1, cat2):
    return _bucket_of(cat1) == _bucket_of(cat2)

def _guess_category_from_label(label: dict) -> str:
    text = " ".join([
        (label.get("ingredients_raw") or "").lower(),
        json.dumps(label.get("ingredients") or [], ensure_ascii=False).lower()
    ])
    kw = {
        "tea": ["trà","oolong","tea"],
        "coffee": ["cà phê","coffee"],
        "milk": ["sữa","yogurt","yaourt","sữa chua"],
        "snack": ["snack","bánh","chips","crackers","wafer","cookie"],
        "noodle/dumpling": ["mì","bún","phở","miến","dumpling","mandu"],
        "oil": ["dầu","olive","pesto"],
        "condiment": ["tương","nước mắm","sốt","sauce","ketchup","mayonnaise","mù tạt","mustard"],
        "water": ["nước khoáng","nước uống","water"]
    }
    for cat, words in kw.items():
        if any(w in text for w in words):
            return cat
    return "misc"

def _profile_allergy_set(profile: dict):
    al = profile.get("allergies") or []
    if isinstance(al, str): al = [al]
    return {str(x).lower() for x in al if str(x).strip()}

def _has_allergen(item_allergens, user_allergies: set):
    if not user_allergies: return False
    for a in item_allergens or []:
        a = str(a).lower()
        for ua in user_allergies:
            if ua in a or a.endswith(ua):
                return True
    return False

def _goals_text(profile: dict) -> str:
    g = profile.get("goals") or {}
    parts = []
    if isinstance(g.get("selected"), list): parts += g.get("selected")
    if g.get("note"): parts.append(g.get("note"))
    return ", ".join(str(x) for x in parts if str(x).strip())

def _score_item(item: dict, profile: dict, goals_text: str = ""):
    nut = item["nutrition_100g"]
    score, reasons = 0.0, []

    sugar = nut.get("sugars_g");   sodium = nut.get("sodium_g")
    satfat = nut.get("satfat_g");  protein = nut.get("protein_g")
    fiber  = nut.get("fiber_g");   kcal = nut.get("energy_kcal")

    if sugar is not None:
        if sugar <= 5: score += 2; reasons.append("Đường thấp (≤5g/100g)")
        elif sugar <= 8: score += 1; reasons.append("Đường trung bình")
        else: score -= 1; reasons.append("Đường cao")

    if sodium is not None:
        if sodium <= 0.12: score += 2; reasons.append("Natri thấp (≤120mg/100g)")
        elif sodium > 0.4: score -= 1; reasons.append("Natri cao")

    if satfat is not None:
        if satfat <= 3: score += 1
        elif satfat > 5: score -= 1

    goals_text = goals_text.lower()
    if protein is not None and any(k in goals_text for k in ["tăng cơ","protein","giảm mỡ","no lâu"]):
        if protein >= 10: score += 2; reasons.append("Protein cao (≥10g/100g)")
    if fiber is not None and any(k in goals_text for k in ["tiêu hoá","giảm cân","ít đói"]):
        if fiber >= 5: score += 1; reasons.append("Chất xơ đáng kể (≥5g/100g)")

    if kcal is not None and _bucket_of(item["category"]) in {"snack"} and kcal > 480:
        score -= 1; reasons.append("Năng lượng cao cho snack")

    return score, reasons

def _stores_for_item(item, topn=3):
    brand = (item.get("brand") or "").lower()
    cat   = (item.get("category") or "").lower()
    bucket= _bucket_of(cat)

    scored = []
    for s in STORES:
        sc = 0
        if brand:
            if any((brand in ch) or (ch in brand) for ch in s["chains"]):
                sc += 2
        if (bucket in s["categories"]) or (cat in s["categories"]):
            sc += 1
        if sc > 0:
            scored.append((sc, s))
    scored.sort(key=lambda x: x[0], reverse=True)
    out = []
    for sc, s in scored[:topn]:
        out.append({"store": s["store"], "district": s["district"], "type": s.get("type","supermarket")})
    return out

def _recommend_core(profile, label, k=5, category=None):
    if not CATALOG:
        return {"ok": False, "error": "Catalog trống"}
    cat = category or _guess_category_from_label(label)
    bucket = _bucket_of(cat)
    goals  = _goals_text(profile)
    user_allergies = _profile_allergy_set(profile)

    pool = [it for it in CATALOG if _same_bucket(it["category"], bucket)] or CATALOG[:]
    scored = []
    for it in pool:
        if _has_allergen(it.get("allergens"), user_allergies):
            continue
        s, reasons = _score_item(it, profile, goals_text=goals)
        scored.append((s, reasons, it))
    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:max(1, int(k))]

    out = []
    for (s, reasons, it) in top:
        n = it["nutrition_100g"]
        out.append({
            "name": it.get("name"),
            "brand": it.get("brand"),
            "barcode": it.get("barcode"),
            "category": it.get("category"),
            "score": round(float(s), 2),
            "reasons": reasons,
            "n_100g": {
                "sugars_g": n.get("sugars_g"),
                "sodium_mg": int(round(n.get("sodium_g",0)*1000)) if n.get("sodium_g") is not None else None,
                "satfat_g": n.get("satfat_g"),
                "protein_g": n.get("protein_g"),
                "kcal": n.get("energy_kcal")
            },
            "stores": _stores_for_item(it, topn=3)
        })
    return {"ok": True, "category_guess": cat, "bucket": _bucket_of(cat), "items": out}

# ==== API: /_health (debug nhanh) ====
@app.get("/_health")
def _health():
    return jsonify(ok=True, version=APP_VERSION,
                   routes=sorted(str(r) for r in app.url_map.iter_rules()))

# ==== API: /label/analyze ====
def _read_image_from_request():
    data = request.get_json(silent=True) or {}
    if request.content_type and "multipart/form-data" in request.content_type:
        f = request.files.get("image") or request.files.get("file")
        if not f or f.filename == "":
            return None, None, None, "missing file field"
        img_bytes = f.read(); filename = f.filename
        return img_bytes, filename, "multipart", None
    b64 = data.get("image_base64") or data.get("image") or ""
    if b64:
        if b64.startswith("data:"):
            b64 = b64.split(",", 1)[1]
        try:
            img_bytes = base64.b64decode(b64, validate=True)
            return img_bytes, "upload.png", "base64", None
        except Exception as e:
            return None, None, None, f"invalid base64: {e}"
    return None, None, None, "missing image"

@app.route("/label/analyze", methods=["POST","OPTIONS"])
def analyze_label():
    if request.method == "OPTIONS":
        return ("", 204)
    img_bytes, filename, source, err = _read_image_from_request()
    if err:
        return jsonify(ok=False, error=err), 400

    cache_key = _sha256(img_bytes)
    cache_json_path, cache_txt_path = _cache_paths(cache_key)
    if cache_json_path.exists():
        with open(cache_json_path, "r", encoding="utf-8") as fp:
            label = json.load(fp)
        return jsonify(
            ok=True,
            label=label,
            saved={"json": str(cache_json_path), "txt": str(cache_txt_path)},
            meta={"source": source, "filename": filename, "mime": _detect_mime(img_bytes),
                  "cached": True, "cache_key": cache_key},
        )

    f_mime = (mimetypes.guess_type(filename or "")[0] or "").lower()
    mime = _detect_mime(img_bytes, f_mime or "image/jpeg")
    prompt = (
        "Đọc nhãn thực phẩm trong ảnh (tiếng Việt nếu có). "
        "Trích xuất Thành phần và Giá trị dinh dưỡng theo schema bên dưới.\n" + SCHEMA_HINT
    )
    parts = [{"text": prompt}, {"inline_data": {"mime_type": mime, "data": img_bytes}}]
    try:
        result = call_gemini_with_backoff(VLM_MODEL, parts)
        text = result.text or ""
    except Exception as e:
        return jsonify(ok=False, error=f"Gemini error: {type(e).__name__}: {e}"), 502
    try:
        label = _extract_json(text)
    except Exception as e:
        return jsonify(ok=False, error=f"Parse JSON failed: {e}", raw=text[:5000]), 500

    label.setdefault("ingredients", [])
    label.setdefault("nutrition_facts", {}).setdefault("nutrients", [])
    label.setdefault("warnings", [])

    with open(cache_json_path, "w", encoding="utf-8") as fp:
        json.dump(label, fp, ensure_ascii=False, indent=2)
    with open(cache_txt_path, "w", encoding="utf-8") as fp:
        fp.write(_human_text_from_label(label))

    ts = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    base_stem = Path(secure_filename(filename or "upload")).stem or "upload"
    prefix = f"{ts}_{base_stem}"
    json_path = OUT_DIR / f"{prefix}.json"
    txt_path  = OUT_DIR / f"{prefix}.txt"
    with open(json_path, "w", encoding="utf-8") as fp:
        json.dump(label, fp, ensure_ascii=False, indent=2)
    with open(txt_path, "w", encoding="utf-8") as fp:
        fp.write(_human_text_from_label(label))

    return jsonify(
        ok=True,
        label=label,
        saved={"json": str(json_path), "txt": str(txt_path), "cache_json": str(cache_json_path)},
        meta={"source": source, "filename": filename, "mime": mime,
              "cached": False, "cache_key": cache_key},
    )

# ==== API: /advice (cá nhân hoá con số) ====
@app.route("/advice", methods=["POST","OPTIONS"])
def advice():
    if request.method == "OPTIONS":
        return ("", 204)

    body = request.get_json(silent=True) or {}
    profile = body.get("profile")
    label = body.get("label")
    if not profile or not label:
        return jsonify(ok=False, error="Missing profile or label"), 400

    # Chuẩn bị dữ kiện số cho LLM (và hiển thị)
    metrics = _extract_metrics(label)
    targets = _targets_for_profile(profile)
    facts   = _summarize_profile_facts(profile)

    # Prompt: bắt buộc lượng hoá & tiêu chí số
    system = (
        "Bạn là chuyên gia dinh dưỡng lâm sàng. Luôn dùng CON SỐ cụ thể, "
        "không dùng từ mơ hồ như 'nhiều/ít/có thể'. "
        "Phân loại theo 4 mức: Phù hợp / Cần cân nhắc / Hạn chế / Tránh, "
        "dựa vào các NGƯỠNG SỐ đã cung cấp. "
        "Khi viết 'thấp/vừa/cao' phải kèm ngưỡng dạng ≤, x–y, ≥. "
        "Kết quả phải có các phần: "
        "**Trả lời nhanh** (1–2 câu), "
        "**Phân tích chi tiết** (so số đo với ngưỡng), "
        "**Tiêu chí chọn tốt hơn** (liệt kê ngưỡng số), "
        "và **Gợi ý khẩu phần/tần suất**."
    )

    # Tạo nội dung đầu vào cho model
    user = (
        f"HỒ SƠ CHUẨN HOÁ: {facts}\n\n"
        f"SỐ LIỆU TỪ NHÃN (mỗi khẩu phần) — JSON: {json.dumps(metrics, ensure_ascii=False)}\n"
        f"NGƯỠNG CHO HỒ SƠ NÀY — JSON: {json.dumps(targets, ensure_ascii=False)}\n\n"
        "YÊU CẦU:\n"
        "- So sánh từng chỉ tiêu (đường, natri, bão hoà, protein, chất xơ, phụ gia) với ngưỡng.\n"
        "- Với protein/chất xơ: nếu mục tiêu tăng cơ/tiêu hoá/giảm cân thì nêu rõ 'vừa phải' và 'tốt' bằng dải số (ví dụ 6–10 g/khẩu phần = vừa, ≥10 g = tốt).\n"
        "- Với phụ gia: ghi rõ số đếm phát hiện và ngưỡng 'ít phụ gia' = ≤ {add_max}; 'nhiều' = > {add_max}.\n"
        "- Nếu có dấu hiệu trans fat (transfat_flag=true) → mức **Tránh**.\n"
        "- Đưa khuyến nghị tần suất theo mức: Phù hợp (dùng thường xuyên, tuỳ tổng ngày), "
        "Cần cân nhắc (≤ 3 lần/tuần), Hạn chế (≤ 1–2 lần/tuần), Tránh (không dùng)."
    ).format(add_max=targets["additives_max"])

    try:
        result = call_gemini_with_backoff(LLM_MODEL, [{"text": system}, {"text": user}])
        md = _normalize_md((result.text or "").strip())
    except Exception as e:
        return jsonify(ok=False, error=f"Gemini error: {type(e).__name__}: {e}"), 502

    return jsonify(ok=True, advice_markdown=md, metrics=metrics, targets=targets)

# ==== Recommend API ====
@app.route("/recommend", methods=["POST","OPTIONS"])
def recommend():
    if request.method == "OPTIONS":
        return ("", 204)
    body = request.get_json(silent=True) or {}
    res = _recommend_core(
        profile = body.get("profile") or {},
        label   = body.get("label") or {},
        k       = int(body.get("k") or 5),
        category= body.get("category")
    )
    return jsonify(res), (200 if res.get("ok") else 400)

# ==== Chatbot ====
from collections import defaultdict
import uuid

CHAT_HIST = defaultdict(list)
MAX_TURNS = 12

SHOPPER_ASSISTANT_SYSTEM = """
Bạn là HealthScan AI – chuyên gia dinh dưỡng lâm sàng & “coach” mua sắm siêu thị.
Mục tiêu: trả lời CHÍNH XÁC câu hỏi, dựa hồ sơ & nhãn, KHÔNG bịa.

PHONG CÁCH & ĐỊNH DẠNG
- Ngôn ngữ: tiếng Việt, giọng ấm áp.
- Không dùng heading '#', bullet '*'. Dùng tiêu đề in đậm, '-' hoặc 1., 2.
- Luôn mở đầu bằng **Trả lời nhanh** (1–2 câu).
- LUÔN LƯỢNG HOÁ: thay “thấp/vừa/cao” bằng số cụ thể dạng ≤, x–y, ≥ (ví dụ: 'đường thấp ≤5 g/khẩu phần').
- Nếu dữ liệu thiếu, nói rõ “không có trong nhãn/hồ sơ”.

ĐÁNH GIÁ SẢN PHẨM (4 mức)
1) Phù hợp — đáp ứng mục tiêu, không vượt ngưỡng cảnh báo.
2) Cần cân nhắc — chạm/nhỉnh ngưỡng: hướng dẫn khẩu phần & tần suất.
3) Hạn chế — bất lợi rõ (đường/natri/bão hoà…), chỉ dùng thỉnh thoảng (≤ 1–2 lần/tuần).
4) Tránh — có dị ứng/ trans fat / vượt ngưỡng cảnh báo cao.

CÁ NHÂN HÓA
- Dị ứng: chỉ cảnh báo khi hồ sơ có.
- Tình trạng/mục tiêu: ưu tiên chỉ tiêu liên quan (tiểu đường ↔ đường; huyết áp ↔ natri; tim mạch ↔ bão hoà/trans; tăng cơ ↔ protein; tiêu hoá/giảm cân ↔ chất xơ & phụ gia).

GỢI Ý TỐT HƠN
- Xuất 'Tiêu chí chọn tốt hơn' bằng con số (ví dụ: đường ≤5 g/khẩu phần; natri ≤200–400 mg; bão hoà ≤2–3 g; không trans fat; phụ gia ≤2–4; protein ≥6–10 g; chất xơ ≥3–5 g tuỳ mục tiêu).
- Gợi ý thay thế theo danh mục khi phù hợp.

LƯU Ý Ý ĐỊNH
- Chỉ đổ dữ liệu thô khi người dùng RÕ RÀNG yêu cầu 'xem/hiển thị/mở…'.
"""

def _format_history_for_prompt(hist):
    lines = []
    for h in hist[-MAX_TURNS:]:
        who = "Người dùng" if h["role"] == "user" else "Assistant"
        lines.append(f"{who}: {h['text']}")
    return "\n".join(lines)

@app.route("/chat", methods=["POST","OPTIONS"])
def chat():
    if request.method == "OPTIONS":
        return ("", 204)

    body = request.get_json(silent=True) or {}
    message = (body.get("message") or "").strip()
    profile = body.get("profile") or {}
    label = body.get("label") or {}
    reset = bool(body.get("reset"))
    chat_id = body.get("chat_id") or uuid.uuid4().hex

    if not message:
        return jsonify(ok=False, error="Missing 'message'"), 400
    if reset:
        CHAT_HIST.pop(chat_id, None)

    CHAT_HIST[chat_id].append({"role": "user", "text": message, "ts": datetime.utcnow().isoformat()})

    intent = _detect_intent(message)
    built_in_reply = None
    if intent == "SHOW_PROFILE":
        built_in_reply = _render_profile_md(profile)
    elif intent == "SHOW_INGREDIENTS":
        built_in_reply = _render_ingredients_md(label)
    elif intent == "SHOW_NUTRITION":
        built_in_reply = _render_nutrition_md(label)
    elif intent == "RECOMMEND":
        rec = _recommend_core(profile, label, k=5)
        if not rec.get("ok"):
            built_in_reply = "Xin lỗi, catalog chưa sẵn sàng để đề xuất."
        else:
            rows = []
            rows.append("**Trả lời nhanh**: Đây là vài lựa chọn phù hợp hơn dựa trên hồ sơ & nhãn hiện tại.")
            rows.append(f"- Danh mục ước đoán: {rec['category_guess']} → nhóm {_bucket_of(rec['category_guess'])}")
            rows.append("")
            for i, it in enumerate(rec["items"], 1):
                m = it["n_100g"]
                store_txt = ", ".join(f"{s['store']} ({s['district']})" for s in (it.get("stores") or [])) or "—"
                rows += [
                    f"{i}. **{it['name']}** — {it.get('brand') or 'N/A'} (#{it.get('barcode') or '—'})",
                    f"   - Điểm sức khỏe: **{it['score']}**; Lý do: {', '.join(it['reasons']) or '—'}",
                    f"   - Dinh dưỡng/100g: đường {m['sugars_g'] if m['sugars_g'] is not None else '-'} g; natri {m['sodium_mg'] if m['sodium_mg'] is not None else '-'} mg; bão hoà {m['satfat_g'] if m['satfat_g'] is not None else '-'} g; protein {m['protein_g'] if m['protein_g'] is not None else '-'} g; {m['kcal'] if m['kcal'] is not None else '-'} kcal",
                    f"   - Có thể tìm tại (Hà Nội): {store_txt}"
                ]
            rows.append("")
            rows.append("- **Tiêu chí chọn tốt hơn**: đường ≤5 g/100 g; natri ≤120 mg/100 g; bão hòa ≤3 g/100 g; ưu tiên chất xơ ≥5 g/100 g hoặc protein ≥10 g/100 g (tuỳ mục tiêu).")
            built_in_reply = "\n".join(rows)

    if built_in_reply:
        reply = _normalize_md(built_in_reply)
        CHAT_HIST[chat_id].append({"role": "assistant", "text": reply, "ts": datetime.utcnow().isoformat()})
        chat_dump = {"chat_id": chat_id, "updated_at": datetime.utcnow().isoformat(),
                     "history": CHAT_HIST[chat_id][-MAX_TURNS:]}
        with open(OUT_DIR / f"chat_{chat_id}.json", "w", encoding="utf-8") as fp:
            json.dump(chat_dump, fp, ensure_ascii=False, indent=2)
        return jsonify(ok=True, chat_id=chat_id, reply_markdown=reply)

    # LLM fallback
    facts = _summarize_profile_facts(profile)
    metrics = _extract_metrics(label)
    targets = _targets_for_profile(profile)
    context_blocks = [
        {"text": SHOPPER_ASSISTANT_SYSTEM},
        {"text": "HỒ SƠ (tóm tắt chuẩn hoá):"},
        {"text": facts},
        {"text": "SỐ LIỆU NHÃN (JSON):"},
        {"text": json.dumps(metrics, ensure_ascii=False)},
        {"text": "NGƯỠNG (JSON):"},
        {"text": json.dumps(targets, ensure_ascii=False)},
        {"text": "HỘI THOẠI GẦN NHẤT:"},
        {"text": _format_history_for_prompt(CHAT_HIST[chat_id])},
        {"text": f"CÂU HỎI HIỆN TẠI:\n{message}"},
    ]
    try:
        result = call_gemini_with_backoff(LLM_MODEL, context_blocks)
        reply_raw = (result.text or "").strip()
        reply = _normalize_md(reply_raw)
    except Exception as e:
        return jsonify(ok=False, error=f"Gemini error: {type(e).__name__}: {e}"), 502

    CHAT_HIST[chat_id].append({"role": "assistant", "text": reply, "ts": datetime.utcnow().isoformat()})

    chat_dump = {
        "chat_id": chat_id,
        "updated_at": datetime.utcnow().isoformat(),
        "history": CHAT_HIST[chat_id][-MAX_TURNS:],
    }
    with open(OUT_DIR / f"chat_{chat_id}.json", "w", encoding="utf-8") as fp:
        json.dump(chat_dump, fp, ensure_ascii=False, indent=2)

    return jsonify(ok=True, chat_id=chat_id, reply_markdown=reply)

# ==== Run ====
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
