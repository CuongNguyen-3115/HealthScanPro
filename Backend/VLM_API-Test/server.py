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
VLM_MODEL = genai.GenerativeModel("gemini-1.5-flash")
LLM_MODEL = genai.GenerativeModel("gemini-1.5-flash")

app = Flask(__name__)
# CORS cho web app (localhost:8081). Có thể thêm origin khác nếu cần.
CORS(app, resources={
    r"/label/*": {"origins": ["http://localhost:8081", "http://127.0.0.1:8081"]},
    r"/advice":  {"origins": ["http://localhost:8081", "http://127.0.0.1:8081"]},
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
    lines = []
    lines.append("=== THÔNG TIN NHÃN TRÍCH XUẤT ===")
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
        lines.append(f"• {name}{pct}{allerg}{notes}")
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
        lines.append(f"• {name}: {amount} {unit}{dv}".strip())
    lines.append("")
    warns = label.get("warnings", []) or []
    lines.append("— CẢNH BÁO —")
    if warns:
        for w in warns: lines.append(f"• {w}")
    else:
        lines.append("-")
    return "\n".join(lines)

def _read_image_from_request():
    """Trả về (img_bytes, filename, source) từ multipart hoặc JSON base64."""
    print("CT:", request.content_type)
    print("FILES:", list(request.files.keys()))
    data = request.get_json(silent=True) or {}
    print("JSON keys:", list(data.keys()))

    # 1) multipart/form-data
    if request.content_type and "multipart/form-data" in request.content_type:
        f = request.files.get("image") or request.files.get("file")
        if not f or f.filename == "":
            return None, None, None, "missing file field"
        img_bytes = f.read()
        filename = f.filename
        return img_bytes, filename, "multipart", None

    # 2) JSON base64: { image_base64: "data:...;base64,...." }
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

# ==== API: /label/analyze ====
@app.post("/label/analyze")
def analyze_label():
    img_bytes, filename, source, err = _read_image_from_request()
    if err:
        return jsonify(ok=False, error=err), 400

    # MIME ưu tiên: Flask -> theo tên -> đoán bytes
    f_mime = (mimetypes.guess_type(filename or "")[0] or "").lower()
    mime = _detect_mime(img_bytes, f_mime or "image/jpeg")

    print(f"[analyze_label] source={source} file={filename} mime={mime}", flush=True)

    # Gemini prompt
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

    # Bổ sung field tối thiểu cho client
    label.setdefault("ingredients", [])
    label.setdefault("nutrition_facts", {}).setdefault("nutrients", [])
    label.setdefault("warnings", [])

    # Lưu file
    ts = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    base_stem = Path(secure_filename(filename or "upload")).stem or "upload"
    prefix = f"{ts}_{base_stem}"

    json_path = OUT_DIR / f"{prefix}.json"
    txt_path  = OUT_DIR / f"{prefix}.txt"

    with open(json_path, "w", encoding="utf-8") as fp:
        json.dump(label, fp, ensure_ascii=False, indent=2)
    with open(txt_path, "w", encoding="utf-8") as fp:
        fp.write(_human_text_from_label(label))

    print(f"[analyze_label] saved -> {json_path.name}, {txt_path.name}", flush=True)

    # Trả về đúng định dạng client mong đợi
    return jsonify(
        ok=True,
        label=label,
        saved={"json": str(json_path), "txt": str(txt_path)},
        meta={"source": source, "filename": filename, "mime": mime},
    )

# ==== API: /advice ====
@app.post("/advice")
def advice():
    body = request.get_json(silent=True) or {}
    profile = body.get("profile")
    label = body.get("label")
    if not profile or not label:
        return jsonify(ok=False, error="Missing profile or label"), 400

    system = (
        "Bạn là chuyên gia dinh dưỡng. Dựa trên hồ sơ sức khỏe và dữ liệu nhãn (thành phần + dinh dưỡng), "
        "hãy trả lời ngắn gọn, có cấu trúc Markdown:\n"
        "1) Tóm tắt sản phẩm\n"
        "2) Điểm cần lưu ý/cảnh báo (dị ứng, đường, muối, chất béo bão hòa, phụ gia)\n"
        "3) Lời khuyên cá nhân hóa\n"
        "4) Kết luận: OK / Dùng có kiểm soát / Tránh"
    )
    user = f"Hồ sơ: {json.dumps(profile, ensure_ascii=False)}\n\nNhãn: {json.dumps(label, ensure_ascii=False)}"

    try:
        result = LLM_MODEL.generate_content([{"text": system}, {"text": user}])
        md = (result.text or "").strip()
    except Exception as e:
        return jsonify(ok=False, error=f"Gemini error: {type(e).__name__}: {e}"), 502

    return jsonify(ok=True, advice_markdown=md)

# ==== Run ====
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)
