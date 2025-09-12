# Tính năng Chatbot Nâng cao - Phân tích Chi tiết

## Tổng quan

Chatbot đã được cải thiện để hiển thị phân tích chi tiết hơn về sản phẩm, bao gồm:

1. **Lợi ích sức khỏe** - Những điểm tích cực của sản phẩm
2. **Phân tích thành phần chi tiết** - Từng thành phần và tác động
3. **Phân tích dinh dưỡng chi tiết** - So sánh với nhu cầu cá nhân
4. **Khuyến nghị sức khỏe** - Hướng dẫn sử dụng cụ thể

## Các Intent Mới

### 1. Phân tích chi tiết
Người dùng có thể yêu cầu phân tích chi tiết bằng các từ khóa:
- "phân tích chi tiết"
- "phân tích đầy đủ" 
- "đánh giá chi tiết"
- "lợi ích sức khỏe"
- "khuyến nghị sức khỏe"

**Ví dụ:**
```
"Cho tôi phân tích chi tiết sản phẩm này"
"Lợi ích sức khỏe của sản phẩm là gì?"
"Đánh giá chi tiết dinh dưỡng"
```

## API Endpoints Mới

### 1. `/detailed-analysis` (POST)

**Request:**
```json
{
  "profile": {
    "basic": {"age": 30, "gender": "female"},
    "conditions": {"selected": ["tiểu đường"]},
    "goals": {"selected": ["giảm cân"]},
    "allergies": ["gluten"]
  },
  "label": {
    "ingredients": [...],
    "nutrition_facts": {...}
  }
}
```

**Response:**
```json
{
  "ok": true,
  "detailed_analysis_markdown": "**PHÂN TÍCH SỨC KHỎE CHI TIẾT**\n\n**Trả lời nhanh**\n- Đánh giá tổng quan: **Cần cân nhắc**\n\n**Lợi ích sức khỏe**\n- Protein cao (8g/khẩu phần) hỗ trợ phát triển cơ bắp\n- Chất xơ tốt (4g/khẩu phần) hỗ trợ tiêu hóa\n\n**Phân tích thành phần chi tiết**\n- Thành phần chính:\n  • Bột mì (56%) [DỊ ỨNG]\n  • Đường (12%)\n  • Siro glucose\n- Phụ gia: 3 loại\n  • Mức độ: Chấp nhận được (≤4)\n- Trans fat: Không phát hiện\n\n**Phân tích dinh dưỡng chi tiết**\n- So sánh với nhu cầu cá nhân:\n  • Đường: 12g (>12g) ❌ Cao\n  • Natri: 300mg (≤400mg) ✅ Tốt\n  • Protein: 8g (≥6g) ✅ Tốt\n  • Chất xơ: 4g (≥5g) ⚠️ Thấp\n\n**Khuyến nghị sức khỏe**\n- **Cần cân nhắc**: Sử dụng có kiểm soát\n- Tần suất: ≤ 3 lần/tuần\n- Lý do đánh giá:\n  • Đường cao\n  • Protein cao (≥10g/100g)\n\n**Tiêu chí chọn tốt hơn**\n- Đường: ≤ 5g/khẩu phần\n- Natri: ≤ 200-400mg/khẩu phần\n- Bão hòa: ≤ 2-3g/khẩu phần\n- Protein: ≥ 6-10g/khẩu phần\n- Chất xơ: ≥ 3-5g/khẩu phần\n- Phụ gia: ≤ 2-4 loại\n- Không có trans fat",
  "metrics": {
    "sugars_g": 12.0,
    "sodium_mg": 300,
    "protein_g": 8.0,
    "fiber_g": 4.0,
    "additives_count": 3,
    "transfat_flag": false
  },
  "targets": {
    "sugar_good_g": 5.0,
    "sugar_high_g": 12.0,
    "sodium_good_mg": 200.0,
    "protein_min_g": 6.0,
    "fiber_min_g": 5.0,
    "additives_max": 2
  }
}
```

## Cấu trúc Phân tích Chi tiết

### 1. Trả lời nhanh
- Đánh giá tổng quan sản phẩm
- Mức độ phù hợp: Phù hợp/Cần cân nhắc/Hạn chế/Tránh

### 2. Lợi ích sức khỏe
- Protein cao → hỗ trợ phát triển cơ bắp
- Chất xơ tốt → hỗ trợ tiêu hóa
- Đường thấp → tốt cho kiểm soát đường huyết
- Natri thấp → tốt cho tim mạch

### 3. Phân tích thành phần chi tiết
- **Thành phần chính**: Top 5 thành phần với tỷ lệ %
- **Dị ứng**: Đánh dấu [DỊ ỨNG] cho các chất gây dị ứng
- **Phụ gia**: Đếm số loại và đánh giá mức độ
- **Trans fat**: Phát hiện và cảnh báo

### 4. Phân tích dinh dưỡng chi tiết
- **So sánh với nhu cầu cá nhân**:
  - Đường: ✅ Tốt / ⚠️ Trung bình / ❌ Cao
  - Natri: ✅ Tốt / ⚠️ Trung bình / ❌ Cao
  - Protein: ✅ Tốt / ⚠️ Thấp
  - Chất xơ: ✅ Tốt / ⚠️ Thấp

### 5. Khuyến nghị sức khỏe
- **Mức độ sử dụng**: Phù hợp/Cần cân nhắc/Hạn chế/Tránh
- **Tần suất**: Hàng ngày / ≤ 3 lần/tuần / ≤ 1-2 lần/tuần / Không dùng
- **Lý do đánh giá**: Danh sách các điểm tích cực/tiêu cực

### 6. Tiêu chí chọn tốt hơn
- Ngưỡng dinh dưỡng tối ưu cho từng chỉ tiêu
- Hướng dẫn lựa chọn sản phẩm thay thế

## Cải thiện Chatbot System Prompt

Chatbot đã được cập nhật với cấu trúc phân tích chi tiết:

```
CẤU TRÚC PHÂN TÍCH CHI TIẾT
Khi phân tích sản phẩm, LUÔN bao gồm các phần sau theo thứ tự:

1. **Trả lời nhanh** - Đánh giá tổng quan (1-2 câu)
2. **Lợi ích sức khỏe** - Những điểm tích cực của sản phẩm
3. **Phân tích thành phần chi tiết** - Từng thành phần và tác động
4. **Phân tích dinh dưỡng chi tiết** - So sánh với nhu cầu cá nhân
5. **Khuyến nghị sức khỏe** - Hướng dẫn sử dụng cụ thể
6. **Tiêu chí chọn tốt hơn** - Gợi ý cải thiện
```

## Sử dụng trong Frontend

### 1. Gọi API phân tích chi tiết
```javascript
const response = await fetch('/detailed-analysis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    profile: userProfile,
    label: scannedLabel
  })
});

const data = await response.json();
if (data.ok) {
  // Hiển thị phân tích chi tiết
  displayDetailedAnalysis(data.detailed_analysis_markdown);
}
```

### 2. Xử lý intent trong chatbot
```javascript
// Trong chatbot component
const handleMessage = async (message) => {
  const response = await fetch('/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: message,
      profile: userProfile,
      label: scannedLabel,
      chat_id: chatId
    })
  });
  
  const data = await response.json();
  if (data.ok) {
    // Hiển thị reply với markdown formatting
    displayMessage(data.reply_markdown);
  }
};
```

## Lợi ích

1. **Thông tin chi tiết hơn**: Người dùng có cái nhìn toàn diện về sản phẩm
2. **Cá nhân hóa cao**: Phân tích dựa trên hồ sơ sức khỏe cá nhân
3. **Hướng dẫn cụ thể**: Khuyến nghị rõ ràng về cách sử dụng
4. **Dễ hiểu**: Sử dụng emoji và cấu trúc rõ ràng
5. **Tương tác tốt**: Nhiều cách để yêu cầu thông tin chi tiết
