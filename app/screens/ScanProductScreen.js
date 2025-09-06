import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ScrollView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

const ScanProductScreen = () => {
  const [selectedMode, setSelectedMode] = useState('camera');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  let cameraRef = null;

  const handleBack = () => {
    router.push('/screens/HomeScreen');
  };

  const handleOpenCamera = async () => {
    if (!permission) {
      const permissionResponse = await requestPermission();
      if (!permissionResponse.granted) {
        Alert.alert('Cần quyền truy cập camera', 'Vui lòng cấp quyền camera để chụp ảnh sản phẩm.');
        return;
      }
    }
    
    if (permission.granted) {
      setIsCameraOpen(true);
    } else {
      Alert.alert('Cần quyền truy cập camera', 'Vui lòng cấp quyền camera để chụp ảnh sản phẩm.');
    }
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false);
    setCapturedImage(null);
  };

  const handleTakePicture = async (cameraRef) => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo.uri);
        setIsCameraOpen(false);
      } catch (_error) {
        Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      }
    }
  };

  const handleRetakePicture = () => {
    setCapturedImage(null);
    setIsCameraOpen(true);
  };

  const handleAnalyzeImage = () => {
    if (capturedImage) {
      router.push('/screens/ProductAnalysisScreen');
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  const renderModeButton = (mode, icon, label) => (
    <TouchableOpacity 
      style={[
        styles.modeButton, 
        selectedMode === mode && styles.modeButtonActive
      ]} 
      onPress={() => handleModeSelect(mode)}
    >
      <Ionicons 
        name={icon} 
        size={24} 
        color={selectedMode === mode ? '#22C55E' : '#6b7280'} 
      />
      <Text style={[
        styles.modeButtonText,
        selectedMode === mode && styles.modeButtonTextActive
      ]}>
        {label}
      </Text>
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
            <Text style={styles.headerTitle}>Quét Sản Phẩm</Text>
            <Text style={styles.headerSubtitle}>Phân tích cho hồ sơ của bạn</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Mode Selection */}
        <View style={styles.modeSelection}>
          {renderModeButton('camera', 'camera', 'Camera')}
          {renderModeButton('upload', 'cloud-upload', 'Tải lên')}
          {renderModeButton('barcode', 'barcode', 'Mã vạch')}
          {renderModeButton('search', 'search', 'Tìm kiếm')}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {selectedMode === 'camera' && (
            <View style={styles.cameraCard}>
              {capturedImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                  <View style={styles.imageActions}>
                    <TouchableOpacity style={styles.retakeButton} onPress={handleRetakePicture}>
                      <Ionicons name="camera" size={20} color="#22C55E" />
                      <Text style={styles.retakeText}>Chụp lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzeImage}>
                      <Ionicons name="analytics" size={20} color="white" />
                      <Text style={styles.analyzeText}>Phân tích</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.cameraIcon}>
                    <Ionicons name="camera" size={60} color="#22C55E" />
                  </View>
                  <Text style={styles.cameraTitle}>Chụp Ảnh Sản Phẩm</Text>
                  <Text style={styles.cameraInstruction}>
                    Hướng camera vào nhãn thành phần của sản phẩm
                  </Text>
                  <TouchableOpacity style={styles.openCameraButton} onPress={handleOpenCamera}>
                    <Ionicons name="camera" size={24} color="white" />
                    <Text style={styles.openCameraText}>Mở Camera</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {selectedMode === 'upload' && (
            <View style={styles.uploadCard}>
              <View style={styles.uploadIcon}>
                <Ionicons name="cloud-upload" size={60} color="#22C55E" />
              </View>
              <Text style={styles.uploadTitle}>Tải Lên Ảnh</Text>
              <Text style={styles.uploadInstruction}>
                Chọn ảnh từ thư viện để phân tích thành phần sản phẩm
              </Text>
              <TouchableOpacity style={styles.uploadButton}>
                <Ionicons name="folder-open" size={24} color="white" />
                <Text style={styles.uploadText}>Chọn Ảnh</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedMode === 'barcode' && (
            <View style={styles.barcodeCard}>
              <View style={styles.barcodeIcon}>
                <Ionicons name="barcode" size={60} color="#22C55E" />
              </View>
              <Text style={styles.barcodeTitle}>Quét Mã Vạch</Text>
              <Text style={styles.barcodeInstruction}>
                Quét mã vạch sản phẩm để tìm thông tin dinh dưỡng
              </Text>
              <TouchableOpacity style={styles.barcodeButton}>
                <Ionicons name="scan" size={24} color="white" />
                <Text style={styles.barcodeText}>Quét Mã Vạch</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedMode === 'search' && (
            <View style={styles.searchCard}>
              <View style={styles.searchIcon}>
                <Ionicons name="search" size={60} color="#22C55E" />
              </View>
              <Text style={styles.searchTitle}>Tìm Kiếm Sản Phẩm</Text>
              <Text style={styles.searchInstruction}>
                Nhập tên sản phẩm để tìm thông tin dinh dưỡng
              </Text>
              <TouchableOpacity style={styles.searchButton}>
                <Ionicons name="search" size={24} color="white" />
                <Text style={styles.searchText}>Tìm Kiếm</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tips Section */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={24} color="#22C55E" />
              <Text style={styles.tipsTitle}>Mẹo để có kết quả tốt nhất:</Text>
            </View>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• Ánh sáng tốt khi chụp ảnh</Text>
              <Text style={styles.tipItem}>• Chụp rõ nhãn thành phần</Text>
              <Text style={styles.tipItem}>• Tránh bóng phản quang</Text>
              <Text style={styles.tipItem}>• Chụp toàn bộ danh sách</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal
        visible={isCameraOpen}
        animationType="slide"
        onRequestClose={handleCloseCamera}
      >
        <View style={styles.cameraModal}>
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={(ref) => { cameraRef = ref; }}
          >
            <View style={styles.cameraOverlay}>
              {/* Header */}
              <View style={styles.cameraHeader}>
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseCamera}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.cameraModalTitle}>Chụp ảnh sản phẩm</Text>
                <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                  <Ionicons name="camera-reverse" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {/* Camera Frame */}
              <View style={styles.cameraFrame}>
                <View style={styles.frameCorner} />
                <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
                <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
                <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
              </View>

              {/* Bottom Controls */}
              <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.captureButton} onPress={() => handleTakePicture(cameraRef)}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  modeSelection: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 8,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: 'white',
  },
  modeButtonText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#22C55E',
    fontWeight: '600',
  },
  mainContent: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  cameraCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
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
  uploadCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
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
  barcodeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
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
  searchCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
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
  cameraIcon: {
    marginBottom: 16,
  },
  uploadIcon: {
    marginBottom: 16,
  },
  barcodeIcon: {
    marginBottom: 16,
  },
  searchIcon: {
    marginBottom: 16,
  },
  cameraTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  barcodeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  cameraInstruction: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  uploadInstruction: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  barcodeInstruction: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  searchInstruction: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  openCameraButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  uploadButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  barcodeButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  searchButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  openCameraText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  uploadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  barcodeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tipsCard: {
    backgroundColor: 'white',
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
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  // Image Preview Styles
  imagePreviewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  retakeText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  analyzeButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  analyzeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Camera Modal Styles
  cameraModal: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  cameraModalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flipButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  cameraFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: '#22C55E',
    top: 0,
    left: 0,
  },
  frameCornerTopRight: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    top: 0,
    right: 0,
    left: 'auto',
  },
  frameCornerBottomLeft: {
    borderTopWidth: 0,
    borderBottomWidth: 3,
    bottom: 0,
    top: 'auto',
  },
  frameCornerBottomRight: {
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
  },
  cameraControls: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
});

export default ScanProductScreen;