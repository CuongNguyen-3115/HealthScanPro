import axios from 'axios';
import { API_BASE_URL } from '../app/config/api';

// MongoDB API endpoints - sử dụng cấu hình từ api.js

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Đăng ký tài khoản mới
  async register(userData) {
    try {
      const response = await this.api.post('/api/auth/register', {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: 'user', // Mặc định là user
        fullName: userData.username,
        avatar: '👤',
        permissions: ['basic'],
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        user: response.data.user,
        message: 'Đăng ký thành công!'
      };
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký'
      };
    }
  }

  // Đăng nhập
  async login(username, password) {
    try {
      // Gọi API thật để đăng nhập
      const response = await this.api.post('/api/auth/login', {
        username,
        password,
      });

      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
        message: 'Đăng nhập thành công!'
      };
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Tên đăng nhập hoặc mật khẩu không đúng'
      };
    }
  }

  // Kiểm tra token và lấy thông tin user
  async verifyToken(token) {
    try {
      // Gọi API thật để verify token
      const response = await this.api.get('/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return {
        success: true,
        user: response.data.user
      };
    } catch (error) {
      console.error('Lỗi xác thực token:', error);
      return {
        success: false,
        error: 'Token không hợp lệ'
      };
    }
  }

  // Cập nhật thông tin user
  async updateUser(userId, updateData, token) {
    try {
      const response = await this.api.put(`/api/auth/users/${userId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return {
        success: true,
        user: response.data.user,
        message: 'Cập nhật thành công!'
      };
    } catch (error) {
      console.error('Lỗi cập nhật user:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật'
      };
    }
  }

  // Đăng xuất
  async logout(token) {
    try {
      await this.api.post('/api/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return {
        success: true,
        message: 'Đăng xuất thành công!'
      };
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      return {
        success: false,
        error: 'Có lỗi xảy ra khi đăng xuất'
      };
    }
  }

  // Tạo tài khoản admin (chỉ dùng một lần để setup)
  async createAdminAccount() {
    try {
      const adminData = {
        username: 'admin',
        email: 'admin@healthscanpro.com',
        password: 'admin123',
        role: 'admin',
        fullName: 'Administrator',
        avatar: '👑',
        permissions: ['all'],
        createdAt: new Date().toISOString(),
      };

      const response = await this.api.post('/api/auth/create-admin', adminData);

      return {
        success: true,
        user: response.data.user,
        message: 'Tài khoản admin đã được tạo thành công!'
      };
    } catch (error) {
      console.error('Lỗi tạo admin:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Có lỗi xảy ra khi tạo admin'
      };
    }
  }

  // Kiểm tra kết nối đến server
  async checkConnection() {
    try {
      const response = await this.api.get('/api/health');
      return {
        success: true,
        message: 'Kết nối thành công!'
      };
    } catch (error) {
      console.error('Lỗi kết nối:', error);
      return {
        success: false,
        error: 'Không thể kết nối đến server'
      };
    }
  }

  // ==== Health Profile Methods ====

  async getHealthProfiles(userId) {
    try {
      const response = await this.api.get(`/api/health-profiles/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy hồ sơ sức khỏe:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Có lỗi xảy ra khi lấy hồ sơ sức khỏe'
      };
    }
  }

  async createHealthProfile(userId, profileData) {
    try {
      const response = await this.api.post(`/api/health-profiles/${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error('Lỗi tạo hồ sơ sức khỏe:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Có lỗi xảy ra khi tạo hồ sơ sức khỏe'
      };
    }
  }

  async updateHealthProfile(userId, profileId, profileData) {
    try {
      const response = await this.api.put(`/api/health-profiles/${userId}/${profileId}`, profileData);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật hồ sơ sức khỏe:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Có lỗi xảy ra khi cập nhật hồ sơ sức khỏe'
      };
    }
  }

  async setCurrentHealthProfile(userId, profileId) {
    try {
      const response = await this.api.post(`/api/health-profiles/${userId}/${profileId}/set-current`);
      return response.data;
    } catch (error) {
      console.error('Lỗi thiết lập hồ sơ hiện tại:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Có lỗi xảy ra khi thiết lập hồ sơ'
      };
    }
  }
}

export default new AuthService();
