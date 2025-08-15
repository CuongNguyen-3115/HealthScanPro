// app/ScanProductScreen.js
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import CameraScannerService from '../services/CameraScannerService';

const { width } = Dimensions.get('window');
const TAB_KEYS = { CAMERA:'camera', UPLOAD:'upload', BARCODE:'barcode', SEARCH:'search' };

export default function ScanProductScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(TAB_KEYS.CAMERA);
  const [searchText, setSearchText] = useState('');
  const [photoUri, setPhotoUri] = useState(null);

  // chụp ảnh xong thì navigate
  const handleTakePhoto = async () => {
    const granted = await CameraScannerService.requestCameraPermission();
    if (!granted) {
      return alert('Bạn cần cấp quyền camera để chụp ảnh!');
    }

    const uri = await CameraScannerService.openCamera();
    if (!uri) {
      return; // user hủy hoặc lỗi
    }

    setPhotoUri(uri);
    router.push({
      pathname: '/ProductAnalysisScreen',
      params: { 
        photoUri: uri,
        // nếu bạn đã có productName, ingredients..., truyền thêm ở đây
      },
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case TAB_KEYS.CAMERA:
        return (
          <>
            {photoUri && (
              <Image source={{ uri: photoUri }}
                     style={styles.previewImage}
                     resizeMode="cover" />
            )}
            <Ionicons name="camera" size={60} color="#198754" style={styles.icon} />
            <Text style={styles.contentTitle}>Chụp Ảnh Sản Phẩm</Text>
            <Text style={styles.contentSubtitle}>
              Hướng camera vào nhãn thành phần của sản phẩm
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Mở Camera</Text>
            </TouchableOpacity>
          </>
        );

      case TAB_KEYS.UPLOAD:
        return (
          <>
            <MaterialIcons name="file-upload" size={60} color="#198754" style={styles.icon} />
            <Text style={styles.contentTitle}>Tải Ảnh Lên</Text>
            <Text style={styles.contentSubtitle}>
              Chọn ảnh nhãn thành phần từ thư viện
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => alert('Chức năng Tải lên đang phát triển')}>
              <MaterialIcons name="file-upload" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Chọn Ảnh</Text>
            </TouchableOpacity>
          </>
        );

      case TAB_KEYS.BARCODE:
        return (
          <>
            <FontAwesome name="barcode" size={60} color="#198754" style={styles.icon} />
            <Text style={styles.contentTitle}>Quét Mã Vạch</Text>
            <Text style={styles.contentSubtitle}>
              Hướng camera vào mã vạch sản phẩm
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => alert('Chức năng Quét mã vạch đang phát triển')}>
              <FontAwesome name="barcode" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Quét Mã Vạch</Text>
            </TouchableOpacity>
          </>
        );

      case TAB_KEYS.SEARCH:
        return (
          <>
            <Ionicons name="search" size={60} color="#198754" style={styles.icon} />
            <Text style={styles.contentTitle}>Tìm Kiếm Sản Phẩm</Text>
            <Text style={styles.contentSubtitle}>
              Nhập tên sản phẩm để tra cứu thông tin
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Coca Cola…"
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => alert(`Tìm: ${searchText}`)}>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Tìm Kiếm</Text>
            </TouchableOpacity>
          </>
        );

      default:
        return null;
    }
  };

  const TabButton = ({ icon, label, tabKey }) => (
    <TouchableOpacity
      style={[
        styles.tab,
        activeTab === tabKey && styles.activeTab,
        { width: width / 4 - 8 },
      ]}
      onPress={() => setActiveTab(tabKey)}>
      {icon}
      <Text style={[styles.tabText, activeTab === tabKey && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.title}>Quét Sản Phẩm</Text>
      <Text style={styles.subtitle}>Phân tích cho hồ sơ của bạn</Text>

      <View style={styles.tabContainer}>
        <TabButton icon={<Ionicons name="camera-outline" size={20} color="#198754" />} label="Camera" tabKey={TAB_KEYS.CAMERA}/>
        <TabButton icon={<MaterialIcons name="file-upload" size={20} color="#198754" />} label="Tải lên"  tabKey={TAB_KEYS.UPLOAD}/>
        <TabButton icon={<FontAwesome name="barcode" size={20} color="#198754" />}     label="Mã vạch"  tabKey={TAB_KEYS.BARCODE}/>
        <TabButton icon={<Ionicons name="search-outline" size={20} color="#198754" />} label="Tìm kiếm" tabKey={TAB_KEYS.SEARCH}/>
      </View>

      <View style={styles.contentBox}>{renderContent()}</View>

      <ScrollView style={styles.tipsBox} showsVerticalScrollIndicator={false}>
        <Text style={styles.tipsTitle}>💡 Mẹo để có kết quả tốt nhất:</Text>
        <Text style={styles.tip}>• Ánh sáng tốt khi chụp ảnh</Text>
        <Text style={styles.tip}>• Chụp rõ nhãn thành phần</Text>
        <Text style={styles.tip}>• Tránh bóng phản quang</Text>
        <Text style={styles.tip}>• Chụp toàn bộ danh sách</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#f3fdf7', paddingTop:50, paddingHorizontal:16 },
  backButton:   { position:'absolute', top:50, left:16, zIndex:10 },
  title:        { fontSize:22, fontWeight:'700', textAlign:'center', color:'#0a0a0a' },
  subtitle:     { fontSize:14, textAlign:'center', color:'#555', marginBottom:20 },
  tabContainer: { flexDirection:'row', justifyContent:'space-between', backgroundColor:'#fff', borderRadius:10, paddingVertical:10, elevation:1, marginBottom:16 },
  tab:          { alignItems:'center', paddingVertical:6 },
  tabText:      { fontSize:12, color:'#555', marginTop:4 },
  activeTab:    { backgroundColor:'#e9f9f1', borderRadius:8 },
  activeTabText:{ color:'#198754', fontWeight:'600' },
  contentBox:   { backgroundColor:'#fff', borderRadius:10, alignItems:'center', padding:24, elevation:3, minHeight:260, justifyContent:'center' },
  icon:         { marginBottom:10 },
  contentTitle:  { fontSize:16, fontWeight:'700', color:'#222' },
  contentSubtitle:{ fontSize:13, color:'#666', marginBottom:20, textAlign:'center' },
  primaryBtn:    { backgroundColor:'#198754', flexDirection:'row', paddingVertical:12, paddingHorizontal:24, borderRadius:8, alignItems:'center', gap:8 },
  primaryBtnText:{ color:'#fff', fontWeight:'bold', marginLeft:6 },
  previewImage:  { width:200, height:200, borderRadius:8, marginBottom:12 },
  input:         { width:'100%', borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:12, marginBottom:16 },
  tipsBox:       { marginTop:20, backgroundColor:'#fff', padding:16, borderRadius:10, elevation:2 },
  tipsTitle:     { fontWeight:'700', marginBottom:8, color:'#444' },
  tip:           { fontSize:13, color:'#333', marginBottom:4 },
});

// export default function BarcodeTab() {
//   const [hasPermission, setHasPermission] = useState(false);

//   useEffect(() => {
//     (async () => {
//       const ok = await BarcodeScannerService.requestPermissions();
//       setHasPermission(ok);
//       if (!ok) Alert.alert('Chưa có quyền quét mã vạch');
//     })();
//   }, []);

//   const onScanned = ({ type, data }) => {
//     const result = BarcodeScannerService.handleBarCodeScanned({ type, data });
//     // ví dụ: navigate tới trang chi tiết sản phẩm theo result.data
//   };

//   if (!hasPermission) return <Text>Đang xin quyền...</Text>;

//   return (
//     <View style={{ flex: 1 }}>
//       <BarCodeScanner
//         onBarCodeScanned={onScanned}
//         style={{ flex: 1 }}
//       />
//     </View>
//   );
// }

// export default function CameraTab() {
//   const camRef = useRef(null);
//   const [hasPermission, setHasPermission] = useState(false);

//   useEffect(() => {
//     (async () => {
//       const ok = await CameraScannerService.requestPermissions();
//       setHasPermission(ok);
//       if (!ok) Alert.alert('Chưa có quyền truy cập camera');
//     })();
//   }, []);

//   const snap = async () => {
//     if (!hasPermission) return;
//     const uri = await CameraScannerService.takePicture(camRef.current);
//     console.log('Ảnh chụp:', uri);
//     // TODO: gửi uri lên service xử lý OCR / Ingredient extraction v.v.
//   };

//   if (!hasPermission) return <Text>Đang xin quyền camera...</Text>;

//   return (
//     <View style={{ flex: 1 }}>
//       <Camera ref={camRef} style={{ flex: 1 }} />
//       <TouchableOpacity onPress={snap}>
//         <Text>Chụp Ảnh</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// export default function ScanProductScreen() {
//   const [activeTab, setActiveTab] = useState(TAB_KEYS.CAMERA);
//   const [selectedUri, setSelectedUri] = useState(null);      // ✨ lưu URI ảnh chọn
//   // ...

//   // Hàm gọi ImageService để xin quyền, pick ảnh và set vào state
//   const pickFromLibrary = async () => {
//     const ok = await ImageService.requestPermissions();
//     if (!ok) {
//       return alert('Chưa có quyền truy cập ảnh!');
//     }
//     const uri = await ImageService.pickFromLibrary();
//     if (uri) {
//       setSelectedUri(uri);
//       // nếu bạn muốn tự động upload:
//       // const res = await ImageService.uploadImage(uri, 'https://your.api/upload');
//       // console.log(res);
//     }
//   };

//   const renderContent = () => {
//     switch (activeTab) {
//       // ... các case khác

//       case TAB_KEYS.UPLOAD:
//         return (
//           <>
//             {/* nếu đã chọn ảnh thì show preview, ngược lại show icon */}
//             {selectedUri ? (
//               <Image
//                 source={{ uri: selectedUri }}
//                 style={{ width: 200, height: 200, borderRadius: 10, marginBottom: 12 }}
//                 resizeMode="cover"
//               />
//             ) : (
//               <MaterialIcons
//                 name="file-upload"
//                 size={60}
//                 color="#198754"
//                 style={styles.icon}
//               />
//             )}

//             <Text style={styles.contentTitle}>
//               {selectedUri ? 'Xem trước ảnh' : 'Tải Ảnh Lên'}
//             </Text>
//             <Text style={styles.contentSubtitle}>
//               {selectedUri
//                 ? 'Ảnh đã chọn từ thư viện'
//                 : 'Chọn ảnh nhãn thành phần từ thư viện'}
//             </Text>

//             <TouchableOpacity
//               style={styles.primaryBtn}
//               onPress={pickFromLibrary}
//             >
//               <MaterialIcons name="file-upload" size={20} color="#fff" />
//               <Text style={styles.primaryBtnText}>
//                 {selectedUri ? 'Chọn lại ảnh' : 'Chọn Ảnh'}
//               </Text>
//             </TouchableOpacity>
//           </>
//         );
//     // ...
//     }
//   };

//   // phần return() và các style giữ nguyên
// }
