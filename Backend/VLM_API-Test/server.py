# -*- coding: utf-8 -*-
import os, io, re, json, base64, mimetypes
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
OUT_DIR = Path(os.getenv("OUT_DIR", "outputs"))
OUT_DIR.mkdir(parents=True, exist_ok=True)

if not API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY in .env")

# ==== Gemini config ====
genai.configure(api_key=API_KEY)
VLM_MODEL = genai.GenerativeModel("gemini-1.5-flash")   # đọc nhãn từ ảnh
LLM_MODEL = genai.GenerativeModel("gemini-1.5-flash")     # tư vấn/llm tổng quát → reasoning tốt hơn

app = Flask(__name__)
# CORS
ALLOWED = [
    "http://localhost:8081", "http://127.0.0.1:8081",
    "http://localhost:19006", "http://127.0.0.1:19006",
    "http://localhost:19000", "http://127.0.0.1:19000",
    "http://localhost:3000",  "http://127.0.0.1:3000",
]
CORS(app, resources={
    r"/label/*": {"origins": ALLOWED},
    r"/advice":  {"origins": ALLOWED},
    r"/chat":    {"origins": ALLOWED},
})

# ==== Schema hint ====
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
def _extract_json(text: str) -> dict:
    start = text.find("{")
    end = text.rfind("}")
    candidate = text[start:end+1] if (start != -1 and end != -1 and end > start) else text
    try:
        return json.loads(candidate)
    except Exception:
        m = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
        if m:
            return json.loads(m.group(1))
        raise

def _detect_mime(img_bytes: bytes, fallback: str = "image/jpeg") -> str:
    try:
        im = Image.open(io.BytesIO(img_bytes))
        fmt = (im.format or "").upper()
        mapping = {
            "JPEG": "image/jpeg",
            "JPG":  "image/jpeg",
            "PNG":  "image/png",
            "WEBP": "image/webp",
            "BMP":  "image/bmp",
            "TIFF": "image/tiff",
        }
        return mapping.get(fmt, fallback)
    except Exception:
        return fallback

def _human_text_from_label(label: dict) -> str:
    # dùng cho file txt lưu debug
    lines = []
    lines.append("THÔNG TIN NHÃN TRÍCH XUẤT")
    lines.append(f"Ngôn ngữ: {label.get('language','')}")
    lines.append("")
    lines.append("— THÀNH PHẦN (raw) —")
    lines.append(label.get("ingredients_raw","(không có)"))
    lines.append("")
    lines.append("— THÀNH PHẦN (parse) —")
    for it in label.get("ingredients", []) or []:
        name = it.get("name","?")
        pct = f" ({it.get('percentage')}%)" if it.get("percentage") is not None else ""
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
        name = n.get("name","?")
        amount = n.get("amount","")
        unit = n.get("unit","")
        dv = f" ({n.get('daily_value_percent')})" if n.get("daily_value_percent") else ""
        lines.append(f"- {name}: {amount} {unit}{dv}".strip())
    lines.append("")
    warns = label.get("warnings", []) or []
    lines.append("— CẢNH BÁO —")
    if warns:
        for w in warns: lines.append(f"- {w}")
    else:
        lines.append("-")
    return "\n".join(lines)

# ---------- UI render helpers (tiếng Việt, không dùng #/* cho bullet) ----------
def _bar(value, max_value, width=16):
    try:
        v = float(str(value).replace(",", "."))
        m = float(str(max_value).replace(",", "."))
        ratio = max(0.0, min(1.0, v / m))
    except Exception:
        return ""
    filled = int(round(ratio * width))
    return "█" * filled + "░" * (width - filled)

def _list_join(x):
    if not x: return ""
    if isinstance(x, (list, tuple)):
        return ", ".join(str(i) for i in x if str(i).strip())
    return str(x)

def _render_profile_md(profile: dict) -> str:
    if not profile:
        return "Hồ sơ sức khỏe: Chưa có dữ liệu. Vào mục **Hồ sơ** để cập nhật."
    # dự đoán cấu trúc
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
    lines.append(f"   - {_list_join(allergies) or 'Chưa ghi nhận'}")
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
    # mini chart
    sugar = next((n for n in nf.get("nutrients", []) if str(n.get("name","")).lower() in ("sugars","đường")), None)
    sodium = next((n for n in nf.get("nutrients", []) if str(n.get("name","")).lower() in ("sodium","natri")), None)
    satfat = next((n for n in nf.get("nutrients", []) if "saturated" in str(n.get("name","")).lower() or "bão" in str(n.get("name","")).lower()), None)
    rows += ["", "Minh hoạ nhanh:"]
    if sugar:
        rows.append(f"- Đường: `{_bar(sugar.get('amount',0), 12)}` {sugar.get('amount','?')}{sugar.get('unit','')} / mốc ~12 g/khẩu phần")
    if sodium:
        rows.append(f"- Natri: `{_bar(sodium.get('amount',0), 400)}` {sodium.get('amount','?')}{sodium.get('unit','')} / mốc ~400 mg/khẩu phần")
    if satfat:
        rows.append(f"- Bão hoà: `{_bar(satfat.get('amount',0), 5)}` {satfat.get('amount','?')}{satfat.get('unit','')} / mốc ~5 g/khẩu phần")
    return "\n".join(rows)

def _render_label_all_md(label: dict) -> str:
    parts = [_render_ingredients_md(label), "", _render_nutrition_md(label)]
    return "\n".join(p for p in parts if p)

# --- intent detector: chỉ kích hoạt khi người dùng RÕ RÀNG yêu cầu "xem/hiển thị" ---
_PROF_RE = re.compile(r"\b(xem|hiển\s*thị|mở|cho\s*tôi\s*xem)\b.*\b(hồ\s*sơ|profile)\b", re.I)
_ING_RE  = re.compile(r"\b(xem|hiển\s*thị|mở)\b.*\b(thành\s*phần|ingredients?|nhãn|label)\b", re.I)
_NUT_RE  = re.compile(r"\b(xem|hiển\s*thị|mở)\b.*\b(giá\s*trị\s*dinh\s*dưỡng|nutrition)\b", re.I)
# Các từ khoá loại trừ (để không vô tình show label/profile khi câu hỏi phân tích)
_EXCLUDE = ("gây dị ứng", "đánh giá", "phù hợp", "an toàn", "tốt hơn", "bao nhiêu", "tần suất", "so sánh")

def _detect_intent(msg: str):
    t = (msg or "").lower().strip()
    if not t: return None
    if any(k in t for k in _EXCLUDE):
        return None
    if _PROF_RE.search(t): return "SHOW_PROFILE"
    if _ING_RE.search(t):  return "SHOW_INGREDIENTS"
    if _NUT_RE.search(t):  return "SHOW_NUTRITION"
    return None

def _normalize_md(text: str) -> str:
    """Xoá heading markdown (#) và chuyển bullet * / • thành '-' để gọn mắt."""
    out = []
    for line in (text or "").splitlines():
        l = re.sub(r'^\s*#{1,6}\s*', '', line)     # bỏ heading '#'
        l = re.sub(r'^\s*[*•]\s+', '- ', l)        # đổi */• thành '- '
        out.append(l)
    return "\n".join(out)

# ==== API: /label/analyze ====
def _read_image_from_request():
    print("CT:", request.content_type)
    print("FILES:", list(request.files.keys()))
    data = request.get_json(silent=True) or {}
    print("JSON keys:", list(data.keys()))
    if request.content_type and "multipart/form-data" in request.content_type:
        f = request.files.get("image") or request.files.get("file")
        if not f or f.filename == "":
            return None, None, None, "missing file field"
        img_bytes = f.read()
        filename = f.filename
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

@app.post("/label/analyze")
def analyze_label():
    img_bytes, filename, source, err = _read_image_from_request()
    if err:
        return jsonify(ok=False, error=err), 400
    f_mime = (mimetypes.guess_type(filename or "")[0] or "").lower()
    mime = _detect_mime(img_bytes, f_mime or "image/jpeg")
    prompt = (
        "Đọc nhãn thực phẩm trong ảnh (tiếng Việt nếu có). "
        "Trích xuất Thành phần và Giá trị dinh dưỡng theo schema bên dưới.\n" + SCHEMA_HINT
    )
    parts = [
        {"text": prompt},
        {"inline_data": {"mime_type": mime, "data": img_bytes}},
    ]
    try:
        result = VLM_MODEL.generate_content(parts)
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
        saved={"json": str(json_path), "txt": str(txt_path)},
        meta={"source": source, "filename": filename, "mime": mime},
    )

# ==== API: /advice (giữ lại cho dễ test) ====
@app.post("/advice")
def advice():
    body = request.get_json(silent=True) or {}
    profile = body.get("profile")
    label = body.get("label")
    if not profile or not label:
        return jsonify(ok=False, error="Missing profile or label"), 400
    system = (
        "Bạn là chuyên gia dinh dưỡng. Dựa trên hồ sơ sức khỏe và dữ liệu nhãn (thành phần + dinh dưỡng), "
        "trả lời ngắn gọn, rõ ràng, không dùng heading '#', bullet '*'. Dùng tiêu đề in đậm, gạch đầu dòng '-' và liệt kê theo số."
    )
    user = f"Hồ sơ: {json.dumps(profile, ensure_ascii=False)}\n\nNhãn: {json.dumps(label, ensure_ascii=False)}"
    try:
        result = LLM_MODEL.generate_content([{"text": system}, {"text": user}])
        md = _normalize_md((result.text or "").strip())
    except Exception as e:
        return jsonify(ok=False, error=f"Gemini error: {type(e).__name__}: {e}"), 502
    return jsonify(ok=True, advice_markdown=md)

# ==== Chatbot ====
from collections import defaultdict
import uuid

CHAT_HIST = defaultdict(list)
MAX_TURNS = 12

SHOPPER_ASSISTANT_SYSTEM = """
Bạn là HealthScan AI – chuyên gia dinh dưỡng lâm sàng & “coach” mua sắm siêu thị, đồng thời là trợ lý kiến thức tổng quát.
Mục tiêu: trả lời ĐÚNG Ý CÂU HỎI trước, chính xác, ngắn gọn, không bịa. Ưu tiên dùng dữ liệu từ HỒ SƠ và NHÃN nếu liên quan.

PHONG CÁCH & ĐỊNH DẠNG
- Trả lời tiếng Việt. Không dùng heading '#' và bullet '*'.
- Dùng tiêu đề in đậm, danh sách '-' và/hoặc liệt kê số 1., 2., 3.
- Mở đầu bằng mục **Trả lời nhanh** (1–2 câu sát câu hỏi), sau đó tới các mục cần thiết. Tránh lan man.
- Nếu thiếu dữ liệu quan trọng, nêu rõ “không có trong nhãn/hồ sơ” và đề xuất cách bổ sung.
- Giọng điệu ấm áp, thực dụng (góc nhìn người nội trợ ở siêu thị). Không chẩn đoán y khoa.

CÁ NHÂN HÓA (khi có hồ sơ)
- Dị ứng/không dung nạp: đối chiếu tên thành phần trên nhãn (gluten↔bột mì/lúa mạch; sữa↔whey/casein; trứng…).
- Bệnh nền/mục tiêu: tiền/đái tháo đường → đường/Carb; tăng huyết áp → natri; giảm cân → năng lượng/đường/béo; tăng cơ → protein; tiêu hoá → chất xơ/phụ gia.
- Ngưỡng tham khảo mềm (mỗi khẩu phần, chỉ để định hướng):
  Đường > ~10–12 g → khuyên hạn chế; Natri > ~300–400 mg → cảnh báo mặn; Bão hoà ≥ ~5 g hoặc trans fat > 0 → không dùng thường xuyên.

“CÓ SẢN PHẨM TỐT HƠN KHÔNG?”
- Suy luận nhóm sản phẩm từ nhãn. Nếu không đủ, nói rõ.
- Xuất **Tiêu chí chọn tốt hơn** (số liệu cụ thể: ví dụ đường <5 g/khẩu phần; natri <120 mg; không trans fat; ngũ cốc nguyên cám ≥51%…).
- Đưa **Gợi ý thay thế cấp danh mục** (không nêu thương hiệu nếu không chắc) ví dụ: “bánh quy nguyên cám ít đường”, “ngũ cốc không thêm đường”.
- Nếu cần thêm sở thích (vị, kết cấu, mức ngọt/mặn…), hỏi 1–2 câu ngắn.

LƯU Ý Ý ĐỊNH
- Chỉ hiển thị nguyên văn **Hồ sơ** hoặc **Thành phần/Giá trị dinh dưỡng** khi người dùng RÕ RÀNG yêu cầu “xem/hiển thị/mở…”.
- Nếu câu hỏi chứa từ “hồ sơ/thành phần” nhưng là yêu cầu phân tích (VD: ‘thành phần nào gây dị ứng?’), hãy phân tích thay vì đổ dữ liệu thô.

TRỢ LÝ TỔNG QUÁT
- Nếu câu hỏi ngoài phạm vi dinh dưỡng/mua sắm, trả lời như một trợ lý kiến thức tổng quát. Không bịa thông tin thời sự.
"""

def _format_history_for_prompt(hist):
    lines = []
    for h in hist[-MAX_TURNS:]:
        who = "Người dùng" if h["role"] == "user" else "Assistant"
        lines.append(f"{who}: {h['text']}")
    return "\n".join(lines)

@app.post("/chat")
def chat():
    body = request.get_json(silent=True) or {}
    message = (body.get("message") or "").trim() if hasattr(str, "trim") else (body.get("message") or "").strip()
    profile = body.get("profile") or {}
    label = body.get("label") or {}
    reset = bool(body.get("reset"))
    chat_id = body.get("chat_id") or uuid.uuid4().hex

    if not message:
        return jsonify(ok=False, error="Missing 'message'"), 400
    if reset:
        CHAT_HIST.pop(chat_id, None)

    CHAT_HIST[chat_id].append({"role": "user", "text": message, "ts": datetime.utcnow().isoformat()})

    # Built-in intents (chỉ khi người dùng thật sự yêu cầu "xem")
    intent = _detect_intent(message)
    built_in_reply = None
    if intent == "SHOW_PROFILE":
        built_in_reply = _render_profile_md(profile)
    elif intent == "SHOW_INGREDIENTS":
        built_in_reply = _render_ingredients_md(label)
    elif intent == "SHOW_NUTRITION":
        built_in_reply = _render_nutrition_md(label)
    elif intent == "SHOW_LABEL":
        built_in_reply = _render_label_all_md(label)

    if built_in_reply:
        reply = built_in_reply
        CHAT_HIST[chat_id].append({"role": "assistant", "text": reply, "ts": datetime.utcnow().isoformat()})
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        chat_dump = {"chat_id": chat_id, "updated_at": datetime.utcnow().isoformat(),
                     "history": CHAT_HIST[chat_id][-MAX_TURNS:]}
        with open(OUT_DIR / f"chat_{chat_id}.json", "w", encoding="utf-8") as fp:
            json.dump(chat_dump, fp, ensure_ascii=False, indent=2)
        return jsonify(ok=True, chat_id=chat_id, reply_markdown=reply)

    # LLM
    context_blocks = [
        {"text": SHOPPER_ASSISTANT_SYSTEM},
        {"text": "HỒ SƠ SỨC KHỎE (JSON, nếu có):"},
        {"text": json.dumps(profile, ensure_ascii=False)},
        {"text": "NHÃN SẢN PHẨM (JSON, nếu có):"},
        {"text": json.dumps(label, ensure_ascii=False)},
        {"text": "HỘI THOẠI GẦN NHẤT:"},
        {"text": _format_history_for_prompt(CHAT_HIST[chat_id])},
        {"text": f"CÂU HỎI HIỆN TẠI:\n{message}"},
    ]
    try:
        result = LLM_MODEL.generate_content(context_blocks)
        reply_raw = (result.text or "").strip()
        reply = _normalize_md(reply_raw)
    except Exception as e:
        return jsonify(ok=False, error=f"Gemini error: {type(e).__name__}: {e}"), 502

    CHAT_HIST[chat_id].append({"role": "assistant", "text": reply, "ts": datetime.utcnow().isoformat()})

    OUT_DIR.mkdir(parents=True, exist_ok=True)
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
