import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getProfile } from '../lib/profileStorage';
import { saveScanResult } from '../lib/scanHistoryStorage';
import { API_BASE_URL, API_CONFIG } from './config/api';

const ProductAnalysisScreen = () => {
  const params = useLocalSearchParams();
  const [analysisData, setAnalysisData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [personalizedAnalysis, setPersonalizedAnalysis] = useState(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState(null);
  const [loadingDetailedAnalysis, setLoadingDetailedAnalysis] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (params.analysisResult) {
      try {
        const result = JSON.parse(params.analysisResult);
        setAnalysisData(result);
        
        // Tạo phân tích cá nhân hóa nếu có hồ sơ người dùng
        if (userProfile) {
          generatePersonalizedAnalysis(result, userProfile);
          // Tải phân tích chi tiết từ server
          loadDetailedAnalysis(result, userProfile);
        }
      } catch (error) {
        console.error('Lỗi parse dữ liệu phân tích:', error);
        Alert.alert('Lỗi', 'Không thể hiển thị kết quả phân tích');
      }
    }
  }, [params.analysisResult, userProfile, generatePersonalizedAnalysis, loadDetailedAnalysis]);

  const loadUserProfile = async () => {
    try {
      const profile = await getProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Lỗi tải hồ sơ người dùng:', error);
    }
  };

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

  const loadDetailedAnalysis = useCallback(async (productData, profile) => {
    if (!productData || !profile) return;
    
    // Debug API_CONFIG
    console.log('API_CONFIG:', API_CONFIG);
    console.log('API_CONFIG.IMAGE_ANALYSIS:', API_CONFIG?.IMAGE_ANALYSIS);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    // Test server connection first
    const isServerRunning = await testServerConnection();
    if (!isServerRunning) {
      console.error('Server không chạy hoặc không thể kết nối');
      setLoadingDetailedAnalysis(false);
      return;
    }
    
    setLoadingDetailedAnalysis(true);
    try {
      const apiUrl = `${API_BASE_URL}${API_CONFIG.IMAGE_ANALYSIS.DETAILED_ANALYSIS}`;
      console.log('Gọi API phân tích chi tiết:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: profile,
          label: productData
        })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Kết quả phân tích chi tiết:', result);
        if (result.ok) {
          setDetailedAnalysis(result);
        } else {
          console.error('API trả về lỗi:', result.error);
        }
      } else {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Lỗi tải phân tích chi tiết:', error);
      console.error('API URL:', `${API_BASE_URL}${API_CONFIG.IMAGE_ANALYSIS.DETAILED_ANALYSIS}`);
      console.error('API_BASE_URL:', API_BASE_URL);
    } finally {
      setLoadingDetailedAnalysis(false);
    }
  }, []);

  const generatePersonalizedAnalysis = useCallback((productData, profile) => {
    // Tạo phân tích cá nhân hóa dựa trên hồ sơ sức khỏe
    const personalized = {
      compatibilityScore: calculateCompatibilityScore(productData, profile),
      healthImpact: generateHealthImpact(productData, profile),
      recommendations: generatePersonalizedRecommendations(productData, profile),
      warnings: generatePersonalizedWarnings(productData, profile),
      benefits: generatePersonalizedBenefits(productData, profile)
    };
    setPersonalizedAnalysis(personalized);
  }, []);

  const calculateCompatibilityScore = (product, profile) => {
    let score = 50; // Base score
    
    // Kiểm tra dị ứng
    if (product.allergens && profile.allergies) {
      const hasAllergy = product.allergens.some(allergen => 
        profile.allergies.some(userAllergy => 
          userAllergy.toLowerCase().includes(allergen.toLowerCase())
        )
      );
      if (hasAllergy) score -= 30;
    }
    
    // Kiểm tra bệnh mãn tính
    if (profile.chronicDiseases) {
      if (profile.chronicDiseases.toLowerCase().includes('tiểu đường') && 
          product.nutritionFacts?.sugar > 10) {
        score -= 20;
      }
      if (profile.chronicDiseases.toLowerCase().includes('huyết áp') && 
          product.nutritionFacts?.sodium > 200) {
        score -= 15;
      }
    }
    
    // Kiểm tra mục tiêu sức khỏe
    if (profile.healthGoals) {
      if (profile.healthGoals.toLowerCase().includes('giảm cân') && 
          product.nutritionFacts?.calories > 200) {
        score -= 10;
      }
      if (profile.healthGoals.toLowerCase().includes('tăng cơ') && 
          product.nutritionFacts?.protein > 15) {
        score += 15;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const generateHealthImpact = (product, profile) => {
    const impacts = [];
    
    if (profile.chronicDiseases?.toLowerCase().includes('tiểu đường')) {
      if (product.nutritionFacts?.sugar > 15) {
        impacts.push('Có thể làm tăng đường huyết do hàm lượng đường cao');
      } else {
        impacts.push('Phù hợp với chế độ ăn cho người tiểu đường');
      }
    }
    
    if (profile.healthGoals?.toLowerCase().includes('giảm cân')) {
      if (product.nutritionFacts?.calories < 150) {
        impacts.push('Hỗ trợ mục tiêu giảm cân với lượng calo thấp');
      } else {
        impacts.push('Cần cân nhắc lượng calo khi giảm cân');
      }
    }
    
    return impacts;
  };

  const generatePersonalizedRecommendations = (product, profile) => {
    const recommendations = [];
    
    if (profile.age && profile.age < 18) {
      recommendations.push('Sản phẩm phù hợp cho trẻ em, hỗ trợ phát triển');
    }
    
    if (profile.gender === 'Nữ' && profile.age > 30) {
      recommendations.push('Có thể hỗ trợ sức khỏe xương với hàm lượng canxi');
    }
    
    if (profile.exerciseFrequency?.toLowerCase().includes('thường xuyên')) {
      recommendations.push('Phù hợp để bổ sung sau tập luyện');
    }
    
    return recommendations;
  };

  const generatePersonalizedWarnings = (product, profile) => {
    const warnings = [];
    
    if (profile.allergies) {
      product.allergens?.forEach(allergen => {
        if (profile.allergies.some(userAllergy => 
          userAllergy.toLowerCase().includes(allergen.toLowerCase())
        )) {
          warnings.push(`⚠️ Cảnh báo: Sản phẩm chứa ${allergen} - bạn có thể bị dị ứng`);
        }
      });
    }
    
    if (profile.chronicDiseases?.toLowerCase().includes('tiểu đường') && 
        product.nutritionFacts?.sugar > 20) {
      warnings.push('⚠️ Hàm lượng đường cao có thể ảnh hưởng đến đường huyết');
    }
    
    return warnings;
  };

  const generatePersonalizedBenefits = (product, profile) => {
    const benefits = [];
    
    if (profile.age && profile.age > 50) {
      benefits.push('Hỗ trợ sức khỏe tim mạch và xương khớp');
    }
    
    if (profile.healthGoals?.toLowerCase().includes('tăng cơ')) {
      benefits.push('Hàm lượng protein cao hỗ trợ phát triển cơ bắp');
    }
    
    if (profile.gender === 'Nữ') {
      benefits.push('Cung cấp dinh dưỡng cần thiết cho phụ nữ');
    }
    
    return benefits;
  };

  // Sử dụng dữ liệu thực từ API, không có fallback data
  const data = analysisData;

  const handleBack = () => {
    router.push('/screens/HomeScreen');
  };

  const handleSaveAnalysis = async () => {
    if (!analysisData) {
      Alert.alert('Lỗi', 'Không có dữ liệu phân tích để lưu');
      return;
    }

    try {
      const result = await saveScanResult(analysisData, personalizedAnalysis);
      
      if (result.success) {
        Alert.alert(
          'Thành công', 
          result.message,
          [
            {
              text: 'Xem lịch sử',
              onPress: () => router.push('/AnalysisHistoryScreen')
            },
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', result.message);
      }
    } catch (error) {
      console.error('Lỗi lưu kết quả:', error);
      Alert.alert('Lỗi', 'Không thể lưu kết quả phân tích');
    }
  };

  const handleShareResult = () => {
    Alert.alert('Chia sẻ', 'Tính năng chia sẻ sẽ được cập nhật sớm!');
  };

  const handleChatBot = () => {
    router.push('/ChatBotScreen');
  };

  const handleQuestionPress = (question) => {
    // Navigate to ChatBotScreen với câu hỏi được truyền qua params
    router.push({
      pathname: '/ChatBotScreen',
      params: { 
        initialQuestion: question,
        productName: data.product_name || data.productName || 'Sản phẩm',
        productBrand: data.brand || 'Không xác định'
      }
    });
  };

  const renderMarkdownContent = (markdownText) => {
    if (!markdownText) return null;
    
    const lines = markdownText.split('\n');
    const sections = [];
    let currentSection = null;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // Tiêu đề section
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine.replace(/\*\*/g, ''),
          content: []
        };
      } else if (trimmedLine.startsWith('- ') && currentSection) {
        // Danh sách
        currentSection.content.push({
          type: 'list',
          text: trimmedLine.substring(2)
        });
      } else if (trimmedLine.startsWith('  • ') && currentSection) {
        // Sub-list
        currentSection.content.push({
          type: 'sublist',
          text: trimmedLine.substring(4)
        });
      } else if (trimmedLine && currentSection) {
        // Text thường
        currentSection.content.push({
          type: 'text',
          text: trimmedLine
        });
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections.map((section, sectionIndex) => (
      <View key={sectionIndex} style={styles.markdownSection}>
        <Text style={styles.markdownTitle}>{section.title}</Text>
        {section.content.map((item, itemIndex) => (
          <View key={itemIndex} style={styles.markdownItem}>
            {item.type === 'list' && (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text style={styles.markdownListText}>{item.text}</Text>
              </>
            )}
            {item.type === 'sublist' && (
              <>
                <Ionicons name="ellipse" size={8} color="#6b7280" />
                <Text style={styles.markdownSublistText}>{item.text}</Text>
              </>
            )}
            {item.type === 'text' && (
              <Text style={styles.markdownText}>{item.text}</Text>
            )}
          </View>
        ))}
      </View>
    ));
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Kết Quả Phân Tích</Text>
            <Text style={styles.headerSubtitle}>Thông tin chi tiết sản phẩm</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareResult}>
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hiển thị khi không có dữ liệu */}
        {!data && (
          <View style={styles.noDataContainer}>
            <Ionicons name="scan-outline" size={80} color="#9ca3af" />
            <Text style={styles.noDataTitle}>Chưa có dữ liệu phân tích</Text>
            <Text style={styles.noDataSubtitle}>Hãy quét sản phẩm để xem kết quả phân tích</Text>
            <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/screens/ScanProductScreen')}>
              <Ionicons name="camera" size={20} color="white" />
              <Text style={styles.scanButtonText}>Quét sản phẩm</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Personalized Analysis - hiển thị đầu tiên khi có dữ liệu */}
        {personalizedAnalysis && userProfile && (
          <View style={styles.personalizedCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={24} color="#ec4899" />
              <Text style={styles.cardTitle}>Phân tích cá nhân hóa</Text>
            </View>
            
            {/* Compatibility Score */}
            <View style={styles.compatibilitySection}>
              <Text style={styles.compatibilityLabel}>Độ phù hợp với bạn</Text>
              <View style={styles.compatibilityScoreContainer}>
                <View style={styles.compatibilityCircle}>
                  <Text style={[
                    styles.compatibilityNumber, 
                    { color: getHealthScoreColor(personalizedAnalysis.compatibilityScore) }
                  ]}>
                    {personalizedAnalysis.compatibilityScore}
                  </Text>
                  <Text style={styles.compatibilityLabelSmall}>/100</Text>
                </View>
                <View style={styles.compatibilityInfo}>
                  <Text style={styles.compatibilityText}>
                    {personalizedAnalysis.compatibilityScore >= 80 ? 'Rất phù hợp' :
                     personalizedAnalysis.compatibilityScore >= 60 ? 'Khá phù hợp' :
                     personalizedAnalysis.compatibilityScore >= 40 ? 'Cần cân nhắc' : 'Không phù hợp'}
                  </Text>
                  <Text style={styles.compatibilitySubtext}>
                    Dựa trên hồ sơ sức khỏe của bạn
                  </Text>
                </View>
              </View>
            </View>

            {/* Health Impact */}
            {personalizedAnalysis.healthImpact.length > 0 && (
              <View style={styles.healthImpactSection}>
                <Text style={styles.sectionTitle}>Tác động sức khỏe</Text>
                {personalizedAnalysis.healthImpact.map((impact, index) => (
                  <View key={index} style={styles.impactItem}>
                    <Ionicons name="trending-up" size={16} color="#ec4899" />
                    <Text style={styles.impactText}>{impact}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Personalized Recommendations */}
            {personalizedAnalysis.recommendations.length > 0 && (
              <View style={styles.personalizedRecommendationsSection}>
                <Text style={styles.sectionTitle}>Khuyến nghị cho bạn</Text>
                {personalizedAnalysis.recommendations.map((rec, index) => (
                  <View key={index} style={styles.personalizedRecItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#ec4899" />
                    <Text style={styles.personalizedRecText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Personalized Warnings */}
            {personalizedAnalysis.warnings.length > 0 && (
              <View style={styles.personalizedWarningsSection}>
                <Text style={styles.sectionTitle}>Cảnh báo cá nhân</Text>
                {personalizedAnalysis.warnings.map((warning, index) => (
                  <View key={index} style={styles.personalizedWarningItem}>
                    <Ionicons name="warning" size={16} color="#ef4444" />
                    <Text style={styles.personalizedWarningText}>{warning}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Personalized Benefits */}
            {personalizedAnalysis.benefits.length > 0 && (
              <View style={styles.personalizedBenefitsSection}>
                <Text style={styles.sectionTitle}>Lợi ích cho bạn</Text>
                {personalizedAnalysis.benefits.map((benefit, index) => (
                  <View key={index} style={styles.personalizedBenefitItem}>
                    <Ionicons name="star" size={16} color="#ec4899" />
                    <Text style={styles.personalizedBenefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Nutrition Facts - chỉ hiển thị khi có dữ liệu */}
        {data && (
          <View style={styles.nutritionCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="nutrition" size={24} color="#22C55E" />
              <Text style={styles.cardTitle}>Thông tin dinh dưỡng</Text>
            </View>
            <View style={styles.nutritionGrid}>
              {data.nutrition_facts?.nutrients?.length > 0 ? (
                data.nutrition_facts.nutrients.map((nutrient, index) => (
                  <View key={index} style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>{nutrient.name}</Text>
                    <Text style={styles.nutritionValue}>
                      {nutrient.amount} {nutrient.unit || ''}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>Không có thông tin dinh dưỡng</Text>
              )}
            </View>
          </View>
        )}

        {/* Ingredients - chỉ hiển thị khi có dữ liệu */}
        {data && data.ingredients && data.ingredients.length > 0 && (
          <View style={styles.benefitsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              <Text style={styles.cardTitle}>Thành phần</Text>
            </View>
            {data.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark" size={16} color="#22C55E" />
                <Text style={styles.benefitText}>
                  {typeof ingredient === 'string' ? ingredient : ingredient?.name || ingredient?.text || JSON.stringify(ingredient)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Warnings - chỉ hiển thị khi có dữ liệu */}
        {data && data.warnings && data.warnings.length > 0 && (
          <View style={styles.warningsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="warning" size={24} color="#f59e0b" />
              <Text style={styles.cardTitle}>Cảnh báo</Text>
            </View>
            {data.warnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Ionicons name="alert-circle" size={16} color="#f59e0b" />
                <Text style={styles.warningText}>
                  {typeof warning === 'string' ? warning : warning?.name || warning?.text || JSON.stringify(warning)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Allergens - chỉ hiển thị khi có dữ liệu */}
        {data && data.allergens && data.allergens.length > 0 && (
          <View style={styles.allergensCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="medical" size={24} color="#ef4444" />
              <Text style={styles.cardTitle}>Chất gây dị ứng</Text>
            </View>
            <View style={styles.allergensList}>
              {data.allergens.map((allergen, index) => (
                <View key={index} style={styles.allergenItem}>
                  <Ionicons name="warning" size={16} color="#ef4444" />
                  <Text style={styles.allergenText}>
                    {typeof allergen === 'string' ? allergen : allergen?.name || allergen?.text || JSON.stringify(allergen)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recommendations - chỉ hiển thị khi có dữ liệu */}
        {data && data.recommendations && data.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb" size={24} color="#22C55E" />
              <Text style={styles.cardTitle}>Khuyến nghị sử dụng</Text>
            </View>
            {data.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Ionicons name="star" size={16} color="#22C55E" />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Detailed Analysis from Server */}
        {detailedAnalysis && (
          <View style={styles.detailedAnalysisCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics" size={24} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Phân tích chi tiết từ AI</Text>
            </View>
            {renderMarkdownContent(detailedAnalysis.detailed_analysis_markdown)}
          </View>
        )}

        {/* Loading Detailed Analysis */}
        {loadingDetailedAnalysis && (
          <View style={styles.loadingCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="hourglass" size={24} color="#6b7280" />
              <Text style={styles.cardTitle}>Đang phân tích chi tiết...</Text>
            </View>
            <View style={styles.loadingContent}>
              <Text style={styles.loadingText}>AI đang phân tích sản phẩm dựa trên hồ sơ sức khỏe của bạn</Text>
            </View>
          </View>
        )}


        {/* AI Analysis - chỉ hiển thị khi có dữ liệu */}
        {data && (data.ai_confidence || data.analysis_time || data.ai_model) && (
          <View style={styles.aiAnalysisCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics" size={24} color="#8b5cf6" />
              <Text style={styles.cardTitle}>Phân tích AI</Text>
            </View>
            <View style={styles.aiAnalysisContent}>
              {data.ai_confidence && (
                <View style={styles.aiMetric}>
                  <Text style={styles.aiMetricLabel}>Độ tin cậy</Text>
                  <Text style={styles.aiMetricValue}>{data.ai_confidence}</Text>
                </View>
              )}
              {data.analysis_time && (
                <View style={styles.aiMetric}>
                  <Text style={styles.aiMetricLabel}>Thời gian phân tích</Text>
                  <Text style={styles.aiMetricValue}>{data.analysis_time}</Text>
                </View>
              )}
              {data.ai_model && (
                <View style={styles.aiMetric}>
                  <Text style={styles.aiMetricLabel}>Mô hình AI</Text>
                  <Text style={styles.aiMetricValue}>{data.ai_model}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Smart Insights - chỉ hiển thị khi có dữ liệu */}
        {data && data.ai_insights && data.ai_insights.length > 0 && (
          <View style={styles.insightsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="brain" size={24} color="#06b6d4" />
              <Text style={styles.cardTitle}>Thông tin thông minh</Text>
            </View>
            <View style={styles.insightsList}>
              {data.ai_insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Ionicons name="lightbulb" size={16} color="#06b6d4" />
                  <Text style={styles.insightText}>
                    {typeof insight === 'string' ? insight : insight?.text || insight?.description || JSON.stringify(insight)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Health Recommendations - chỉ hiển thị khi có dữ liệu */}
        {data && data.health_recommendations && data.health_recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="medical" size={24} color="#10b981" />
              <Text style={styles.cardTitle}>Khuyến nghị sức khỏe</Text>
            </View>
            <View style={styles.recommendationsList}>
              {data.health_recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.recommendationText}>
                    {typeof rec === 'string' ? rec : rec?.text || rec?.recommendation || JSON.stringify(rec)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Product Tags - chỉ hiển thị khi có dữ liệu */}
        {data && data.product_tags && data.product_tags.length > 0 && (
          <View style={styles.tagsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="pricetag" size={24} color="#f59e0b" />
              <Text style={styles.cardTitle}>Nhãn sản phẩm</Text>
            </View>
            <View style={styles.tagsContainer}>
              {data.product_tags.map((tag, index) => (
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagText}>
                    {typeof tag === 'string' ? tag : tag?.name || tag?.label || JSON.stringify(tag)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAnalysis}>
            <Ionicons name="bookmark" size={20} color="white" />
            <Text style={styles.saveButtonText}>Lưu kết quả</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.scanAgainButton} onPress={() => router.push('/screens/ScanProductScreen')}>
            <Ionicons name="camera" size={20} color="#22C55E" />
            <Text style={styles.scanAgainButtonText}>Quét tiếp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating ChatBot with Sample Questions - chỉ hiển thị khi có dữ liệu */}
      {data && (
        <View style={styles.chatbotContainer}>
          {/* Sample Questions */}
          <View style={styles.sampleQuestions}>
            <TouchableOpacity style={styles.questionBubble} onPress={() => handleQuestionPress(`Có sản phẩm nào tốt hơn ${data.product_name || data.productName || 'sản phẩm này'} không?`)}>
              <Text style={styles.questionText}>Có sản phẩm nào tốt hơn không?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.questionBubble} onPress={() => handleQuestionPress(`Phân tích chi tiết ${data.product_name || data.productName || 'sản phẩm này'}?`)}>
              <Text style={styles.questionText}>Phân tích chi tiết</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.questionBubble} onPress={() => handleQuestionPress(`Lợi ích sức khỏe của ${data.product_name || data.productName || 'sản phẩm này'} là gì?`)}>
              <Text style={styles.questionText}>Lợi ích sức khỏe?</Text>
            </TouchableOpacity>
          </View>
          
          {/* ChatBot Button */}
          <TouchableOpacity style={styles.chatbotButton} onPress={handleChatBot}>
            <Ionicons name="chatbubble" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    position: 'relative',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#22C55E',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  noDataTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  nutritionCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  noDataText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  // AI Analysis Styles
  aiAnalysisCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aiAnalysisContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  aiMetric: {
    alignItems: 'center',
    flex: 1,
  },
  aiMetricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  aiMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  // Smart Insights Styles
  insightsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  insightsList: {
    marginTop: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  // Health Recommendations Styles
  recommendationsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recommendationsList: {
    marginTop: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  // Product Tags Styles
  tagsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  tagItem: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  tagText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  // Personalized Analysis Styles
  personalizedCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  compatibilitySection: {
    marginTop: 16,
  },
  compatibilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  compatibilityScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compatibilityCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#fce7f3',
    shadowColor: '#ec4899',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compatibilityNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  compatibilityLabelSmall: {
    fontSize: 12,
    color: '#6b7280',
  },
  compatibilityInfo: {
    flex: 1,
  },
  compatibilityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  compatibilitySubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 16,
  },
  healthImpactSection: {
    marginTop: 16,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  impactText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  personalizedRecommendationsSection: {
    marginTop: 16,
  },
  personalizedRecItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  personalizedRecText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  personalizedWarningsSection: {
    marginTop: 16,
  },
  personalizedWarningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  personalizedWarningText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  personalizedBenefitsSection: {
    marginTop: 16,
  },
  personalizedBenefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  personalizedBenefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  benefitsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#22C55E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  warningsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#f59e0b',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  allergensCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  allergensList: {
    marginTop: 8,
  },
  allergenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  allergenText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
  },
  // Original recommendations card styles (removed duplicate)
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scanAgainButton: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  scanAgainButtonText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  chatbotContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  sampleQuestions: {
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  questionBubble: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  questionText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'right',
    lineHeight: 18,
  },
  chatbotButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  // Detailed Analysis Styles
  detailedAnalysisCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContent: {
    marginTop: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Markdown Content Styles
  markdownSection: {
    marginBottom: 20,
  },
  markdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  markdownItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  markdownListText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  markdownSublistText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  markdownText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
});

export default ProductAnalysisScreen;