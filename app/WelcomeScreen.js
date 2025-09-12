import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar
} from 'react-native';
import { router } from 'expo-router';

const WelcomeScreen = () => {
  console.log('WelcomeScreen is rendering'); // Debug log

  const handleGetStarted = () => {
    console.log('Get Started pressed');
    router.push('/LoginScreen');
  };

  const handleSkip = () => {
    console.log('Skip pressed');
    router.push('/LoginScreen');
  };

  const handleAdminSetup = () => {
    console.log('Admin Setup pressed');
    router.push('/AdminSetupScreen');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logo}
          />
        </View>
        
        <Text style={styles.appName}>HealthScan Pro</Text>
        
        <Text style={styles.welcomeText}>
          Chào mừng bạn đến với ứng dụng quét sản phẩm thông minh
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedText}>Bắt đầu</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.adminButton} onPress={handleAdminSetup}>
            <Text style={styles.adminText}>Thiết lập Admin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 20,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#22C55E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 50,
  },
  buttonContainer: {
    width: '100%',
  },
  getStartedButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  getStartedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 16,
  },
  skipText: {
    color: '#22C55E',
    fontSize: 16,
    textAlign: 'center',
  },
  adminButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  adminText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;