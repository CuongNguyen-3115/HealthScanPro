import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const HealthScanChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Xin chào! Tôi là HealthScan AI - trợ lý sức khỏe thông minh của bạn. Hãy chụp ảnh thành phần của sản phẩm hoặc đặt câu hỏi về sức khỏe nhé! 🌿',
      timestamp: new Date().toLocaleString('vi-VN'),
      date: new Date().toLocaleDateString('vi-VN')
    }
  ]);
  
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      title: 'Tư vấn sản phẩm dinh dưỡng',
      lastMessage: 'Sản phẩm này có an toàn cho trẻ em không?',
      timestamp: '2 giờ trước',
      messages: 5,
      date: '4/9/2025'
    },
    {
      id: 2,
      title: 'Kiểm tra thành phần bánh kẹo',
      lastMessage: 'Có chứa chất bảo quản có hại không?',
      timestamp: '1 ngày trước',
      messages: 8,
      date: '3/9/2025'
    },
    {
      id: 3,
      title: 'Phân tích vitamin tổng hợp',
      lastMessage: 'Liều lượng này có phù hợp không?',
      timestamp: '3 ngày trước',
      messages: 12,
      date: '1/9/2025'
    },
    {
      id: 4,
      title: 'Tư vấn sữa bột cho bé',
      lastMessage: 'Thành phần nào tốt cho phát triển não bộ?',
      timestamp: '1 tuần trước',
      messages: 6,
      date: '28/8/2025'
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showQuestions, setShowQuestions] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showQuickQuestionsModal, setShowQuickQuestionsModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollViewRef = useRef(null);
  const recordingAnimation = useRef(new Animated.Value(1)).current;

  const suggestedQuestions = [
    { text: 'Sản phẩm này có an toàn cho trẻ em không?', category: 'An toàn' },
    { text: 'Thành phần nào trong sản phẩm này có thể gây dị ứng?', category: 'Dị ứng' },
    { text: 'Sản phẩm này có phù hợp với người tiểu đường không?', category: 'Sức khỏe' },
    { text: 'Có sản phẩm nào tốt hơn không?', category: 'Thay thế' },
    { text: 'Tác dụng phụ của sản phẩm này là gì?', category: 'Tác dụng phụ' },
    { text: 'Hướng dẫn sử dụng sản phẩm này như thế nào?', category: 'Hướng dẫn' }
  ];

  const quickQuestions = [
    { text: 'Sản phẩm này có an toàn cho trẻ em không?', category: 'An toàn' },
    { text: 'Thành phần nào trong sản phẩm này có thể gây dị ứng?', category: 'Dị ứng' },
    { text: 'Sản phẩm này có phù hợp với người tiểu đường không?', category: 'Sức khỏe' },
    { text: 'Có sản phẩm nào tốt hơn không?', category: 'Thay thế' },
    { text: 'Tác dụng phụ của sản phẩm này là gì?', category: 'Tác dụng phụ' },
    { text: 'Hướng dẫn sử dụng sản phẩm này như thế nào?', category: 'Hướng dẫn' },
    { text: 'Sản phẩm này có chứa chất bảo quản có hại không?', category: 'An toàn' },
    { text: 'Liều lượng sử dụng hàng ngày là bao nhiêu?', category: 'Hướng dẫn' },
    { text: 'Có thể dùng cho phụ nữ mang thai không?', category: 'Sức khỏe' },
    { text: 'Thành phần tự nhiên chiếm bao nhiêu phần trăm?', category: 'Thành phần' },
    { text: 'Sản phẩm này có tương tác với thuốc không?', category: 'An toàn' },
    { text: 'Cách bảo quản sản phẩm như thế nào?', category: 'Hướng dẫn' }
  ];

  useEffect(() => {
    if (isRecording) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isRecording) pulse();
        });
      };
      pulse();
    } else {
      recordingAnimation.setValue(1);
    }
  }, [isRecording, recordingAnimation]);

  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      fullDateTime: now.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      timeOnly: now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      dateOnly: now.toLocaleDateString('vi-VN')
    };
  };

  const sendMessage = async (text) => {
  if (!text.trim()) return;

  const dateTime = getCurrentDateTime();

  // Thêm tin nhắn người dùng vào UI
  const userMessage = {
    id: Date.now(),
    type: "user",
    text,
    timestamp: dateTime.fullDateTime,
    date: dateTime.dateOnly,
  };
  setMessages((prev) => [...prev, userMessage]);
  setInputText("");
  setShowQuestions(false);
  setShowMenu(false);

  try {
    // Gọi API chatbot (server.js trong chatbot-demo)
    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await res.json();

    // Thêm câu trả lời của bot vào UI
    const botMessage = {
      id: Date.now() + 1,
      type: "bot",
      text: data.reply || "⚠️ Bot không trả lời",
      timestamp: new Date().toLocaleString("vi-VN"),
      date: new Date().toLocaleDateString("vi-VN"),
    };
    setMessages((prev) => [...prev, botMessage]);
  } catch (err) {
    console.error("❌ Lỗi gọi API chatbot:", err);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        type: "bot",
        text: "❌ Có lỗi khi kết nối server chatbot.",
        timestamp: new Date().toLocaleString("vi-VN"),
        date: new Date().toLocaleDateString("vi-VN"),
      },
    ]);
  }
};

  const getBotResponse = (userText) => {
    const responses = [
      'Dựa trên thành phần bạn cung cấp, tôi thấy sản phẩm này chứa một số chất có thể gây dị ứng như gluten và lactose. Bạn có tiền sử dị ứng với những chất này không?',
      'Sản phẩm này có chứa 15g đường và các chất bảo quản E200, E211. Tôi khuyên bạn nên hạn chế sử dụng nếu đang kiểm soát đường huyết hoặc có tiền sử tiểu đường.',
      'Thành phần này khá an toàn cho trẻ em trên 3 tuổi. Tuy nhiên, nên sử dụng theo liều lượng: 1-2 viên/ngày cho trẻ 3-6 tuổi, 2-3 viên/ngày cho trẻ trên 6 tuổi.',
      'Tôi đã phân tích thành phần và tìm thấy một số lựa chọn tốt hơn cho sức khỏe của bạn với ít đường và nhiều vitamin tự nhiên hơn. Bạn có muốn xem gợi ý không?',
      'Sản phẩm này chứa 85% thành phần tự nhiên, không có chất tạo màu nhân tạo. Tác dụng phụ hiếm gặp, có thể gây khó tiêu nhẹ ở một số người nhạy cảm.',
      'Liều lượng khuyến nghị: Người lớn 2-3 lần/ngày, mỗi lần 1-2 viên, uống sau bữa ăn 30 phút. Không nên vượt quá 6 viên/ngày.'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const speakResponse = (text) => {
    setIsSpeaking(true);
    // Simulate text-to-speech duration
    setTimeout(() => {
      setIsSpeaking(false);
    }, Math.min(text.length * 50, 5000));
  };

  const handleVoicePress = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      Alert.alert('Ghi âm hoàn tất', 'Đang xử lý giọng nói của bạn...');
    } else {
      // Start recording
      setIsRecording(true);
      Alert.alert('Bắt đầu ghi âm', 'Hãy nói câu hỏi của bạn...');
      
      // Simulate voice recording for 3-5 seconds
      setTimeout(() => {
        setIsRecording(false);
        const voiceTexts = [
          'Sản phẩm này có an toàn cho trẻ em không?',
          'Thành phần nào có thể gây dị ứng?',
          'Có sản phẩm tốt hơn không?',
          'Liều lượng sử dụng như thế nào?'
        ];
        const voiceText = voiceTexts[Math.floor(Math.random() * voiceTexts.length)];
        sendMessage(voiceText);
      }, Math.random() * 2000 + 2000);
    }
  };

  const handleQuestionPress = (question) => {
    sendMessage(question);
    setShowQuickQuestionsModal(false);
  };

  const handleHistoryPress = (historyItem) => {
    setShowHistoryModal(false);
    // Simulate loading chat history
    Alert.alert(
      'Tải lịch sử chat',
      `Đang tải cuộc trò chuyện: "${historyItem.title}"\nNgày: ${historyItem.date}\nTin nhắn: ${historyItem.messages}`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Tải', 
          onPress: () => {
            // Here you would load the actual chat history
            console.log('Loading chat history:', historyItem);
          }
        }
      ]
    );
  };

  const clearCurrentChat = () => {
    Alert.alert(
      'Xóa cuộc trò chuyện',
      'Bạn có chắc muốn xóa cuộc trò chuyện hiện tại?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setMessages([{
              id: Date.now(),
              type: 'bot',
              text: 'Xin chào! Tôi là HealthScan AI - trợ lý sức khỏe thông minh của bạn. Hãy chụp ảnh thành phần của sản phẩm hoặc đặt câu hỏi về sức khỏe nhé! 🌿',
              timestamp: getCurrentDateTime().fullDateTime,
              date: getCurrentDateTime().dateOnly
            }]);
            setShowQuestions(true);
            setShowMenu(false);
          }
        }
      ]
    );
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistoryPress(item)}
    >
      <View style={styles.historyItemContent}>
        <Text style={styles.historyItemTitle}>{item.title}</Text>
        <Text style={styles.historyItemMessage}>{item.lastMessage}</Text>
        <View style={styles.historyItemInfo}>
          <Text style={styles.historyItemTime}>{item.timestamp}</Text>
          <Text style={styles.historyItemCount}>{item.messages} tin nhắn</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderQuickQuestion = ({ item, index }) => (
    <TouchableOpacity
      style={styles.quickQuestionItem}
      onPress={() => handleQuestionPress(item.text)}
    >
      <View style={styles.quickQuestionHeader}>
        <Text style={styles.quickQuestionCategory}>{item.category}</Text>
      </View>
      <Text style={styles.quickQuestionText}>{item.text}</Text>
    </TouchableOpacity>
  );

  const renderMessage = (message) => {
    const isBot = message.type === 'bot';
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isBot ? styles.botMessageContainer : styles.userMessageContainer
      ]}>
        {isBot && (
          <View style={styles.botAvatarContainer}>
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>🤖</Text>
            </View>
            {isSpeaking && (
              <View style={styles.speakingIndicator}>
                <Text style={styles.speakingText}>🔊</Text>
              </View>
            )}
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isBot ? styles.botMessage : styles.userMessage
        ]}>
          <Text style={[
            styles.messageText,
            isBot ? styles.botMessageText : styles.userMessageText
          ]}>
            {message.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isBot ? styles.botMessageTime : styles.userMessageTime
          ]}>
            {message.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  const renderSuggestedQuestion = (question, index) => (
    <TouchableOpacity
      key={index}
      style={styles.questionCard}
      onPress={() => handleQuestionPress(question.text)}
    >
      <View style={styles.questionHeader}>
        <Text style={styles.questionCategory}>{question.category}</Text>
      </View>
      <Text style={styles.questionText}>{question.text}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Ionicons name="add" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          <Text style={styles.headerTime}>
            {new Date().toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        
        {showMenu && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowHistoryModal(true);
                setShowMenu(false);
              }}
            >
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.menuItemText}>Lịch sử chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowQuickQuestionsModal(true);
                setShowMenu(false);
              }}
            >
              <Ionicons name="help-circle" size={20} color="#666" />
              <Text style={styles.menuItemText}>Câu hỏi nhanh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={clearCurrentChat}
            >
              <Ionicons name="trash" size={20} color="#f44336" />
              <Text style={[styles.menuItemText, { color: '#f44336' }]}>Xóa chat hiện tại</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="medical" size={24} color="#4CAF50" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Chào mừng đến với HealthScan</Text>
              <Text style={styles.headerSubtitle}>
                AI thông minh giúp phân tích thành phần sản phẩm và tư vấn sức khỏe cá nhân hóa
              </Text>
              <View style={styles.headerTags}>
                <View style={styles.tag}>
                  <Ionicons name="analytics" size={12} color="#4CAF50" />
                  <Text style={styles.tagText}>AI Analysis</Text>
                </View>
                <View style={styles.tag}>
                  <Ionicons name="shield-checkmark" size={12} color="#4CAF50" />
                  <Text style={styles.tagText}>Tư vấn an toàn</Text>
                </View>
              </View>
            </View>
          </View>
          <Image
            source={{ uri: 'https://via.placeholder.com/80x80/4CAF50/FFFFFF?text=🥗' }}
            style={styles.headerImage}
          />
        </View>
      </View>

      {/* Suggested Questions */}
      {showQuestions && (
        <View style={styles.questionsSection}>
          <View style={styles.questionsTitleContainer}>
            <Ionicons name="help-circle" size={20} color="#666" />
            <Text style={styles.questionsTitle}>Câu hỏi thường gặp</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.questionsScroll}
          >
            {suggestedQuestions.map(renderSuggestedQuestion)}
          </ScrollView>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      {/* Footer Note */}
      <View style={styles.footer}>
        <Ionicons name="information-circle" size={16} color="#999" />
        <Text style={styles.footerText}>
          Nhập vào câu hỏi để bắt đầu tìm hiểu về HealthScan AI
        </Text>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Đặt câu hỏi về sức khỏe hoặc sản phẩm..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
            onPress={handleVoicePress}
          >
            <Animated.View
              style={[
                styles.voiceButtonInner,
                { transform: [{ scale: recordingAnimation }] }
              ]}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={20}
                color={isRecording ? "#f44336" : "#666"}
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() && styles.sendButtonActive]}
            onPress={() => sendMessage(inputText)}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? "#fff" : "#999"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lịch sử chat</Text>
            <TouchableOpacity
              onPress={() => setShowHistoryModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={chatHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.historyList}
          />
        </SafeAreaView>
      </Modal>

      {/* Quick Questions Modal */}
      <Modal
        visible={showQuickQuestionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuickQuestionsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Câu hỏi nhanh</Text>
            <TouchableOpacity
              onPress={() => setShowQuickQuestionsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={quickQuestions}
            renderItem={renderQuickQuestion}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.quickQuestionsList}
            numColumns={1}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  headerTime: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  headerTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  headerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginLeft: 16,
  },
  questionsSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingVertical: 16,
  },
  questionsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  questionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  questionsScroll: {
    paddingLeft: 16,
  },
  questionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  questionHeader: {
    marginBottom: 8,
  },
  questionCategory: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botAvatarContainer: {
    alignItems: 'center',
    marginRight: 8,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatarText: {
    fontSize: 16,
  },
  speakingIndicator: {
    marginTop: 4,
  },
  speakingText: {
    fontSize: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  botMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  botMessageText: {
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  botMessageTime: {
    color: '#666',
  },
  userMessageTime: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 8,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceButtonRecording: {
    backgroundColor: '#ffebee',
    shadowColor: '#f44336',
  },
  voiceButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  sendButtonActive: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyList: {
    paddingVertical: 16,
  },
  historyItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyItemMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  historyItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemTime: {
    fontSize: 12,
    color: '#999',
  },
  historyItemCount: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  quickQuestionsList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  quickQuestionItem: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  quickQuestionHeader: {
    marginBottom: 8,
  },
  quickQuestionCategory: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textTransform: 'uppercase',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  quickQuestionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default HealthScanChatbot;