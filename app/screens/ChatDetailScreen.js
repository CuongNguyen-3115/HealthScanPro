import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const ChatDetailScreen = () => {
  const params = useLocalSearchParams();
  const chatId = params.chatId;
  
  // Sample chat data - trong thực tế sẽ load từ API hoặc storage
  const chatData = {
    'chat_1_20240115': {
      id: 'chat_1_20240115',
      title: 'Tư vấn về sản phẩm sữa',
      productName: 'Sữa tươi Vinamilk',
      timestamp: '2024-01-15 14:30',
      messages: [
        {
          id: 'msg_1_welcome',
          text: 'Xin chào! Tôi là HealthScan AI - trợ lý sức khỏe thông minh của bạn. Hãy chụp ảnh thành phần của sản phẩm hoặc đặt câu hỏi về sức khỏe nhé! 👋',
          isAI: true,
          timestamp: '14:30:15'
        },
        {
          id: 'msg_2_user_1',
          text: 'Có sản phẩm nào tốt hơn không?',
          isAI: false,
          timestamp: '14:30:45'
        },
        {
          id: 'msg_3_ai_1',
          text: 'Dựa trên phân tích sản phẩm sữa Vinamilk, tôi có thể đề xuất một số sản phẩm sữa tốt hơn:\n\n🥛 **Sữa tươi nguyên chất**: Chứa nhiều protein và canxi tự nhiên\n🥛 **Sữa hữu cơ**: Không chứa hormone và kháng sinh\n🥛 **Sữa ít đường**: Phù hợp cho người ăn kiêng\n\nBạn có muốn tôi phân tích chi tiết thành phần dinh dưỡng của từng loại không?',
          isAI: true,
          timestamp: '14:31:20'
        },
        {
          id: 'msg_4_user_2',
          text: 'Phân tích chi tiết các chất?',
          isAI: false,
          timestamp: '14:31:55'
        },
        {
          id: 'msg_5_ai_2',
          text: '**Phân tích chi tiết thành phần sữa Vinamilk:**\n\n📊 **Protein**: 3.2g/100ml - Tốt cho cơ bắp\n📊 **Canxi**: 120mg/100ml - Tăng cường xương\n📊 **Vitamin D**: 2.5mcg/100ml - Hấp thụ canxi\n📊 **Đường**: 4.8g/100ml - Mức trung bình\n📊 **Chất béo**: 3.5g/100ml - Cân bằng\n\n**Đánh giá tổng thể**: 8.5/10 - Sản phẩm chất lượng tốt!',
          isAI: true,
          timestamp: '14:32:30'
        }
      ]
    },
    'chat_2_20240114': {
      id: 'chat_2_20240114',
      title: 'Phân tích dinh dưỡng',
      productName: 'Bánh mì sandwich',
      timestamp: '2024-01-14 10:15',
      messages: [
        {
          id: 'msg_1_welcome_2',
          text: 'Xin chào! Tôi là HealthScan AI - trợ lý sức khỏe thông minh của bạn. Hãy chụp ảnh thành phần của sản phẩm hoặc đặt câu hỏi về sức khỏe nhé! 👋',
          isAI: true,
          timestamp: '10:15:10'
        },
        {
          id: 'msg_2_user_1_2',
          text: 'Phân tích chi tiết các chất?',
          isAI: false,
          timestamp: '10:15:35'
        },
        {
          id: 'msg_3_ai_1_2',
          text: '**Phân tích chi tiết bánh mì sandwich Kinh Đô:**\n\n🍞 **Carbohydrate**: 45g/100g - Nguồn năng lượng chính\n🍞 **Protein**: 8g/100g - Tốt cho cơ bắp\n🍞 **Chất xơ**: 2.5g/100g - Hỗ trợ tiêu hóa\n🍞 **Natrium**: 450mg/100g - Cần chú ý\n🍞 **Chất béo**: 3.2g/100g - Mức thấp\n\n**Lưu ý**: Hàm lượng muối cao, nên ăn vừa phải!',
          isAI: true,
          timestamp: '10:16:15'
        },
        {
          id: 'msg_4_user_2_2',
          text: 'Có nên ăn thường xuyên không?',
          isAI: false,
          timestamp: '10:16:45'
        },
        {
          id: 'msg_5_ai_2_2',
          text: '**Khuyến nghị sử dụng:**\n\n✅ **Tốt**: Chứa protein và chất xơ\n⚠️ **Cần chú ý**: Hàm lượng muối cao\n\n**Tần suất**: 2-3 lần/tuần là phù hợp\n**Kết hợp**: Ăn kèm rau xanh và protein\n\nBạn có thể thay thế bằng bánh mì nguyên cám để tốt hơn!',
          isAI: true,
          timestamp: '10:17:20'
        }
      ]
    },
    'chat_3_20240113': {
      id: 'chat_3_20240113',
      title: 'Hỏi về vitamin',
      productName: 'Viên uống Vitamin D3',
      timestamp: '2024-01-13 16:45',
      messages: [
        {
          id: 'msg_1_welcome_3',
          text: 'Xin chào! Tôi là HealthScan AI - trợ lý sức khỏe thông minh của bạn. Hãy chụp ảnh thành phần của sản phẩm hoặc đặt câu hỏi về sức khỏe nhé! 👋',
          isAI: true,
          timestamp: '16:45:12'
        },
        {
          id: 'msg_2_user_1_3',
          text: 'Vitamin D có tác dụng gì?',
          isAI: false,
          timestamp: '16:45:38'
        },
        {
          id: 'msg_3_ai_1_3',
          text: '**Vitamin D3 có nhiều tác dụng quan trọng:**\n\n🦴 **Hấp thụ canxi**: Giúp xương chắc khỏe\n🦴 **Tăng cường miễn dịch**: Chống lại bệnh tật\n🦴 **Hỗ trợ tim mạch**: Giảm nguy cơ tim mạch\n🦴 **Cải thiện tâm trạng**: Giảm trầm cảm\n\n**Liều lượng**: 1000-2000 IU/ngày cho người lớn',
          isAI: true,
          timestamp: '16:46:15'
        }
      ]
    }
  };

  const currentChat = chatData[chatId] || chatData['chat_1_20240115'];

  const handleBack = () => {
    router.push('/screens/ChatHistoryScreen');
  };

  const renderMessage = (message) => (
    <View key={message.id} style={[styles.messageContainer, message.isAI ? styles.aiMessage : styles.userMessage]}>
      <View style={[styles.messageBubble, message.isAI ? styles.aiBubble : styles.userBubble]}>
        <Text style={[styles.messageText, message.isAI ? styles.aiText : styles.userText]}>
          {message.text}
        </Text>
        <Text style={styles.timestamp}>{message.timestamp}</Text>
      </View>
    </View>
  );

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
            <Text style={styles.headerTitle}>{currentChat.title}</Text>
            <Text style={styles.headerSubtitle}>{currentChat.productName}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      {/* Chat Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.chatContainer}>
          {currentChat.messages.map(renderMessage)}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push({
            pathname: '/screens/ChatBotScreen',
            params: { 
              initialQuestion: 'Tiếp tục cuộc trò chuyện về ' + currentChat.productName
            }
          })}
        >
          <Ionicons name="chatbubble" size={20} color="white" />
          <Text style={styles.actionText}>Tiếp tục chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share" size={20} color="white" />
          <Text style={styles.actionText}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    position: 'relative',
    paddingTop: 50,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  chatContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  messageContainer: {
    marginBottom: 16,
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#22C55E',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiText: {
    color: '#374151',
  },
  userText: {
    color: 'white',
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    flex: 0.45,
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ChatDetailScreen;
