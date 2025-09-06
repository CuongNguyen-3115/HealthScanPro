import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Select Method, 3: Enter OTP, 4: New Password, 5: Success
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('email'); // 'email' or 'sms'

  const handleRequestOTP = () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }
    setStep(2);
  };

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setStep(3);
  };

  const handleEnterOTP = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 4) {
      // Focus next input logic would go here
    }
  };

  const handleConfirmOTP = () => {
    const otpString = otp.join('');
    if (otpString.length !== 5) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ OTP');
      return;
    }
    setStep(4);
  };

  const handleUpdatePassword = () => {
    if (!newPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    setStep(5);
  };

  const handleContinueToSignIn = () => {
    router.replace('/screens/LoginScreen');
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Forgot password?</Text>
      <Text style={styles.stepSubtitle}>
        Nhập email đã đăng ký để nhận mã OTP khôi phục mật khẩu
      </Text>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your register email/mobile number"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <TouchableOpacity onPress={handleRequestOTP} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Request OTP</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select contact detail</Text>
      <Text style={styles.stepSubtitle}>
        Chọn phương thức nhận mã OTP
      </Text>
      
      <View style={styles.methodOptions}>
        <TouchableOpacity 
          style={[styles.methodOption, selectedMethod === 'sms' && styles.methodOptionSelected]}
          onPress={() => handleSelectMethod('sms')}
        >
          <View style={styles.methodCheckbox}>
            {selectedMethod === 'sms' && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodLabel}>Via SMS</Text>
            <Text style={styles.methodValue}>...1946</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.methodOption, selectedMethod === 'email' && styles.methodOptionSelected]}
          onPress={() => handleSelectMethod('email')}
        >
          <View style={styles.methodCheckbox}>
            {selectedMethod === 'email' && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
          <View style={styles.methodInfo}>
            <Text style={styles.methodLabel}>Via Email</Text>
            <Text style={styles.methodValue}>...12@email.com</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => handleSelectMethod(selectedMethod)} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Request OTP</Text>
      </TouchableOpacity>

      <Text style={styles.infoText}>
        We sent you OTP to your register email/mobile number. If you didnt get click here
      </Text>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter your OTP</Text>
      <Text style={styles.stepSubtitle}>
        Nhập mã OTP 5 số đã được gửi đến {selectedMethod === 'email' ? 'email' : 'số điện thoại'} của bạn
      </Text>
      
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.otpInput}
            value={digit}
            onChangeText={(value) => handleEnterOTP(index, value)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            placeholder="0"
            placeholderTextColor="#ccc"
          />
        ))}
      </View>

      <TouchableOpacity onPress={handleConfirmOTP} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Confirm</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton}>
        <Text style={styles.resendButtonText}>Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create new password</Text>
      <Text style={styles.stepSubtitle}>
        Tạo mật khẩu mới cho tài khoản của bạn
      </Text>
      
      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!isPasswordVisible}
            placeholderTextColor="#999"
          />
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.passwordToggle}
          >
            <Ionicons 
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!isConfirmPasswordVisible}
            placeholderTextColor="#999"
          />
          <TouchableOpacity 
            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
            style={styles.passwordToggle}
          >
            <Ionicons 
              name={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.passwordStrength}>
        <Text style={styles.passwordStrengthText}>Password strength: Medium</Text>
      </View>

      <TouchableOpacity onPress={handleUpdatePassword} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Update Password</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successIcon}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={60} color="white" />
        </View>
      </View>
      
      <Text style={styles.successTitle}>Congratulations!</Text>
      <Text style={styles.successSubtitle}>
        You have successfully Changed your password
      </Text>

      <TouchableOpacity onPress={handleContinueToSignIn} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Continue to sign in</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, isWeb && styles.webContent]}>
        {/* Left Panel - Welcome Section */}
        <View style={[styles.leftPanel, isWeb && styles.webLeftPanel]}>
          <View style={styles.welcomeContent}>
            <View style={styles.appIcon}>
              <View style={styles.shieldIcon}>
                <Ionicons name="shield-checkmark" size={40} color="white" />
              </View>
            </View>
            
            <Text style={styles.appName}>HealthScan Pro</Text>
            <Text style={styles.welcomeTitle}>RECOVER</Text>
            <Text style={styles.welcomeText}>
              Khôi phục mật khẩu để tiếp tục sử dụng ứng dụng. 
              Chúng tôi sẽ gửi mã OTP để xác minh danh tính của bạn.
            </Text>
          </View>
        </View>

        {/* Right Panel - Form */}
        <View style={[styles.rightPanel, isWeb && styles.webRightPanel]}>
          <View style={styles.formContainer}>
            {/* Header */}
            <View style={styles.formHeader}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Step Content */}
            {renderCurrentStep()}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  webContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    display: isWeb ? 'flex' : 'none',
  },
  webLeftPanel: {
    display: 'flex',
  },
  welcomeContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  appIcon: {
    marginBottom: 30,
  },
  shieldIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#93c5fd',
    marginBottom: 15,
    letterSpacing: 2,
  },
  welcomeText: {
    fontSize: 16,
    color: '#dbeafe',
    textAlign: 'center',
    lineHeight: 24,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    padding: 40,
  },
  webRightPanel: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formContainer: {
    maxWidth: 400,
    width: '100%',
  },
  formHeader: {
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  stepContainer: {
    gap: 30,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  passwordToggle: {
    padding: 8,
  },
  primaryButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  methodOptions: {
    gap: 15,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  methodOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  methodCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  methodValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  passwordStrength: {
    alignItems: 'center',
  },
  passwordStrengthText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '500',
  },
  resendButton: {
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ForgotPasswordScreen;


