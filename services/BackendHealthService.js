import { API_BASE_URL } from '../app/config/api';

class BackendHealthService {
  // Kiểm tra Backend có hoạt động không
  static async checkBackendHealth() {
    try {
      console.log('Đang kiểm tra Backend tại:', `${API_BASE_URL}/health`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 giây timeout
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('Backend health check thành công:', data);
        return {
          success: true,
          message: 'Backend đang hoạt động',
          status: response.status,
          data: data
        };
      } else {
        console.log('Backend trả về lỗi:', response.status);
        return {
          success: false,
          message: `Backend trả về lỗi: ${response.status}`,
          status: response.status
        };
      }
    } catch (error) {
      console.error('Lỗi kết nối Backend:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Kết nối Backend bị timeout sau 15 giây. Vui lòng kiểm tra:\n1. Backend có đang chạy không?\n2. URL Backend có đúng không?\n3. Network có ổn định không?',
          error: 'Request timeout'
        };
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          message: 'Không thể kết nối đến Backend. Vui lòng kiểm tra:\n1. Backend đã được khởi động chưa?\n2. URL Backend có đúng không?\n3. Có firewall chặn không?',
          error: error.message
        };
      }
      
      return {
        success: false,
        message: 'Lỗi kết nối Backend',
        error: error.message
      };
    }
  }

  // Test upload ảnh đơn giản
  static async testImageUpload() {
    try {
      console.log('Đang test upload ảnh tại:', `${API_BASE_URL}/test-upload`);
      
      // Tạo một ảnh test đơn giản (base64)
      const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      
      // Convert base64 to blob
      const response = await fetch(testImageBase64);
      const blob = await response.blob();
      
      // Tạo FormData
      const formData = new FormData();
      formData.append('image', blob, 'test-image.jpg');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 giây timeout

      const uploadResponse = await fetch(`${API_BASE_URL}/test-upload`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        console.log('Test upload thành công:', result);
        return {
          success: true,
          message: 'Upload ảnh test thành công',
          status: uploadResponse.status,
          data: result.data
        };
      } else {
        const errorData = await uploadResponse.json();
        console.log('Test upload thất bại:', errorData);
        return {
          success: false,
          message: `Upload ảnh test thất bại: ${errorData.message || uploadResponse.statusText}`,
          status: uploadResponse.status
        };
      }
    } catch (error) {
      console.error('Lỗi test upload:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Test upload bị timeout sau 20 giây',
          error: 'Request timeout'
        };
      }
      
      return {
        success: false,
        message: 'Lỗi khi test upload ảnh',
        error: error.message
      };
    }
  }

  // Lấy thông tin Backend
  static async getBackendInfo() {
    try {
      console.log('Đang lấy thông tin Backend tại:', `${API_BASE_URL}/info`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout
      
      const response = await fetch(`${API_BASE_URL}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('Backend info:', data);
        return {
          success: true,
          data: data
        };
      } else {
        return {
          success: false,
          message: 'Không thể lấy thông tin Backend',
          status: response.status
        };
      }
    } catch (error) {
      console.error('Lỗi lấy Backend info:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Lấy thông tin Backend bị timeout',
          error: 'Request timeout'
        };
      }
      
      return {
        success: false,
        message: 'Lỗi kết nối khi lấy thông tin Backend',
        error: error.message
      };
    }
  }

  // Kiểm tra tất cả các endpoint quan trọng
  static async checkAllEndpoints() {
    const endpoints = [
      { name: 'Health Check', path: '/health' },
      { name: 'Image Analysis', path: '/image-analysis/analyze' },
      { name: 'Auth', path: '/auth/login' },
      { name: 'Profile', path: '/profile' },
      { name: 'Debug', path: '/debug' },
      { name: 'Test Upload', path: '/test-upload' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`Đang kiểm tra endpoint: ${endpoint.name}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 giây timeout
        
        const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        results.push({
          name: endpoint.name,
          path: endpoint.path,
          status: response.status,
          ok: response.ok
        });
      } catch (error) {
        console.error(`Lỗi kiểm tra endpoint ${endpoint.name}:`, error);
        
        results.push({
          name: endpoint.name,
          path: endpoint.path,
          status: 'ERROR',
          ok: false,
          error: error.name === 'AbortError' ? 'Timeout' : error.message
        });
      }
    }

    return {
      success: results.some(r => r.ok),
      results: results,
      summary: {
        total: results.length,
        working: results.filter(r => r.ok).length,
        failed: results.filter(r => !r.ok).length
      }
    };
  }

  // Lấy thông tin debug chi tiết từ Backend
  static async getDetailedDebugInfo() {
    try {
      console.log('Đang lấy debug info tại:', `${API_BASE_URL}/debug`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 giây timeout
      
      const response = await fetch(`${API_BASE_URL}/debug`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('Debug info:', data);
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          message: 'Không thể lấy thông tin debug',
          status: response.status
        };
      }
    } catch (error) {
      console.error('Lỗi lấy debug info:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Lấy thông tin debug bị timeout',
          error: 'Request timeout'
        };
      }
      
      return {
        success: false,
        message: 'Lỗi kết nối khi lấy thông tin debug',
        error: error.message
      };
    }
  }
}

export default BackendHealthService;
