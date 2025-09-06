import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const ProductAnalysisScreen = () => {
  const [analysisData] = useState({
    productName: 'Sữa tươi Vinamilk',
    brand: 'Vinamilk',
    image: require('../../assets/images/logo.png'),
    healthScore: 85,
    nutritionFacts: {
      calories: 150,
      protein: 8,
      carbs: 12,
      fat: 8,
      sugar: 12,
      sodium: 120,
      calcium: 300,
      vitaminD: 2.5
    },
    allergens: ['Sữa', 'Đường lactose'],
    benefits: [
      'Hàm lượng protein cao, tốt cho sự phát triển cơ bắp',
      'Chứa canxi và vitamin D, hỗ trợ xương chắc khỏe',
      'Cung cấp năng lượng cần thiết cho cơ thể'
    ],
    warnings: [
      'Hàm lượng đường khá cao, nên sử dụng vừa phải',
      'Có thể gây dị ứng với người không dung nạp lactose'
    ],
    recommendations: [
      'Phù hợp cho trẻ em và người lớn',
      'Nên uống vào buổi sáng hoặc sau tập luyện',
      'Bảo quản trong tủ lạnh và sử dụng trước hạn'
    ]
  });

  const handleBack = () => {
    router.push('/screens/HomeScreen');
  };

  const handleSaveAnalysis = () => {
    Alert.alert('Thành công', 'Kết quả phân tích đã được lưu vào lịch sử!');
  };

  const handleShareResult = () => {
    Alert.alert('Chia sẻ', 'Tính năng chia sẻ sẽ được cập nhật sớm!');
  };

  const handleChatBot = () => {
    router.push('/screens/ChatBotScreen');
  };

  const handleQuestionPress = (question) => {
    // Navigate to ChatBotScreen với câu hỏi được truyền qua params
    router.push({
      pathname: '/screens/ChatBotScreen',
      params: { 
        initialQuestion: question,
        productName: analysisData.productName,
        productBrand: analysisData.brand
      }
    });
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getHealthScoreText = (score) => {
    if (score >= 80) return 'Tốt';
    if (score >= 60) return 'Trung bình';
    return 'Cần cải thiện';
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
        {/* Product Info */}
        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <Image source={analysisData.image} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{analysisData.productName}</Text>
              <Text style={styles.productBrand}>{analysisData.brand}</Text>
              <View style={styles.healthScoreContainer}>
                <View style={styles.scoreCircle}>
                  <Text style={[styles.scoreNumber, { color: getHealthScoreColor(analysisData.healthScore) }]}>
                    {analysisData.healthScore}
                  </Text>
                  <Text style={styles.scoreLabel}>/100</Text>
                </View>
                <View style={styles.scoreInfo}>
                  <Text style={styles.scoreTitle}>Điểm sức khỏe</Text>
                  <Text style={[styles.scoreText, { color: getHealthScoreColor(analysisData.healthScore) }]}>
                    {getHealthScoreText(analysisData.healthScore)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Nutrition Facts */}
        <View style={styles.nutritionCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="nutrition" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Thông tin dinh dưỡng</Text>
          </View>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Calories</Text>
              <Text style={styles.nutritionValue}>{analysisData.nutritionFacts.calories}</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protein</Text>
              <Text style={styles.nutritionValue}>{analysisData.nutritionFacts.protein}g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Carbs</Text>
              <Text style={styles.nutritionValue}>{analysisData.nutritionFacts.carbs}g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Fat</Text>
              <Text style={styles.nutritionValue}>{analysisData.nutritionFacts.fat}g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Sugar</Text>
              <Text style={styles.nutritionValue}>{analysisData.nutritionFacts.sugar}g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Sodium</Text>
              <Text style={styles.nutritionValue}>{analysisData.nutritionFacts.sodium}mg</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Calcium</Text>
              <Text style={styles.nutritionValue}>{analysisData.nutritionFacts.calcium}mg</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Vitamin D</Text>
              <Text style={styles.nutritionValue}>{analysisData.nutritionFacts.vitaminD}μg</Text>
            </View>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Lợi ích sức khỏe</Text>
          </View>
          {analysisData.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons name="checkmark" size={16} color="#22C55E" />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Warnings */}
        <View style={styles.warningsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="warning" size={24} color="#f59e0b" />
            <Text style={styles.cardTitle}>Lưu ý quan trọng</Text>
          </View>
          {analysisData.warnings.map((warning, index) => (
            <View key={index} style={styles.warningItem}>
              <Ionicons name="alert-circle" size={16} color="#f59e0b" />
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          ))}
        </View>

        {/* Allergens */}
        <View style={styles.allergensCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="medical" size={24} color="#ef4444" />
            <Text style={styles.cardTitle}>Chất gây dị ứng</Text>
          </View>
          <View style={styles.allergensList}>
            {analysisData.allergens.map((allergen, index) => (
              <View key={index} style={styles.allergenItem}>
                <Ionicons name="warning" size={16} color="#ef4444" />
                <Text style={styles.allergenText}>{allergen}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="bulb" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Khuyến nghị sử dụng</Text>
          </View>
          {analysisData.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="star" size={16} color="#22C55E" />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>

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

      {/* Floating ChatBot with Sample Questions */}
      <View style={styles.chatbotContainer}>
        {/* Sample Questions */}
        <View style={styles.sampleQuestions}>
          <TouchableOpacity style={styles.questionBubble} onPress={() => handleQuestionPress('Có sản phẩm nào tốt hơn không?')}>
            <Text style={styles.questionText}>Có sản phẩm nào tốt hơn không?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.questionBubble} onPress={() => handleQuestionPress('Phân tích chi tiết các chất?')}>
            <Text style={styles.questionText}>Phân tích chi tiết các chất?</Text>
          </TouchableOpacity>
        </View>
        
        {/* ChatBot Button */}
        <TouchableOpacity style={styles.chatbotButton} onPress={handleChatBot}>
          <Ionicons name="chatbubble" size={24} color="white" />
        </TouchableOpacity>
      </View>
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
  productCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
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
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 3,
    borderColor: '#dcfce7',
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  recommendationsCard: {
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
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
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
});

export default ProductAnalysisScreen;