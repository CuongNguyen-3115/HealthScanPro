# Khắc phục lỗi "Network request failed" trong ProductAnalysisScreen

## Nguyên nhân lỗi

Lỗi "Network request failed" thường xảy ra do:

1. **Server không chạy** - Backend server chưa được khởi động
2. **Sai URL/Port** - URL API không đúng hoặc port không khớp
3. **Network configuration** - Cấu hình mạng không phù hợp với platform
4. **CORS issues** - Vấn đề CORS trên web
5. **Firewall/Security** - Firewall chặn kết nối

## Các bước khắc phục

### 1. Kiểm tra Server có chạy không

**Chạy server backend:**
```bash
cd Backend/VLM_API-Test
python server.py
```

**Kiểm tra server đang chạy:**
- Mở browser: `http://localhost:8888/_health`
- Hoặc: `http://192.168.0.118:8888/_health` (tùy IP máy)

### 2. Kiểm tra API Configuration

**File: `app/config/api.js`**
```javascript
// Kiểm tra IP address phù hợp với platform
const getLocalIPAddress = () => {
  if (Platform.OS === 'web') {
    return 'localhost';
  } else if (Platform.OS === 'ios') {
    // Thay đổi IP này thành IP thật của máy bạn
    return '192.168.0.118';  // ← Cập nhật IP này
  } else if (Platform.OS === 'android') {
    return '10.0.2.2';
  }
  return 'localhost';
};
```

**Cách tìm IP thật của máy:**
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
# hoặc
ip addr show
```

### 3. Debug Network Connection

**Thêm debug logs vào ProductAnalysisScreen.js:**
```javascript
const testServerConnection = async () => {
  try {
    const healthUrl = `${API_BASE_URL}/_health`;
    console.log('Test server connection:', healthUrl);
    const response = await fetch(healthUrl, { method: 'GET' });
    console.log('Health check status:', response.status);
    if (response.ok) {
      const result = await response.json();
      console.log('Server health:', result);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Server connection test failed:', error);
    return false;
  }
};
```

### 4. Cấu hình Platform-specific

#### **iOS Simulator/Device**
```javascript
// Trong api.js
if (Platform.OS === 'ios') {
  return '192.168.0.118';  // IP thật của máy host
}
```

#### **Android Emulator**
```javascript
// Trong api.js
if (Platform.OS === 'android') {
  return '10.0.2.2';  // IP mặc định cho Android emulator
}
```

#### **Web Browser**
```javascript
// Trong api.js
if (Platform.OS === 'web') {
  return 'localhost';
}
```

### 5. Kiểm tra CORS Configuration

**Trong server.py:**
```python
ALLOWED = [
    "http://localhost:8081", "http://127.0.0.1:8081",
    "http://localhost:19006", "http://127.0.0.1:19006",
    "http://localhost:19000", "http://127.0.0.1:19000",
    "http://localhost:3000",  "http://127.0.0.1:3000",
    # Thêm IP của máy nếu cần
    "http://192.168.0.118:8081",
    "http://192.168.0.118:19006",
]

CORS(app,
     resources={r"/*": {"origins": ALLOWED + [r"http://192\.168\.\d+\.\d+:\d+"]}},
     methods=["GET","POST","OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])
```

### 6. Test API Endpoints

**Test từng endpoint:**
```bash
# Health check
curl http://localhost:8888/_health

# Detailed analysis (cần data)
curl -X POST http://localhost:8888/detailed-analysis \
  -H "Content-Type: application/json" \
  -d '{"profile": {}, "label": {}}'
```

### 7. Network Troubleshooting

#### **Kiểm tra kết nối mạng:**
```bash
# Ping server
ping 192.168.0.118

# Test port
telnet 192.168.0.118 8888
```

#### **Kiểm tra firewall:**
- Windows: Tắt Windows Firewall tạm thời
- Mac: Kiểm tra System Preferences > Security & Privacy > Firewall
- Linux: `sudo ufw status`

### 8. Alternative Solutions

#### **Sử dụng ngrok cho testing:**
```bash
# Cài đặt ngrok
npm install -g ngrok

# Expose local server
ngrok http 8888

# Sử dụng URL ngrok trong API config
```

#### **Sử dụng localhost với port forwarding:**
```bash
# Android emulator port forwarding
adb reverse tcp:8888 tcp:8888
```

### 9. Debug Steps

1. **Kiểm tra console logs:**
   ```javascript
   console.log('API_BASE_URL:', API_BASE_URL);
   console.log('Full URL:', `${API_BASE_URL}/detailed-analysis`);
   ```

2. **Test từng bước:**
   - Test health endpoint trước
   - Test với data đơn giản
   - Test với data đầy đủ

3. **Kiểm tra network tab:**
   - Mở Developer Tools
   - Xem Network tab
   - Kiểm tra request/response

### 10. Common Solutions

#### **Solution 1: Update IP Address**
```javascript
// Trong api.js, thay đổi IP
return '192.168.1.100';  // IP thật của máy
```

#### **Solution 2: Use localhost for all platforms**
```javascript
// Tạm thời dùng localhost cho tất cả
return 'localhost';
```

#### **Solution 3: Add error handling**
```javascript
const loadDetailedAnalysis = async (productData, profile) => {
  try {
    // Test connection first
    const isConnected = await testServerConnection();
    if (!isConnected) {
      Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng kiểm tra server có đang chạy không.');
      return;
    }
    
    // Continue with API call...
  } catch (error) {
    Alert.alert('Lỗi mạng', `Không thể tải phân tích chi tiết: ${error.message}`);
  }
};
```

## Checklist Debug

- [ ] Server đang chạy trên port 8888
- [ ] IP address trong api.js đúng với máy host
- [ ] Platform-specific configuration đúng
- [ ] CORS configuration cho phép origin
- [ ] Firewall không chặn port 8888
- [ ] Network connection ổn định
- [ ] Console logs hiển thị đúng URL
- [ ] Health endpoint trả về 200 OK

## Test Commands

```bash
# Test server health
curl http://localhost:8888/_health

# Test với IP thật
curl http://192.168.0.118:8888/_health

# Test detailed analysis
curl -X POST http://localhost:8888/detailed-analysis \
  -H "Content-Type: application/json" \
  -d '{"profile": {"basic": {"age": 30}}, "label": {"ingredients": []}}'
```
