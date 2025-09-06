import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const ChatBotScreen = () => {
  const params = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 'welcome_1',
      text: 'Xin chào! Tôi là HealthScan AI - trợ lý sức khỏe thông minh của bạn. Hãy chụp ảnh thành phần của sản phẩm hoặc đặt câu hỏi về sức khỏe nhé! 👋',
      isAI: true,
      timestamp: '19:51:13'
    }
  ]);

  // Helper function to generate unique IDs
  const generateUniqueId = (prefix) => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.floor(Math.random() * 10000)}`;
  };

  // Debounce timer
  const [sendTimer, setSendTimer] = useState(null);
  // Flag to prevent multiple sends
  const [isSending, setIsSending] = useState(false);
  // Ref to track if initial question was sent
  const initialQuestionSent = useRef(false);

  const handleBack = () => {
    router.push('/screens/HomeScreen');
  };

  const toggleChatHistory = () => {
    router.push('/screens/ChatHistoryScreen');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 5000); // 5 giây

    return () => clearTimeout(timer);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (sendTimer) {
        clearTimeout(sendTimer);
      }
      setIsSending(false); // Reset sending flag
    };
  }, [sendTimer]);

  const handleSendMessage = useCallback((customMessage = null) => {
    // Prevent multiple sends
    if (isSending) {
      console.log('Already sending message, skipping...');
      return;
    }
    
    // Clear existing timer
    if (sendTimer) {
      clearTimeout(sendTimer);
      setSendTimer(null);
    }
    
    const messageToSend = customMessage || message;
    console.log('handleSendMessage called with:', messageToSend);
    console.log('message state:', message);
    console.log('customMessage:', customMessage);
    
    if (messageToSend && typeof messageToSend === 'string' && messageToSend.trim()) {
      console.log('Sending message:', messageToSend);
      
      // Set sending flag
      setIsSending(true);
      
      // Ẩn welcome section khi gửi tin nhắn đầu tiên
      if (showWelcome) {
        setShowWelcome(false);
      }
      
      // Kiểm tra duplicate message
      const trimmedMessage = messageToSend.trim();
      const isDuplicate = messages.some(msg => 
        msg.text.trim() === trimmedMessage && !msg.isAI
      );
      
      if (isDuplicate) {
        console.log('Duplicate message detected, skipping...');
        setIsSending(false);
        return;
      }
      
      const newMessage = {
        id: generateUniqueId('user'),
        text: messageToSend,
        isAI: false,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }).slice(0, 8)
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: generateUniqueId('ai'),
          text: 'Cảm ơn bạn đã hỏi! Tôi đang phân tích câu hỏi của bạn và sẽ trả lời sớm nhất có thể.',
          isAI: true,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }).slice(0, 8)
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsSending(false); // Reset sending flag
      }, 1000);
    } else {
      console.log('Message validation failed:', { 
        messageToSend, 
        type: typeof messageToSend,
        trimmed: messageToSend ? messageToSend.trim() : 'N/A'
      });
      setIsSending(false);
    }
  }, [message, showWelcome, messages, sendTimer, isSending]);

  // Tự động input và gửi câu hỏi từ ProductAnalysisScreen
  useEffect(() => {
    if (params.initialQuestion && typeof params.initialQuestion === 'string' && !initialQuestionSent.current) {
      initialQuestionSent.current = true; // Mark as sent
      setMessage(params.initialQuestion);
      setShowWelcome(false); // Ẩn welcome section ngay lập tức
      
      // Tự động gửi câu hỏi sau một khoảng thời gian ngắn
      setTimeout(() => {
        handleSendMessage(params.initialQuestion);
      }, 500);
    }
  }, [params.initialQuestion, handleSendMessage]);

  const renderMessage = (item) => (
    <View key={item.id} style={[styles.messageContainer, item.isAI ? styles.aiMessage : styles.userMessage]}>
      <View style={[styles.messageBubble, item.isAI ? styles.aiBubble : styles.userBubble]}>
        <Text style={[styles.messageText, item.isAI ? styles.aiText : styles.userText]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={24} color="white" />
              <Ionicons name="checkmark" size={12} color="#22C55E" style={styles.checkIcon} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>HealthScan</Text>
              <Text style={styles.headerSubtitle}>Trợ lý sức khỏe thông minh</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.historyButton} onPress={toggleChatHistory}>
            <Ionicons name="time-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Section */}
        {showWelcome && (
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeContent}>
              <View style={styles.welcomeHeader}>
                <Ionicons name="sparkles" size={24} color="#22C55E" />
                <Text style={styles.welcomeTitle}>Chào mừng đến với HealthScan</Text>
              </View>
              <Text style={styles.welcomeDescription}>
                AI thông minh giúp phân tích thành phần sản phẩm và tư vấn sức khỏe cá nhân hóa
              </Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="analytics" size={16} color="#22C55E" />
                  </View>
                  <Text style={styles.actionText}>AI Analysis</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
                  </View>
                  <Text style={styles.actionText}>Tư vấn an toàn</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.welcomeImage}>
              <Image 
                source={require('../../assets/images/logo.png')} 
                style={styles.illustrationImage}
              />
            </View>
          </View>
        )}

        {/* Chat Messages */}
        <View style={styles.chatSection}>
          {messages.map(renderMessage)}
        </View>
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Đặt câu hỏi về sức khỏe hoặc sản phẩm..."
          value={message}
          onChangeText={(text) => {
            console.log('TextInput onChangeText:', text);
            setMessage(text);
          }}
          multiline
        />
        <TouchableOpacity style={styles.voiceButton}>
          <Ionicons name="mic" size={24} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={() => {
          console.log('Send button pressed');
          handleSendMessage();
        }}>
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  checkIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 2,
  },
  titleContainer: {
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
  placeholder: {
    width: 40,
  },
  historyButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  welcomeSection: {
    backgroundColor: '#f0fdf4',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  welcomeContent: {
    flex: 1,
    marginRight: 16,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  welcomeDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  welcomeImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  chatSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    minHeight: 200,
  },
  messageContainer: {
    marginBottom: 12,
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  aiBubble: {
    backgroundColor: '#f0fdf4',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#22C55E',
    borderBottomRightRadius: 4,
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
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
    maxHeight: 100,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#22C55E',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatBotScreen;