# -*- coding: utf-8 -*-
"""
HealthScan Server — mixed catalog loader + image support
- Hỗ trợ cả catalog cũ (health_catalog.json) và OFF (off_vn_no_nulls (1).json)
- Đề xuất sản phẩm kèm ảnh minh hoạ, ẩn barcode trong phần văn bản
"""

import os, io, re, json, base64, mimetypes, time, hashlib
from datetime import datetime, timedelta
from pathlib import Path
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
from dotenv import load_dotenv, find_dotenv
import google.generativeai as genai
import requests

# Authentication imports
import bcrypt
import jwt
from pymongo import MongoClient
from bson import ObjectId

# ==== Load env ====
load_dotenv(find_dotenv())
API_KEY = os.getenv("GEMINI_API_KEY")
PORT = int(os.getenv("PORT", "8888"))
ASR_UPSTREAM = os.getenv("ASR_URL", "").strip()  # ví dụ: https://xxxxx.ngrok-free.app/transcribe
if not ASR_UPSTREAM:
    print("[WARN] ASR_URL is empty; /asr proxy will return 503 if called.")

# ==== Authentication Configuration ====
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "healthscanpro")
JWT_SECRET = os.getenv("JWT_SECRET", "healthscanpro_secret_key_2024")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))


# Paths: outputs + Data/*
BASE_DIR = Path(__file__).parent
OUT_DIR = Path(os.getenv("OUT_DIR", BASE_DIR / "outputs"))
OUT_DIR.mkdir(parents=True, exist_ok=True)
LABEL_CACHE_DIR = OUT_DIR / "label_cache"
LABEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)

DATA_DIR = BASE_DIR / "Data"

def _resolve_catalog_path():
    # Ưu tiên biến môi trường
    env = os.getenv("CATALOG_PATH")
    if env:
        return env
    # Thử OFF mới có khoảng trắng trong tên
    cand = [
        DATA_DIR / "off_vn_no_nulls (1).json",
        DATA_DIR / "off_vn_no_nulls.json",
        DATA_DIR / "health_catalog.json",
    ]
    for p in cand:
        if Path(p).exists():
            return str(p)
    # Fallback cuối cùng
    return str(DATA_DIR / "health_catalog.json")

CATALOG_PATH = _resolve_catalog_path()
STORES_PATH  = os.getenv("STORES_PATH",  str(DATA_DIR / "hanoi_stores.json"))

APP_VERSION = "2025-09-11-reco+personalized+nutriscore+images"
HEALTH_SCORE_MAX = 8.0  # thang điểm sức khỏe cá nhân hoá

if not API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY in .env")

# ==== MongoDB Connection ====
try:
    client = MongoClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    users_collection = db.users
    health_profiles_collection = db.health_profiles
    
    # Test connection
    client.admin.command('ping')
    print(f"[INFO] MongoDB connected successfully to {DATABASE_NAME}")
except Exception as e:
    print(f"[ERROR] MongoDB connection failed: {e}")
    raise

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
CORS(app,
     resources={r"/*": {"origins": ALLOWED + [r"http://192\.168\.\d+\.\d+:\d+"]}},
     methods=["GET","POST","OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])

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

# ==== Authentication Functions ====
def generate_token(user_id, username, role):
    """Generate JWT token for user"""
    payload = {
        'user_id': str(user_id),
        'username': username,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token):
    """Verify JWT token and return user info"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return {
            'success': True,
            'user_id': payload['user_id'],
            'username': payload['username'],
            'role': payload['role']
        }
    except jwt.ExpiredSignatureError:
        return {'success': False, 'error': 'Token expired'}
    except jwt.InvalidTokenError:
        return {'success': False, 'error': 'Invalid token'}

def token_required(f):
    """Decorator to require JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'success': False, 'error': 'Token is missing'}), 401
        
        token_data = verify_token(token)
        if not token_data['success']:
            return jsonify({'success': False, 'error': token_data['error']}), 401
        
        return f(token_data, *args, **kwargs)
    return decorated

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_user(user_data):
    """Create new user in MongoDB"""
    try:
        # Check if username or email already exists
        existing_user = users_collection.find_one({
            '$or': [
                {'username': user_data['username']},
                {'email': user_data['email']}
            ]
        })
        
        if existing_user:
            if existing_user['username'] == user_data['username']:
                return {'success': False, 'error': 'Username đã tồn tại'}
            if existing_user['email'] == user_data['email']:
                return {'success': False, 'error': 'Email đã tồn tại'}
        
        # Hash password
        hashed_password = hash_password(user_data['password'])
        
        # Create user document
        user_doc = {
            'username': user_data['username'],
            'email': user_data['email'],
            'password': hashed_password,
            'role': user_data.get('role', 'user'),
            'fullName': user_data.get('fullName', user_data['username']),
            'avatar': user_data.get('avatar', '👤'),
            'permissions': user_data.get('permissions', ['basic']),
            'health_profiles': [],  # Danh sách hồ sơ sức khỏe
            'current_health_profile': None,  # Hồ sơ hiện tại đang sử dụng
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow(),
            'lastLogin': None,
            'isActive': True
        }
        
        # Insert user
        result = users_collection.insert_one(user_doc)
        user_doc['_id'] = str(result.inserted_id)
        
        # Remove password from response
        del user_doc['password']
        
        return {'success': True, 'user': user_doc}
        
    except Exception as e:
        print(f"[ERROR] Create user failed: {e}")
        return {'success': False, 'error': 'Có lỗi xảy ra khi tạo tài khoản'}

def authenticate_user(username, password):
    """Authenticate user login"""
    try:
        # Find user by username or email
        user = users_collection.find_one({
            '$or': [
                {'username': username},
                {'email': username}
            ]
        })
        
        if not user:
            return {'success': False, 'error': 'Tên đăng nhập hoặc mật khẩu không đúng'}
        
        if not user.get('isActive', True):
            return {'success': False, 'error': 'Tài khoản đã bị khóa'}
        
        # Verify password
        if not verify_password(password, user['password']):
            return {'success': False, 'error': 'Tên đăng nhập hoặc mật khẩu không đúng'}
        
        # Update last login
        users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {'lastLogin': datetime.utcnow()}}
        )
        
        # Generate token
        token = generate_token(user['_id'], user['username'], user['role'])
        
        # Remove password from response
        user['_id'] = str(user['_id'])
        del user['password']
        
        return {
            'success': True,
            'user': user,
            'token': token
        }
        
    except Exception as e:
        print(f"[ERROR] Authentication failed: {e}")
        return {'success': False, 'error': 'Có lỗi xảy ra khi đăng nhập'}

def get_user_by_id(user_id):
    """Get user by ID"""
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return {'success': False, 'error': 'User not found'}
        
        user['_id'] = str(user['_id'])
        del user['password']
        return {'success': True, 'user': user}
        
    except Exception as e:
        print(f"[ERROR] Get user failed: {e}")
        return {'success': False, 'error': 'Có lỗi xảy ra khi lấy thông tin user'}

def update_user(user_id, update_data):
    """Update user information"""
    try:
        # Remove sensitive fields
        update_data.pop('password', None)
        update_data.pop('_id', None)
        update_data.pop('createdAt', None)
        
        # Add updated timestamp
        update_data['updatedAt'] = datetime.utcnow()
        
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return {'success': False, 'error': 'User not found'}
        
        # Get updated user
        return get_user_by_id(user_id)
        
    except Exception as e:
        print(f"[ERROR] Update user failed: {e}")
        return {'success': False, 'error': 'Có lỗi xảy ra khi cập nhật thông tin'}

def create_admin_account():
    """Create admin account if not exists"""
    try:
        # Check if admin already exists
        admin = users_collection.find_one({'username': 'admin'})
        if admin:
            return {'success': False, 'error': 'Admin account already exists'}
        
        # Create admin account
        admin_data = {
            'username': 'admin',
            'email': 'admin@healthscanpro.com',
            'password': 'admin123',
            'role': 'admin',
            'fullName': 'Administrator',
            'avatar': '👑',
            'permissions': ['all']
        }
        
        return create_user(admin_data)
        
    except Exception as e:
        print(f"[ERROR] Create admin failed: {e}")
        return {'success': False, 'error': 'Có lỗi xảy ra khi tạo admin'}

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

# ---------- Helpers cá nhân hoá & hiển thị ----------
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
    keys = [k.lower() for k in keys]
    for n in _nutrients_list(label):
        name = str(n.get("name","")).lower()
        if any(k in name for k in keys):
            amt = _safe_float(n.get("amount"))
            unit = str(n.get("unit") or "").lower()
            if amt is None: return None
            if to == "mg":
                if unit == "g": return round(amt * 1000, 2)
                return amt
            if to == "g":
                if unit == "mg": return round(amt / 1000.0, 3)
                return amt
    return None

def _infer_additives_count(label):
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
    conditions = (profile.get("conditions") or {})
    goals = (profile.get("goals") or {})
    cond_list, goal_list = [], []
    if isinstance(conditions.get("selected"), list): cond_list += conditions["selected"]
    if isinstance(conditions.get("other"), list): cond_list += conditions["other"]
    if isinstance(conditions.get("other"), str): cond_list += [conditions["other"]]
    if isinstance(goals.get("selected"), list): goal_list += goals["selected"]
    if isinstance(goals.get("note"), str): goal_list += [goals["note"]]
    return " ".join([_list_join(cond_list), _list_join(goal_list)]).lower()

def _targets_for_profile(profile):
    text = _profile_texts(profile)
    has_diabetes = any(k in text for k in ["tiểu đường","đái tháo đường","diabetes"])
    weight_loss  = "giảm cân" in text
    hypertension = any(k in text for k in ["huyết áp","tăng huyết áp","hypertension"])
    heart        = any(k in text for k in ["tim mạch","cholesterol","mỡ máu"])
    muscle_gain  = any(k in text for k in ["tăng cơ","muscle"])
    digestion    = any(k in text for k in ["tiêu hoá","dạ dày","ibs","ruột kích thích","trào ngược"])

    sugar_good = 5.0 if (has_diabetes or weight_loss) else 8.0
    sugar_high = 12.0
    sodium_good = 200.0 if hypertension else 400.0
    sodium_high = 600.0
    sat_good = 2.0 if heart else 3.0
    sat_high = 3.5 if heart else 5.0
    protein_min = 10.0 if muscle_gain else 6.0
    fiber_min   = 5.0 if (weight_loss or digestion) else 3.0
    additives_max = 2 if digestion else 4

    return {
        "sugar_good_g": sugar_good, "sugar_high_g": sugar_high,
        "sodium_good_mg": sodium_good, "sodium_high_mg": sodium_high,
        "satfat_good_g": sat_good, "satfat_high_g": sat_high,
        "protein_min_g": protein_min, "fiber_min_g": fiber_min,
        "additives_max": additives_max
    }

def _allergy_text(allergies):
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
        return "Hồ sơ sức khỏe: Chưa có dữ liệu. Vào **Hồ sơ** để cập nhật."
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

def _render_detailed_health_analysis(label: dict, profile: dict) -> str:
    """Render detailed health analysis with benefits, ingredients, nutrition, and recommendations"""
    if not label:
        return "Phân tích chi tiết: Chưa có nhãn đã quét. Vào **Quét sản phẩm** để chụp nhãn."
    
    metrics = _extract_metrics(label)
    targets = _targets_for_profile(profile)
    facts = _summarize_profile_facts(profile)
    
    lines = []
    lines.append("**PHÂN TÍCH SỨC KHỎE CHI TIẾT**")
    lines.append("")
    
    # 1. Trả lời nhanh
    lines.append("**Trả lời nhanh**")
    health_level = _health_level(_score_item({"nutrition_100g": metrics}, profile)[0])
    lines.append(f"- Đánh giá tổng quan: **{health_level}**")
    lines.append("")
    
    # 2. Lợi ích sức khỏe
    lines.append("**Lợi ích sức khỏe**")
    benefits = []
    if metrics.get("protein_g") and metrics["protein_g"] >= 6:
        benefits.append(f"- Protein cao ({metrics['protein_g']}g/khẩu phần) hỗ trợ phát triển cơ bắp")
    if metrics.get("fiber_g") and metrics["fiber_g"] >= 3:
        benefits.append(f"- Chất xơ tốt ({metrics['fiber_g']}g/khẩu phần) hỗ trợ tiêu hóa")
    if metrics.get("sugars_g") and metrics["sugars_g"] <= 5:
        benefits.append(f"- Đường thấp ({metrics['sugars_g']}g/khẩu phần) tốt cho kiểm soát đường huyết")
    if metrics.get("sodium_mg") and metrics["sodium_mg"] <= 200:
        benefits.append(f"- Natri thấp ({metrics['sodium_mg']}mg/khẩu phần) tốt cho tim mạch")
    
    if benefits:
        lines.extend(benefits)
    else:
        lines.append("- Cần xem xét các thành phần dinh dưỡng cụ thể")
    lines.append("")
    
    # 3. Phân tích thành phần chi tiết
    lines.append("**Phân tích thành phần chi tiết**")
    ingredients = label.get("ingredients", [])
    if ingredients:
        lines.append("- Thành phần chính:")
        for ing in ingredients[:5]:  # Top 5 ingredients
            name = ing.get("name", "?")
            pct = f" ({ing.get('percentage')}%)" if ing.get("percentage") else ""
            allerg = " [DỊ ỨNG]" if ing.get("is_allergen") else ""
            lines.append(f"  • {name}{pct}{allerg}")
        
        # Phân tích phụ gia
        additives_count = metrics.get("additives_count", 0)
        if additives_count > 0:
            lines.append(f"- Phụ gia: {additives_count} loại")
            if additives_count <= targets.get("additives_max", 4):
                lines.append(f"  • Mức độ: Chấp nhận được (≤{targets.get('additives_max', 4)})")
            else:
                lines.append(f"  • Mức độ: Nhiều (> {targets.get('additives_max', 4)})")
        
        # Trans fat
        if metrics.get("transfat_flag"):
            lines.append("- Trans fat: **CÓ** - Cần tránh")
        else:
            lines.append("- Trans fat: Không phát hiện")
    else:
        lines.append("- Thông tin thành phần không đầy đủ")
    lines.append("")
    
    # 4. Phân tích dinh dưỡng chi tiết
    lines.append("**Phân tích dinh dưỡng chi tiết**")
    lines.append("- So sánh với nhu cầu cá nhân:")
    
    # Đường
    sugar = metrics.get("sugars_g")
    sugar_target = targets.get("sugar_good_g", 8)
    if sugar is not None:
        if sugar <= sugar_target:
            lines.append(f"  • Đường: {sugar}g (≤{sugar_target}g) ✅ Tốt")
        elif sugar <= targets.get("sugar_high_g", 12):
            lines.append(f"  • Đường: {sugar}g ({sugar_target}-{targets.get('sugar_high_g', 12)}g) ⚠️ Trung bình")
        else:
            lines.append(f"  • Đường: {sugar}g (>{targets.get('sugar_high_g', 12)}g) ❌ Cao")
    
    # Natri
    sodium = metrics.get("sodium_mg")
    sodium_target = targets.get("sodium_good_mg", 400)
    if sodium is not None:
        if sodium <= sodium_target:
            lines.append(f"  • Natri: {sodium}mg (≤{sodium_target}mg) ✅ Tốt")
        elif sodium <= targets.get("sodium_high_mg", 600):
            lines.append(f"  • Natri: {sodium}mg ({sodium_target}-{targets.get('sodium_high_mg', 600)}mg) ⚠️ Trung bình")
        else:
            lines.append(f"  • Natri: {sodium}mg (>{targets.get('sodium_high_mg', 600)}mg) ❌ Cao")
    
    # Protein
    protein = metrics.get("protein_g")
    protein_target = targets.get("protein_min_g", 6)
    if protein is not None:
        if protein >= protein_target:
            lines.append(f"  • Protein: {protein}g (≥{protein_target}g) ✅ Tốt")
        else:
            lines.append(f"  • Protein: {protein}g (<{protein_target}g) ⚠️ Thấp")
    
    # Chất xơ
    fiber = metrics.get("fiber_g")
    fiber_target = targets.get("fiber_min_g", 3)
    if fiber is not None:
        if fiber >= fiber_target:
            lines.append(f"  • Chất xơ: {fiber}g (≥{fiber_target}g) ✅ Tốt")
        else:
            lines.append(f"  • Chất xơ: {fiber}g (<{fiber_target}g) ⚠️ Thấp")
    lines.append("")
    
    # 5. Khuyến nghị sức khỏe
    lines.append("**Khuyến nghị sức khỏe**")
    health_score, reasons = _score_item({"nutrition_100g": metrics}, profile)
    
    if health_score >= 5.0:
        lines.append("- **Phù hợp**: Có thể sử dụng thường xuyên")
        lines.append("- Tần suất: Hàng ngày")
    elif health_score >= 3.0:
        lines.append("- **Cần cân nhắc**: Sử dụng có kiểm soát")
        lines.append("- Tần suất: ≤ 3 lần/tuần")
    elif health_score >= 1.0:
        lines.append("- **Hạn chế**: Chỉ dùng thỉnh thoảng")
        lines.append("- Tần suất: ≤ 1-2 lần/tuần")
    else:
        lines.append("- **Tránh**: Không nên sử dụng")
        lines.append("- Tần suất: Không dùng")
    
    if reasons:
        lines.append("- Lý do đánh giá:")
        for reason in reasons:
            lines.append(f"  • {reason}")
    lines.append("")
    
    # 6. Tiêu chí chọn tốt hơn
    lines.append("**Tiêu chí chọn tốt hơn**")
    lines.append("- Đường: ≤ 5g/khẩu phần")
    lines.append("- Natri: ≤ 200-400mg/khẩu phần")
    lines.append("- Bão hòa: ≤ 2-3g/khẩu phần")
    lines.append("- Protein: ≥ 6-10g/khẩu phần")
    lines.append("- Chất xơ: ≥ 3-5g/khẩu phần")
    lines.append("- Phụ gia: ≤ 2-4 loại")
    lines.append("- Không có trans fat")
    
    return "\n".join(lines)

# --- intent detector ---
_PROF_RE = re.compile(r"\b(xem|hiển\s*thị|mở|cho\s*tôi\s*xem)\b.*\b(hồ\s*sơ|profile)\b", re.I)
_ING_RE  = re.compile(r"\b(xem|hiển\s*thị|mở)\b.*\b(thành\s*phần|ingredients?|nhãn|label)\b", re.I)
_NUT_RE  = re.compile(r"\b(xem|hiển\s*thị|mở)\b.*\b(giá\s*trị\s*dinh\s*dưỡng|nutrition)\b", re.I)
_RECO_RE = re.compile(r"\b(đề\s*xuất|gợi\s*ý|thay\s*thế|tốt\s*hơn|sản\s*phẩm\s*thay\s*thế|bổ\s*sung\s*sản\s*phẩm)\b", re.I)
_DETAIL_RE = re.compile(r"\b(phân\s*tích\s*chi\s*tiết|phân\s*tích\s*đầy\s*đủ|đánh\s*giá\s*chi\s*tiết|lợi\s*ích\s*sức\s*khỏe|khuyến\s*nghị\s*sức\s*khỏe)\b", re.I)

def _detect_intent(msg: str):
    t = (msg or "").lower().strip()
    if not t: return None
    if _PROF_RE.search(t): return "SHOW_PROFILE"
    if _ING_RE.search(t):  return "SHOW_INGREDIENTS"
    if _NUT_RE.search(t):  return "SHOW_NUTRITION"
    if _RECO_RE.search(t): return "RECOMMEND"
    if _DETAIL_RE.search(t): return "SHOW_DETAILED_ANALYSIS"
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

def _off_extract_nutrition(n: dict):
    def _num(x):
        try:
            return float(str(x).replace(",", "."))
        except Exception:
            return None
    def get(key):
        for k in (f"{key}_100g", key, f"{key}-100g", f"{key}_value"):
            if k in n and n[k] is not None:
                return _num(n[k])
        return None

    sugars = get("sugars")
    salt   = get("salt")
    sodium = get("sodium")
    prot   = get("proteins")
    satfat = get("saturated-fat")
    kcal   = get("energy-kcal")
    fiber  = get("fiber")
    carbs  = get("carbohydrates")
    fat    = get("fat")

    if sodium is None and salt is not None:
        sodium = salt * 0.393  # g Na ≈ g muối * 0.393

    return {
        "sugars_g": sugars,
        "carbs_g": carbs,
        "sodium_g": sodium,
        "salt_g": salt,
        "satfat_g": satfat,
        "protein_g": prot,
        "fat_g": fat,
        "fiber_g": fiber,
        "energy_kcal": kcal,
    }

def _pick_image(it: dict):
    img = it.get("image_url") or it.get("image_front_url") or it.get("image_nutrition_url")
    if not img:
        sel = it.get("selected_images") or {}
        front = sel.get("front") or {}
        img = front.get("display") or front.get("small") or front.get("thumb")
    return img

def _pick_category_value(it: dict):
    cat = (it.get("category") or "").strip()
    if not cat:
        tags = it.get("categories_tags") or []
        if tags:
            last = str(tags[-1])
            cat = last.split(":", 1)[-1]
    return (cat or "").lower().strip()

def _load_catalog_off_format(raw_list):
    out = []
    for it in raw_list:
        if not isinstance(it, dict):
            continue
        name  = (it.get("name")  or "").strip()
        brand = (it.get("brand") or "").strip()
        if not (name or brand):
            continue
        norm = _off_extract_nutrition(it.get("nutrition") or {})
        if sum(v is not None for v in norm.values()) < 3:
            continue
        out.append({
            "barcode": it.get("barcode"),        # giữ nội bộ
            "name": name,
            "brand": brand,
            "category": _pick_category_value(it),
            "countries": [str(x).split(":")[-1] for x in (it.get("countries_tags") or [])],
            "allergens": it.get("allergens") or [],
            "additives": it.get("additives") or [],
            "nutrition_100g": norm,
            "image": _pick_image(it),
        })
    print(f"[INFO] Catalog(OFF) loaded: {len(out)} items")
    return out

def _load_catalog_old_format(raw_list):
    out = []
    for it in raw_list:
        if not it or not isinstance(it, dict):
            continue
        if it.get("eligible") is False:
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
            "nutrition_100g": norm,
            "image": it.get("image"),
        })
    print(f"[INFO] Catalog(old) loaded: {len(out)} items")
    return out

def _load_catalog(path: str):
    p = Path(path)
    if not p.exists():
        print(f"[WARN] Catalog not found at {p.resolve()}")
        return []
    raw = json.loads(p.read_text("utf-8"))

    if isinstance(raw, list) and raw:
        looks_old = isinstance(raw[0], dict) and ("nutrition_100g" in raw[0] or "eligible" in raw[0])
        if looks_old:
            return _load_catalog_old_format(raw)
        return _load_catalog_off_format(raw)

    print("[WARN] Catalog file is not a list. Empty catalog returned.")
    return []

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

# ==== Nutri-Score (đơn giản hoá, thực phẩm & đồ uống) ====
def _ns_points_negative_food(nut):
    energy_kj = (nut.get("energy_kcal") or 0.0) * 4.184
    sugars = nut.get("sugars_g") or 0.0
    satfat = nut.get("satfat_g") or 0.0
    sodium_mg = (nut.get("sodium_g") or 0.0) * 1000.0

    def p_energy(kj):
        steps = [335,670,1005,1340,1675,2010,2345,2680,3015,3350]
        for i,t in enumerate(steps,1):
            if kj<=t: return i
        return 10
    def p_sugars(g):
        steps = [4.5,9,13.5,18,22.5,27,31,36,40,45]
        for i,t in enumerate(steps,1):
            if g<=t: return i
        return 10
    def p_sat(g):
        steps = [1,2,3,4,5,6,7,8,9,10]
        for i,t in enumerate(steps,1):
            if g<=t: return i
        return 10
    def p_sodium(mg):
        steps = [90,180,270,360,450,540,630,720,810,900]
        for i,t in enumerate(steps,1):
            if mg<=t: return i
        return 10

    return p_energy(energy_kj) + p_sugars(sugars) + p_sat(satfat) + p_sodium(sodium_mg)

def _ns_points_positive_food(nut):
    fiber = nut.get("fiber_g") or 0.0
    protein = nut.get("protein_g") or 0.0
    fvn_points = 0
    def p_fiber(g):
        steps = [0.9,1.9,2.8,3.7,4.7]
        for i,t in enumerate(steps,1):
            if g>t: continue
            return i-1
        return 5
    def p_protein(g):
        steps = [1.6,3.2,4.8,6.4,8.0]
        for i,t in enumerate(steps,1):
            if g<=t: return i
        return 5
    return fvn_points + p_fiber(fiber) + p_protein(protein), p_fiber(fiber), p_protein(protein), fvn_points

def _nutriscore_grade(total_points, is_beverage=False):
    if is_beverage:
        if total_points <= 1: return "B"
        if total_points <= 5: return "C"
        if total_points <= 9: return "D"
        return "E"
    else:
        if total_points <= -1: return "A"
        if total_points <= 2:  return "B"
        if total_points <= 10: return "C"
        if total_points <= 18: return "D"
        return "E"

def _nutriscore(nut, is_beverage=False):
    neg = _ns_points_negative_food(nut)
    pos, pfiber, pprot, pfvn = _ns_points_positive_food(nut)
    effective_pos = pfvn + pfiber + (0 if (neg >= 11 and pfvn < 5) else pprot)
    total = neg - effective_pos
    grade = _nutriscore_grade(total, is_beverage=is_beverage)
    return {"points": int(round(total)), "grade": grade,
            "breakdown": {"neg": neg, "pos": effective_pos, "pfiber": pfiber, "pprotein": pprot, "pfvn": pfvn}}

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

def _health_level(score: float) -> str:
    if score >= 5.0: return "Phù hợp"
    if score >= 3.0: return "Cần cân nhắc"
    if score >= 1.0: return "Hạn chế"
    return "Tránh"

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
        ns = _nutriscore(it["nutrition_100g"], is_beverage=(_bucket_of(it["category"])=="beverage"))
        scored.append((s, reasons, ns, it))
    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:max(1, int(k))]

    out = []
    for (s, reasons, ns, it) in top:
        n = it["nutrition_100g"]
        out.append({
            "name": it.get("name"),
            "brand": it.get("brand"),
            "barcode": it.get("barcode"),  # giữ nội bộ
            "category": it.get("category"),
            "image": it.get("image"),       # <<< thêm ảnh vào JSON
            "health_score": round(float(s), 2),
            "health_level": _health_level(s),
            "reasons": reasons,
            "nutriscore": {"grade": ns["grade"], "points": ns["points"]},
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

# ==== API: /_health ====
@app.get("/_health")
def _health():
    return jsonify(ok=True, version=APP_VERSION,
                   catalog=len(CATALOG), stores=len(STORES),
                   catalog_path=CATALOG_PATH,
                   asr_upstream=ASR_UPSTREAM,   # <-- thêm dòng này
                   routes=sorted(str(r) for r in app.url_map.iter_rules()))

# ==== Authentication API Routes ====

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test MongoDB connection
        client.admin.command('ping')
        return jsonify({
            'success': True,
            'message': 'Server is healthy',
            'database': 'connected',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Database connection failed: {e}'
        }), 500

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Thiếu trường bắt buộc: {field}'
                }), 400
        
        # Validate email format
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, data['email']):
            return jsonify({
                'success': False,
                'error': 'Email không hợp lệ'
            }), 400
        
        # Validate password length
        if len(data['password']) < 6:
            return jsonify({
                'success': False,
                'error': 'Mật khẩu phải có ít nhất 6 ký tự'
            }), 400
        
        # Create user
        result = create_user(data)
        
        if result['success']:
            return jsonify({
                'success': True,
                'user': result['user'],
                'message': 'Đăng ký thành công!'
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        print(f"[ERROR] Register endpoint failed: {e}")
        return jsonify({
            'success': False,
            'error': 'Có lỗi xảy ra khi đăng ký'
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('username') or not data.get('password'):
            return jsonify({
                'success': False,
                'error': 'Vui lòng nhập đầy đủ thông tin đăng nhập'
            }), 400
        
        # Authenticate user
        result = authenticate_user(data['username'], data['password'])
        
        if result['success']:
            return jsonify({
                'success': True,
                'user': result['user'],
                'token': result['token'],
                'message': 'Đăng nhập thành công!'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 401
            
    except Exception as e:
        print(f"[ERROR] Login endpoint failed: {e}")
        return jsonify({
            'success': False,
            'error': 'Có lỗi xảy ra khi đăng nhập'
        }), 500

@app.route('/api/auth/verify', methods=['GET'])
@token_required
def verify(token_data):
    """Verify JWT token"""
    try:
        user_result = get_user_by_id(token_data['user_id'])
        
        if user_result['success']:
            return jsonify({
                'success': True,
                'user': user_result['user']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': user_result['error']
            }), 401
            
    except Exception as e:
        print(f"[ERROR] Verify endpoint failed: {e}")
        return jsonify({
            'success': False,
            'error': 'Có lỗi xảy ra khi xác thực'
        }), 500

@app.route('/api/auth/users/<user_id>', methods=['PUT'])
@token_required
def update_user_endpoint(token_data, user_id):
    """Update user information"""
    try:
        # Check if user can update this profile
        if token_data['user_id'] != user_id and token_data['role'] != 'admin':
            return jsonify({
                'success': False,
                'error': 'Không có quyền cập nhật thông tin này'
            }), 403
        
        data = request.get_json()
        result = update_user(user_id, data)
        
        if result['success']:
            return jsonify({
                'success': True,
                'user': result['user'],
                'message': 'Cập nhật thành công!'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        print(f"[ERROR] Update user endpoint failed: {e}")
        return jsonify({
            'success': False,
            'error': 'Có lỗi xảy ra khi cập nhật'
        }), 500

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(token_data):
    """User logout (client-side token removal)"""
    return jsonify({
        'success': True,
        'message': 'Đăng xuất thành công!'
    }), 200

@app.route('/api/auth/create-admin', methods=['POST'])
def create_admin():
    """Create admin account (one-time setup)"""
    try:
        result = create_admin_account()
        
        if result['success']:
            return jsonify({
                'success': True,
                'user': result['user'],
                'message': 'Tài khoản admin đã được tạo thành công!'
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        print(f"[ERROR] Create admin endpoint failed: {e}")
        return jsonify({
            'success': False,
            'error': 'Có lỗi xảy ra khi tạo admin'
        }), 500

# ==== Health Profile API Routes ====

@app.route('/api/health-profiles/<user_id>', methods=['GET'])
@token_required
def get_health_profiles(token_data, user_id):
    """Get user's health profile (single profile per user)"""
    try:
        # Check if user can access this profile
        if token_data['user_id'] != user_id and token_data['role'] != 'admin':
            return jsonify({
                'success': False,
                'error': 'Không có quyền truy cập hồ sơ này'
            }), 403
        
        # Find health profile for this user
        health_profile = health_profiles_collection.find_one({'user_id': ObjectId(user_id)})
        
        if health_profile:
            # Convert ObjectId to string for JSON serialization
            health_profile['_id'] = str(health_profile['_id'])
            health_profile['user_id'] = str(health_profile['user_id'])
            
            return jsonify({
                'success': True,
                'health_profile': health_profile,
                'has_profile': True
            }), 200
        else:
            return jsonify({
                'success': True,
                'health_profile': None,
                'has_profile': False
            }), 200
            
    except Exception as e:
        print(f"[ERROR] Get health profile failed: {e}")
        return jsonify({
            'success': False,
            'error': 'Có lỗi xảy ra khi lấy hồ sơ sức khỏe'
        }), 500

@app.route('/api/health-profiles/<user_id>', methods=['POST'])
@token_required
def create_health_profile(token_data, user_id):
    """Create new health profile for user"""
    try:
        # Check if user can create profile
        if token_data['user_id'] != user_id and token_data['role'] != 'admin':
            return jsonify({
                'success': False,
                'error': 'Không có quyền tạo hồ sơ này'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Thiếu dữ liệu hồ sơ sức khỏe'
            }), 400
        
        # Check if user exists
        user_result = get_user_by_id(user_id)
        if not user_result['success']:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Check if profile already exists
        existing_profile = health_profiles_collection.find_one({'user_id': ObjectId(user_id)})
        
        if existing_profile:
            # Update existing profile
            profile_id = str(existing_profile['_id'])
            update_data = {
                'name': data.get('name', 'Hồ sơ chính'),
                'basic': data.get('basic', {}),
                'conditions': data.get('conditions', {}),
                'allergies': data.get('allergies', []),
                'goals': data.get('goals', {}),
                'contact': data.get('contact', {}),
                'medical': data.get('medical', {}),
                'updatedAt': datetime.utcnow()
            }
            
            result = health_profiles_collection.update_one(
                {'_id': existing_profile['_id']},
                {'$set': update_data}
            )
            
            if result.modified_count > 0:
                # Get updated profile
                updated_profile = health_profiles_collection.find_one({'_id': existing_profile['_id']})
                updated_profile['_id'] = str(updated_profile['_id'])
                updated_profile['user_id'] = str(updated_profile['user_id'])
                
                return jsonify({
                    'success': True,
                    'health_profile': updated_profile,
                    'message': 'Cập nhật hồ sơ sức khỏe thành công!'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': 'Không thể cập nhật hồ sơ sức khỏe'
                }), 500
        else:
            # Create new profile
            profile_id = ObjectId()
            health_profile = {
                '_id': profile_id,
                'user_id': ObjectId(user_id),
                'name': data.get('name', 'Hồ sơ chính'),
                'basic': data.get('basic', {}),
                'conditions': data.get('conditions', {}),
                'allergies': data.get('allergies', []),
                'goals': data.get('goals', {}),
                'contact': data.get('contact', {}),
                'medical': data.get('medical', {}),
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow(),
                'isActive': True
            }
            
            # Insert into health_profiles collection
            result = health_profiles_collection.insert_one(health_profile)
            
            if result.inserted_id:
                # Convert ObjectId to string for JSON response
                health_profile['_id'] = str(health_profile['_id'])
                health_profile['user_id'] = str(health_profile['user_id'])
                
                return jsonify({
                    'success': True,
                    'health_profile': health_profile,
                    'message': 'Tạo hồ sơ sức khỏe thành công!'
                }), 201
            else:
                return jsonify({
                    'success': False,
                    'error': 'Không thể tạo hồ sơ sức khỏe'
                }), 500
        
    except Exception as e:
        print(f"[ERROR] Create health profile failed: {e}")
        return jsonify({
            'success': False,
            'error': 'Có lỗi xảy ra khi tạo hồ sơ sức khỏe'
        }), 500

@app.route('/api/health-profiles/<user_id>/<profile_id>', methods=['PUT'])
@token_required
def update_health_profile(token_data, user_id, profile_id):
    """Update health profile"""
    try:
        # Check if user can update profile
        if token_data['user_id'] != user_id and token_data['role'] != 'admin':
            return jsonify({
                'success': False,
                'error': 'Không có quyền cập nhật hồ sơ này'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Thiếu dữ liệu cập nhật'
            }), 400
        
        # Update health profile
        update_data = {
            'health_profiles.$.name': data.get('name'),
            'health_profiles.$.basic': data.get('basic', {}),
            'health_profiles.$.conditions': data.get('conditions', {}),
            'health_profiles.$.allergies': data.get('allergies', []),
            'health_profiles.$.goals': data.get('goals', {}),
            'health_profiles.$.updatedAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        result = users_collection.update_one(
            {'_id': ObjectId(user_id), 'health_profiles.id': profile_id},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'Hồ sơ không tìm thấy'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Cập nhật hồ sơ sức khỏe thành công!'
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Update health profile failed: {e}")
        return jsonify({
            'success': False,
            'error': 'Có lỗi xảy ra khi cập nhật hồ sơ sức khỏe'
        }), 500

@app.route('/api/health-profiles/<user_id>/<profile_id>/set-current', methods=['POST'])
@token_required
def set_current_health_profile(token_data, user_id, profile_id):
    """Set current health profile"""
    try:
        # Check if user can set profile
        if token_data['user_id'] != user_id and token_data['role'] != 'admin':
            return jsonify({
                'success': False,
                'error': 'Không có quyền thiết lập hồ sơ này'
            }), 403
        
        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$set': {
                    'current_health_profile': profile_id,
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Đã thiết lập hồ sơ hiện tại!'
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Set current health profile failed: {e}")
        return jsonify({
            'success': False,
            'error': 'Có lỗi xảy ra khi thiết lập hồ sơ'
        }), 500

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
        return jsonify(ok=False, error="Xin lỗi, có lỗi khi xử lý:\nGemini error: {0}\n{1}".format(type(e).__name__, str(e))), 502
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

    metrics = _extract_metrics(label)
    targets = _targets_for_profile(profile)
    facts   = _summarize_profile_facts(profile)

    system = (
        "Bạn là chuyên gia dinh dưỡng lâm sàng. Luôn dùng CON SỐ cụ thể, "
        "không dùng từ mơ hồ như 'nhiều/ít/có thể'. "
        "Phân loại theo 4 mức: Phù hợp / Cần cân nhắc / Hạn chế / Tránh, dựa NGƯỠNG SỐ đã cấp. "
        "Mỗi 'thấp/vừa/cao' phải kèm ngưỡng ≤, x–y, ≥. "
        "CẤU TRÚC BẮT BUỘC:\n"
        "1. **Trả lời nhanh** - Đánh giá tổng quan (1-2 câu)\n"
        "2. **Lợi ích sức khỏe** - Những điểm tích cực của sản phẩm\n"
        "3. **Phân tích thành phần chi tiết** - Từng thành phần và tác động\n"
        "4. **Phân tích dinh dưỡng chi tiết** - So sánh với nhu cầu cá nhân\n"
        "5. **Khuyến nghị sức khỏe** - Hướng dẫn sử dụng cụ thể\n"
        "6. **Tiêu chí chọn tốt hơn** - Gợi ý cải thiện"
    )

    user = (
        f"HỒ SƠ CHUẨN HOÁ: {facts}\n\n"
        f"SỐ LIỆU TỪ NHÃN (mỗi khẩu phần) — JSON: {json.dumps(metrics, ensure_ascii=False)}\n"
        f"NGƯỠNG CHO HỒ SƠ NÀY — JSON: {json.dumps(targets, ensure_ascii=False)}\n\n"
        "YÊU CẦU:\n"
        "- So sánh từng chỉ tiêu (đường, natri, bão hoà, protein, chất xơ, phụ gia) với ngưỡng.\n"
        "- Với protein/chất xơ: nêu rõ dải 6–10 g = vừa, ≥10 g = tốt (nếu mục tiêu liên quan).\n"
        "- Phụ gia: ghi rõ số đếm và ngưỡng 'ít phụ gia' = ≤ {add_max}; 'nhiều' = > {add_max}.\n"
        "- Nếu transfat_flag=true → mức **Tránh**.\n"
        "- Tần suất theo mức: Phù hợp (dùng thường xuyên), Cần cân nhắc (≤ 3 lần/tuần), Hạn chế (≤ 1–2 lần/tuần), Tránh (không dùng)."
    ).format(add_max=targets["additives_max"])

    try:
        result = call_gemini_with_backoff(LLM_MODEL, [{"text": system}, {"text": user}])
        md = _normalize_md((result.text or "").strip())
    except Exception as e:
        return jsonify(ok=False, error="Xin lỗi, có lỗi khi xử lý:\nGemini error: {0}\n{1}".format(type(e).__name__, str(e))), 502

    return jsonify(ok=True, advice_markdown=md, metrics=metrics, targets=targets)

# ==== API: /detailed-analysis ====
@app.route("/detailed-analysis", methods=["POST","OPTIONS"])
def detailed_analysis():
    if request.method == "OPTIONS":
        return ("", 204)

    body = request.get_json(silent=True) or {}
    profile = body.get("profile")
    label = body.get("label")
    if not profile or not label:
        return jsonify(ok=False, error="Missing profile or label"), 400

    try:
        detailed_analysis_md = _render_detailed_health_analysis(label, profile)
        metrics = _extract_metrics(label)
        targets = _targets_for_profile(profile)
        
        return jsonify(
            ok=True, 
            detailed_analysis_markdown=detailed_analysis_md,
            metrics=metrics, 
            targets=targets
        )
    except Exception as e:
        return jsonify(ok=False, error=f"Có lỗi xảy ra khi phân tích chi tiết: {e}"), 500

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
Bạn là HealthScan AI – chuyên gia dinh dưỡng lâm sàng & "coach" mua sắm siêu thị.
Mục tiêu: trả lời CHÍNH XÁC câu hỏi, dựa hồ sơ & nhãn, KHÔNG bịa.

PHONG CÁCH & ĐỊNH DẠNG
- Ngôn ngữ: tiếng Việt, giọng ấm áp.
- Không dùng heading '#', bullet '*'. Dùng tiêu đề in đậm, '-' hoặc 1., 2.
- Luôn mở đầu bằng **Trả lời nhanh** (1–2 câu).
- LUÔN LƯỢNG HOÁ: thay "thấp/vừa/cao" bằng số cụ thể dạng ≤, x–y, ≥.
- Nếu dữ liệu thiếu, nói rõ "không có trong nhãn/hồ sơ".

CẤU TRÚC PHÂN TÍCH CHI TIẾT
Khi phân tích sản phẩm, LUÔN bao gồm các phần sau theo thứ tự:

1. **Trả lời nhanh** - Đánh giá tổng quan (1-2 câu)
2. **Lợi ích sức khỏe** - Những điểm tích cực của sản phẩm
3. **Phân tích thành phần chi tiết** - Từng thành phần và tác động
4. **Phân tích dinh dưỡng chi tiết** - So sánh với nhu cầu cá nhân
5. **Khuyến nghị sức khỏe** - Hướng dẫn sử dụng cụ thể
6. **Tiêu chí chọn tốt hơn** - Gợi ý cải thiện

ĐÁNH GIÁ SẢN PHẨM (4 mức)
1) Phù hợp — đáp ứng mục tiêu, không vượt ngưỡng cảnh báo.
2) Cần cân nhắc — chạm/nhỉnh ngưỡng: hướng dẫn khẩu phần & tần suất.
3) Hạn chế — bất lợi rõ (đường/natri/bão hoà…), chỉ dùng thỉnh thoảng (≤ 1–2 lần/tuần).
4) Tránh — có dị ứng/trans fat/vượt ngưỡng cảnh báo cao.

CÁ NHÂN HÓA
- Dị ứng: chỉ cảnh báo khi hồ sơ có.
- Ưu tiên chỉ tiêu liên quan (tiểu đường ↔ đường; huyết áp ↔ natri; tim mạch ↔ bão hoà/trans; tăng cơ ↔ protein; tiêu hoá/giảm cân ↔ chất xơ & phụ gia).

GỢI Ý TỐT HƠN
- 'Tiêu chí chọn tốt hơn' bằng con số (đường ≤5 g/khẩu phần; natri ≤200–400 mg; bão hoà ≤2–3 g; không trans fat; phụ gia ≤2–4; protein ≥6–10 g; chất xơ ≥3–5 g).
- Khi người dùng bấm **Sản phẩm thay thế** hoặc nói **Bổ sung sản phẩm thay thế**: luôn hiển thị theo thứ tự từ phù hợp nhất trở xuống; 5 sản phẩm mỗi lần.
"""

def _format_history_for_prompt(hist):
    lines = []
    for h in hist[-MAX_TURNS:]:
        who = "Người dùng" if h["role"] == "user" else "Assistant"
        lines.append(f"{who}: {h['text']}")
    return "\n".join(lines)

# Bộ nhớ phân trang đề xuất theo chat_id
RECO_STATE = {}  # chat_id -> {"index": int, "items": list_cached}

def _format_reco_items(items):
    rows = []
    for i, it in enumerate(items, 1):
        m = it["n_100g"]
        store_txt = ", ".join(f"{s['store']} ({s['district']})" for s in (it.get("stores") or [])) or "—"
        title = f"{i}. **{it['name']}** — {it.get('brand') or 'N/A'}"  # (ẩn barcode)
        rows += [
            title,
            f"   - Điểm sức khỏe (cá nhân hoá): **{it['health_score']} / {HEALTH_SCORE_MAX}** — {it['health_level']}",
            f"   - Nutri-Score (tham khảo): {it['nutriscore']['grade']} (điểm {it['nutriscore']['points']})",
            f"   - Dinh dưỡng/100g: đường {m['sugars_g'] if m['sugars_g'] is not None else '-'} g; natri {m['sodium_mg'] if m['sodium_mg'] is not None else '-'} mg; bão hoà {m['satfat_g'] if m['satfat_g'] is not None else '-'} g; protein {m['protein_g'] if m['protein_g'] is not None else '-'} g; {m['kcal'] if m['kcal'] is not None else '-'} kcal",
            f"   - Lý do: {', '.join(it['reasons']) or '—'}",
            f"   - Có thể tìm tại (Hà Nội): {store_txt}"
        ]
        if it.get("image"):
            rows.append(f"   \n   ![]({it['image']})")  # ảnh minh hoạ
    return rows

@app.route("/asr", methods=["POST", "OPTIONS"])
def asr_proxy():
    if request.method == "OPTIONS":
        return ("", 204)

    if not ASR_UPSTREAM:
        return jsonify(ok=False, error="ASR_URL is not configured on server (.env)"), 503

    # Nhận multipart (field: file | audio | voice) hoặc base64 (audio_base64, file_base64)
    if request.content_type and "multipart/form-data" in request.content_type:
        f = (request.files.get("file")
             or request.files.get("audio")
             or request.files.get("voice"))
        if not f or f.filename == "":
            return jsonify(ok=False, error="missing 'file' field"), 400
        files = {"file": (f.filename, f.stream, f.mimetype or "audio/m4a")}
        data = None
    else:
        data = request.get_json(silent=True) or {}
        b64 = data.get("audio_base64") or data.get("file_base64") or ""
        if not b64:
            return jsonify(ok=False, error="missing audio data"), 400
        if b64.startswith("data:"):
            b64 = b64.split(",", 1)[1]
        raw = base64.b64decode(b64, validate=True)
        files = {"file": ("upload.m4a", io.BytesIO(raw), "audio/m4a")}

    try:
        r = requests.post(ASR_UPSTREAM, files=files, json=data if files is None else None, timeout=60)
        ct = r.headers.get("content-type", "")
        if "application/json" in ct:
            js = r.json()
            text = js.get("text") or js.get("transcript") or js.get("result") or ""
        else:
            text = r.text or ""

        if not r.ok:
            return jsonify(ok=False, status=r.status_code, error=text[:1000]), r.status_code

        return jsonify(ok=True, text=text)
    except Exception as e:
        return jsonify(ok=False, error=f"ASR proxy error: {e}"), 502


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
        RECO_STATE.pop(chat_id, None)

    CHAT_HIST[chat_id].append({"role": "user", "text": message, "ts": datetime.utcnow().isoformat()})

    intent = _detect_intent(message)
    built_in_reply = None

    if intent == "SHOW_PROFILE":
        built_in_reply = _render_profile_md(profile)
    elif intent == "SHOW_INGREDIENTS":
        built_in_reply = _render_ingredients_md(label)
    elif intent == "SHOW_NUTRITION":
        built_in_reply = _render_nutrition_md(label)
    elif intent == "SHOW_DETAILED_ANALYSIS":
        built_in_reply = _render_detailed_health_analysis(label, profile)
    elif intent == "RECOMMEND":
        state = RECO_STATE.get(chat_id)
        if not state:
            rec = _recommend_core(profile, label, k=50)
            if not rec.get("ok"):
                built_in_reply = "Xin lỗi, catalog chưa sẵn sàng để đề xuất."
            else:
                RECO_STATE[chat_id] = {"index": 0, "items": rec["items"], "cat": rec["category_guess"]}
                state = RECO_STATE[chat_id]

        if state:
            start = state["index"]
            end = min(start + 5, len(state["items"]))
            batch = state["items"][start:end]
            state["index"] = end
            rows = []
            rows.append("**Trả lời nhanh**: Dưới đây là các sản phẩm thay thế xếp từ phù hợp nhất trở xuống.")
            rows.append(f"- Nhóm danh mục: {state.get('cat','—')}")
            rows.append("")
            rows += _format_reco_items(batch)
            if end < len(state["items"]):
                rows.append("")
                rows.append("- Nhập “Bổ sung sản phẩm thay thế” để xem thêm 5 lựa chọn tiếp theo.")
            built_in_reply = "\n".join(rows)

    if built_in_reply:
        reply = _normalize_md(built_in_reply)
        CHAT_HIST[chat_id].append({"role": "assistant", "text": reply, "ts": datetime.utcnow().isoformat()})
        chat_dump = {"chat_id": chat_id, "updated_at": datetime.utcnow().isoformat(),
                     "history": CHAT_HIST[chat_id][-MAX_TURNS:]}
        with open(OUT_DIR / f"chat_{chat_id}.json", "w", encoding="utf-8") as fp:
            json.dump(chat_dump, fp, ensure_ascii=False, indent=2)
        return jsonify(ok=True, chat_id=chat_id, reply_markdown=reply)

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
        return jsonify(ok=False, error="Xin lỗi, có lỗi khi xử lý:\nGemini error: {0}\n{1}".format(type(e).__name__, str(e))), 502

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
    print(f"[INFO] Using catalog: {CATALOG_PATH}")
    print(f"[INFO] MongoDB URI: {MONGODB_URI}")
    print(f"[INFO] Database: {DATABASE_NAME}")
    print(f"[INFO] JWT Secret: {'*' * len(JWT_SECRET)}")
    print(f"[INFO] Authentication APIs available at: /api/auth/")
    
    # Fix for Windows socket error
    import threading
    import webbrowser
    from werkzeug.serving import make_server
    
    def open_browser():
        time.sleep(1.5)
        webbrowser.open(f'http://localhost:{PORT}')
    
    # Start browser in a separate thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Use Werkzeug server instead of Flask's built-in server for better Windows compatibility
    try:
        server = make_server('0.0.0.0', PORT, app, threaded=True)
        print(f"[INFO] Server starting on http://0.0.0.0:{PORT}")
        print(f"[INFO] Press Ctrl+C to stop the server")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Server stopped by user")
    except Exception as e:
        print(f"[ERROR] Server error: {e}")
        # Fallback to Flask's built-in server
        print("[INFO] Falling back to Flask's built-in server...")
        app.run(host="0.0.0.0", port=PORT, debug=False, use_reloader=False)
