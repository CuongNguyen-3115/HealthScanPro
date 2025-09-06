import { buildApiUrl, setAuthToken } from '../config/api';

class AuthService {
  // Login user
  static async login(username, password) {
    try {
      const response = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // Store token
      if (data.token) {
        await setAuthToken(data.token);
      }

      return {
        success: true,
        token: data.token,
        message: 'Đăng nhập thành công'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Đã xảy ra lỗi khi đăng nhập'
      };
    }
  }

  // Register user
  static async register(username, email, password) {
    try {
      const response = await fetch(buildApiUrl('/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      return {
        success: true,
        message: 'Đăng ký thành công'
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.message || 'Đã xảy ra lỗi khi đăng ký'
      };
    }
  }

  // Forgot password
  static async forgotPassword(email) {
    try {
      const response = await fetch(buildApiUrl('/auth/forgot'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gửi mã reset thất bại');
      }

      return {
        success: true,
        message: data.message || 'Mã reset đã được gửi',
        mockCode: data.mockCode // For testing purposes
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: error.message || 'Đã xảy ra lỗi khi gửi mã reset'
      };
    }
  }

  // Verify OTP
  static async verifyOTP(phone, code) {
    try {
      const response = await fetch(buildApiUrl('/auth/verify-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Mã OTP không hợp lệ');
      }

      // Store token if provided
      if (data.token) {
        await setAuthToken(data.token);
      }

      return {
        success: true,
        token: data.token,
        message: 'Xác thực OTP thành công'
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        error: error.message || 'Đã xảy ra lỗi khi xác thực OTP'
      };
    }
  }

  // Reset password
  static async resetPassword(email, code, newPassword) {
    try {
      const response = await fetch(buildApiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đặt lại mật khẩu thất bại');
      }

      return {
        success: true,
        message: 'Đặt lại mật khẩu thành công'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Đã xảy ra lỗi khi đặt lại mật khẩu'
      };
    }
  }

  // Check if user is authenticated
  static async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Get auth token
  static async getAuthToken() {
    try {
      // Implement token retrieval logic here
      // For now, return null
      return null;
    } catch (error) {
      return null;
    }
  }

  // Logout user
  static async logout() {
    try {
      // Clear token
      await setAuthToken(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default AuthService;
