# HealthScan Pro - MongoDB Authentication Backend

## 🚀 Tổng quan

Backend MongoDB authentication cho HealthScan Pro đã được tích hợp hoàn chỉnh với các tính năng:

- ✅ **User Registration & Login** với MongoDB
- ✅ **JWT Token Authentication** 
- ✅ **Admin Account Management**
- ✅ **Password Hashing** với bcrypt
- ✅ **Input Validation** và Error Handling
- ✅ **CORS Support** cho frontend
- ✅ **Health Check** endpoints

## 📁 Cấu trúc Files

```
Backend/VLM_API-Test/
├── 🔐 Authentication Files
│   ├── auth_server.py              # Standalone auth server
│   ├── server_with_auth.py         # Integrated server (RECOMMENDED)
│   ├── auth_requirements.txt       # Python dependencies
│   └── auth_env_example.txt         # Environment variables
│
├── 🚀 Startup Scripts
│   ├── start_server.sh             # Linux/macOS startup
│   └── start_server.bat            # Windows startup
│
├── 📚 Documentation
│   └── MONGODB_SETUP_GUIDE.md      # Detailed setup guide
│
└── 🔧 Original Files
    ├── server.py                   # Original server (preserved)
    ├── cors_config.py              # CORS configuration
    └── client_upload.py             # Client upload utilities
```

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.7+
- MongoDB (local hoặc Atlas)
- pip package manager

### 2. Setup MongoDB
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod
```

### 3. Install Dependencies
```bash
cd Backend/VLM_API-Test
pip install -r auth_requirements.txt
```

### 4. Configure Environment
```bash
# Copy environment template
cp auth_env_example.txt .env

# Edit .env file với MongoDB URI và JWT secret
nano .env
```

### 5. Start Server
```bash
# Linux/macOS
chmod +x start_server.sh
./start_server.sh

# Windows
start_server.bat

# Hoặc manual
python server_with_auth.py
```

## 🔗 API Endpoints

### Authentication APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Đăng ký user mới |
| `POST` | `/api/auth/login` | Đăng nhập |
| `POST` | `/api/auth/logout` | Đăng xuất |
| `GET` | `/api/auth/verify` | Verify JWT token |
| `PUT` | `/api/auth/users/:userId` | Cập nhật user |
| `POST` | `/api/auth/create-admin` | Tạo admin account |
| `GET` | `/api/health` | Health check |

### Existing HealthScan APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/_health` | Server health với version |
| `POST` | `/label/analyze` | Phân tích nhãn sản phẩm |
| `POST` | `/advice` | Tư vấn dinh dưỡng |
| `POST` | `/recommend` | Đề xuất sản phẩm |
| `POST` | `/chat` | Chatbot AI |
| `POST` | `/asr` | Speech recognition |

## 🔧 Configuration

### Environment Variables (.env)
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=healthscanpro

# JWT Configuration  
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRATION_HOURS=24

# Server Configuration
PORT=8888
DEBUG=True

# Existing Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
```

### MongoDB Schema
```javascript
// Users Collection
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique), 
  password: String (hashed),
  role: String, // 'user' | 'admin'
  fullName: String,
  avatar: String,
  permissions: [String],
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean
}
```

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:8888/api/health
```

### 2. Create Admin
```bash
curl -X POST http://localhost:8888/api/auth/create-admin
```

### 3. Register User
```bash
curl -X POST http://localhost:8888/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "password123"
  }'
```

### 4. Login
```bash
curl -X POST http://localhost:8888/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

## 🔒 Security Features

- **Password Hashing**: bcrypt với salt
- **JWT Tokens**: Secure token-based auth
- **Input Validation**: Email format, password length
- **CORS Protection**: Configured origins
- **Error Handling**: Comprehensive responses
- **Token Expiration**: Configurable timeout

## 🎯 Frontend Integration

Frontend đã được cấu hình sẵn:

1. **AuthService** (`services/AuthService.js`) - API client
2. **UserContext** (`contexts/UserContext.js`) - State management  
3. **RegisterScreen** - User registration
4. **LoginScreen** - User login
5. **AdminSetupScreen** - Admin account creation

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB service
   sudo systemctl status mongod
   
   # Test connection
   mongosh mongodb://localhost:27017
   ```

2. **JWT Token Errors**
   - Check JWT_SECRET in .env
   - Ensure token format: `Bearer <token>`

3. **CORS Issues**
   - Verify allowed origins in server
   - Check frontend URL configuration

4. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep 8888
   
   # Change PORT in .env if needed
   ```

### Debug Mode
```bash
export DEBUG=True
python server_with_auth.py
```

## 📈 Production Deployment

### 1. Environment Setup
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
DATABASE_NAME=healthscanpro_prod
JWT_SECRET=very_secure_production_secret
JWT_EXPIRATION_HOURS=24
PORT=8888
DEBUG=False
```

### 2. Security Checklist
- [ ] Change default JWT_SECRET
- [ ] Use MongoDB Atlas for production
- [ ] Enable HTTPS
- [ ] Set DEBUG=False
- [ ] Configure proper CORS origins
- [ ] Use environment variables for secrets

## 📞 Support

Nếu gặp vấn đề:

1. **Kiểm tra MongoDB**: Service đang chạy và accessible
2. **Verify Environment**: Tất cả variables trong .env
3. **Check Logs**: Server logs để debug
4. **Test APIs**: Sử dụng curl để test endpoints
5. **Frontend Config**: Verify AuthService configuration

## 🎉 Kết quả

Sau khi setup thành công:

- ✅ **Backend Server** chạy trên port 8888
- ✅ **MongoDB** lưu trữ user data
- ✅ **Authentication APIs** hoạt động đầy đủ
- ✅ **Frontend** có thể đăng ký/đăng nhập
- ✅ **Admin Account** có thể tạo và sử dụng
- ✅ **JWT Tokens** bảo mật session
- ✅ **Tất cả tính năng** HealthScan Pro hoạt động bình thường

---

**🎯 Ready to go!** Backend MongoDB authentication đã sẵn sàng cho HealthScan Pro!
