// lib/scanHistoryStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCAN_HISTORY_KEY = 'scan_history';

// Lưu kết quả phân tích vào lịch sử
export const saveScanResult = async (analysisData, personalizedAnalysis) => {
  try {
    const existingHistory = await getScanHistory();
    
    const newScanResult = {
      id: `scan_${Date.now()}`,
      productName: analysisData?.product_name || analysisData?.productName || 'Sản phẩm',
      brand: analysisData?.brand || 'Thương hiệu',
      scanDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      scanTime: new Date().toISOString(), // Full timestamp
      compatibilityScore: personalizedAnalysis?.compatibilityScore || 0,
      healthScore: analysisData?.healthScore || analysisData?.nutri_score || 0,
      nutritionFacts: analysisData?.nutrition_facts || null,
      ingredients: analysisData?.ingredients || [],
      warnings: analysisData?.warnings || [],
      allergens: analysisData?.allergens || [],
      recommendations: analysisData?.recommendations || [],
      aiInsights: analysisData?.ai_insights || [],
      healthRecommendations: analysisData?.health_recommendations || [],
      detailedAnalysis: analysisData?.detailed_analysis_markdown || null,
      personalizedAnalysis: personalizedAnalysis || null,
      rawData: analysisData // Lưu toàn bộ dữ liệu gốc để có thể xem lại chi tiết
    };

    // Thêm vào đầu danh sách (mới nhất lên đầu)
    const updatedHistory = [newScanResult, ...existingHistory];
    
    // Giới hạn tối đa 100 kết quả để tránh storage quá lớn
    const limitedHistory = updatedHistory.slice(0, 100);
    
    await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(limitedHistory));
    
    return {
      success: true,
      message: 'Kết quả phân tích đã được lưu vào lịch sử',
      scanResult: newScanResult
    };
  } catch (error) {
    console.error('Lỗi lưu kết quả phân tích:', error);
    return {
      success: false,
      message: 'Không thể lưu kết quả phân tích',
      error: error.message
    };
  }
};

// Lấy lịch sử quét
export const getScanHistory = async () => {
  try {
    const historyData = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
    return historyData ? JSON.parse(historyData) : [];
  } catch (error) {
    console.error('Lỗi đọc lịch sử quét:', error);
    return [];
  }
};

// Xóa một kết quả phân tích
export const deleteScanResult = async (scanId) => {
  try {
    const existingHistory = await getScanHistory();
    const updatedHistory = existingHistory.filter(item => item.id !== scanId);
    await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updatedHistory));
    
    return {
      success: true,
      message: 'Đã xóa kết quả phân tích'
    };
  } catch (error) {
    console.error('Lỗi xóa kết quả phân tích:', error);
    return {
      success: false,
      message: 'Không thể xóa kết quả phân tích',
      error: error.message
    };
  }
};

// Xóa toàn bộ lịch sử
export const clearScanHistory = async () => {
  try {
    await AsyncStorage.removeItem(SCAN_HISTORY_KEY);
    return {
      success: true,
      message: 'Đã xóa toàn bộ lịch sử quét'
    };
  } catch (error) {
    console.error('Lỗi xóa lịch sử quét:', error);
    return {
      success: false,
      message: 'Không thể xóa lịch sử quét',
      error: error.message
    };
  }
};

// Lấy thống kê lịch sử
export const getScanStatistics = async () => {
  try {
    const history = await getScanHistory();
    
    if (history.length === 0) {
      return {
        totalScans: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        recentScans: []
      };
    }

    const scores = history.map(item => item.compatibilityScore || item.healthScore).filter(score => score > 0);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const worstScore = scores.length > 0 ? Math.min(...scores) : 0;
    
    return {
      totalScans: history.length,
      averageScore,
      bestScore,
      worstScore,
      recentScans: history.slice(0, 5) // 5 kết quả gần nhất
    };
  } catch (error) {
    console.error('Lỗi tính toán thống kê:', error);
    return {
      totalScans: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      recentScans: []
    };
  }
};
