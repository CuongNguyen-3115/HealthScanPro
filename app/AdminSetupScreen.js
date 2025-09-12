import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';

const AdminSetupScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [adminCreated, setAdminCreated] = useState(false);

  const { checkConnection, createAdminAccount } = useUser();

  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      const result = await checkConnection();
      if (result.success) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const handleCreateAdmin = async () => {
    setIsLoading(true);
    
    try {
      const result = await createAdminAccount();
      
      if (result.success) {
        setAdminCreated(true);
        Alert.alert(
          'Thành công', 
          'Tài khoản admin đã được tạo thành công!\n\nUsername: admin\nPassword: admin123',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Lỗi', result.error);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo tài khoản admin');
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#22C55E';
      case 'disconnected': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Đã kết nối';
      case 'disconnected': return 'Không thể kết nối';
      default: return 'Đang kiểm tra...';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="settings-outline" size={60} color="#22C55E" />
          <Text style={styles.title}>Thiết lập Admin</Text>
          <Text style={styles.subtitle}>
            Tạo tài khoản quản trị viên cho ứng dụng
          </Text>
        </View>

        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="wifi-outline" size={24} color={getConnectionStatusColor()} />
            <Text style={styles.statusTitle}>Trạng thái kết nối</Text>
          </View>
          <Text style={[styles.statusText, { color: getConnectionStatusColor() }]}>
            {getConnectionStatusText()}
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={checkServerConnection}
          >
            <Ionicons name="refresh-outline" size={20} color="#22C55E" />
            <Text style={styles.refreshText}>Kiểm tra lại</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Account Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
            <Text style={styles.infoTitle}>Thông tin tài khoản Admin</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>• Username: admin</Text>
            <Text style={styles.infoText}>• Password: admin123</Text>
            <Text style={styles.infoText}>• Email: admin@healthscanpro.com</Text>
            <Text style={styles.infoText}>• Quyền: Quản trị viên (toàn quyền)</Text>
          </View>
        </View>

        {/* Create Admin Button */}
        <TouchableOpacity 
          style={[
            styles.createButton, 
            (isLoading || adminCreated || connectionStatus !== 'connected') && styles.createButtonDisabled
          ]} 
          onPress={handleCreateAdmin}
          disabled={isLoading || adminCreated || connectionStatus !== 'connected'}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : adminCreated ? (
            <>
              <Ionicons name="checkmark-circle-outline" size={24} color="white" />
              <Text style={styles.createButtonText}>Đã tạo Admin</Text>
            </>
          ) : (
            <>
              <Ionicons name="person-add-outline" size={24} color="white" />
              <Text style={styles.createButtonText}>Tạo tài khoản Admin</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={24} color="#F59E0B" />
          <Text style={styles.warningText}>
            Lưu ý: Chỉ tạo tài khoản admin một lần duy nhất. 
            Sau khi tạo thành công, hãy đổi mật khẩu để bảo mật.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  refreshText: {
    fontSize: 14,
    color: '#22C55E',
    marginLeft: 4,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  infoContent: {
    paddingLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  createButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default AdminSetupScreen;
