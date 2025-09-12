import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const ChatHistoryScreen = () => {
  const [chatHistory, setChatHistory] = useState([
    {
      id: 'chat_1_20240115',
      title: 'Tư vấn về sản phẩm sữa',
      preview: 'Có sản phẩm nào tốt hơn không?',
      timestamp: '2024-01-15 14:30',
      messageCount: 5,
      lastMessage: 'Cảm ơn bạn đã hỏi! Tôi đang phân tích câu hỏi của bạn...',
      productName: 'Sữa tươi Vinamilk'
    },
    {
      id: 'chat_2_20240114', 
      title: 'Phân tích dinh dưỡng',
      preview: 'Phân tích chi tiết các chất?',
      timestamp: '2024-01-14 10:15',
      messageCount: 8,
      lastMessage: 'Dựa trên phân tích, sản phẩm này có hàm lượng protein cao...',
      productName: 'Bánh mì sandwich'
    },
    {
      id: 'chat_3_20240113',
      title: 'Hỏi về vitamin',
      preview: 'Vitamin D có tác dụng gì?',
      timestamp: '2024-01-13 16:45',
      messageCount: 3,
      lastMessage: 'Vitamin D giúp hấp thụ canxi và duy trì xương chắc khỏe...',
      productName: 'Viên uống Vitamin D3'
    },
    {
      id: 'chat_4_20240112',
      title: 'Tư vấn về thực phẩm chức năng',
      preview: 'Có nên uống collagen không?',
      timestamp: '2024-01-12 09:20',
      messageCount: 6,
      lastMessage: 'Collagen có thể giúp cải thiện làn da và khớp xương...',
      productName: 'Collagen Peptide'
    },
    {
      id: 'chat_5_20240111',
      title: 'Phân tích thành phần mỹ phẩm',
      preview: 'Kem dưỡng này có an toàn không?',
      timestamp: '2024-01-11 15:30',
      messageCount: 4,
      lastMessage: 'Kem này chứa các thành phần tự nhiên và an toàn...',
      productName: 'Kem dưỡng ẩm'
    }
  ]);

  const handleBack = () => {
    router.push('/screens/ChatBotScreen');
  };

  const handleChatItem = (item) => {
    // Navigate to ChatDetailScreen with specific chat ID
    router.push({
      pathname: '/screens/ChatDetailScreen',
      params: { 
        chatId: item.id,
        chatTitle: item.title
      }
    });
  };

  const handleDeleteChat = (chatId) => {
    setChatHistory(prev => prev.filter(item => item.id !== chatId));
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem} 
      onPress={() => handleChatItem(item)}
    >
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <View style={styles.chatIcon}>
            <Ionicons name="chatbubble" size={20} color="#22C55E" />
          </View>
          <View style={styles.chatInfo}>
            <Text style={styles.chatTitle}>{item.title}</Text>
            <Text style={styles.productName}>{item.productName}</Text>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteChat(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.chatPreview}>{item.preview}</Text>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
        
        <View style={styles.chatFooter}>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
          <View style={styles.messageCount}>
            <Ionicons name="chatbubbles" size={14} color="#22C55E" />
            <Text style={styles.messageCountText}>{item.messageCount} tin nhắn</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Lịch sử chat</Text>
            <Text style={styles.headerSubtitle}>Các cuộc trò chuyện đã lưu</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {chatHistory.length > 0 ? (
          <FlatList
            data={chatHistory}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={64} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có lịch sử chat</Text>
            <Text style={styles.emptyDescription}>
              Bắt đầu trò chuyện với AI để lưu lại lịch sử
            </Text>
            <TouchableOpacity 
              style={styles.startChatButton}
              onPress={() => router.push('/screens/ChatBotScreen')}
            >
              <Text style={styles.startChatText}>Bắt đầu chat</Text>
            </TouchableOpacity>
          </View>
        )}
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
    fontSize: 20,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  chatItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  productName: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  chatPreview: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  lastMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  messageCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageCountText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  startChatButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startChatText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatHistoryScreen;
