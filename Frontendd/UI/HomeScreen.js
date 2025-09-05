// app/index.js
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { height } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* Top section */}
        <View style={styles.topSection}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          <Text style={styles.title}>HealthScan Pro</Text>
          <Text style={styles.subtitle}>
            Phân tích thông minh sản phẩm cho sức khỏe của bạn
          </Text>
        </View>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          {/* Card: Hồ sơ sức khỏe */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Image source={require('../assets/images/human.png')} style={styles.cardIconLarge} />
              <Text style={styles.cardTitle}>Tạo Hồ Sơ Sức Khỏe</Text>
            </View>

            <Text style={styles.cardDescription}>
              Cá nhân hóa đánh giá dựa trên tình trạng sức khỏe của bạn. Phù hợp cho người
              tiểu đường, dị ứng, thừa cân...
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.buttonGreen, styles.mb12]} // đảm bảo khoảng cách kể cả khi 'gap' không hỗ trợ
                activeOpacity={0.8}
                onPress={() => router.push('HealthFormScreen')}
              >
                <MaterialIcons name="edit" size={18} color="white" />
                <Text style={styles.buttonText}>Điền Thông Tin Sức Khỏe</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buttonGreen}
                activeOpacity={0.8}
                onPress={() => router.push('HealthProfileViewScreen')}
              >
                <MaterialIcons name="search" size={18} color="white" />
                <Text style={styles.buttonText}>Xem Thông tin sức khỏe</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card: Quét ngay */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Image source={require('../assets/images/scan.png')} style={styles.cardIconLarge} />
              <Text style={styles.cardTitle}>Quét Ngay</Text>
            </View>

            <Text style={styles.cardDescription}>
              Bỏ qua việc thiết lập hồ sơ và thực hiện phân tích tổng quát ngay lập tức
            </Text>

            <TouchableOpacity
              style={styles.buttonTeal}
              activeOpacity={0.8}
              onPress={() => router.push('ScanProductScreen')}
            >
              <FontAwesome5 name="search" size={18} color="white" />
              <Text style={styles.buttonText}>Quét Sản Phẩm</Text>
            </TouchableOpacity>
          </View>

          {/* Footer icons */}
          <View style={styles.footerIcons}>
            <View style={styles.footerItem}>
              <Image source={require('../assets/images/scan.png')} style={styles.footerIcon} />
              <Text style={styles.footerText}>Quét hình ảnh</Text>
            </View>
            <View style={styles.footerItem}>
              <Image source={require('../assets/images/analysis.png')} style={styles.footerIcon} />
              <Text style={styles.footerText}>Phân tích thành phần</Text>
            </View>
            <View style={styles.footerItem}>
              <Image source={require('../assets/images/alternative.png')} style={styles.footerIcon} />
              <Text style={styles.footerText}>Gợi ý thay thế</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1fef4',
  },
  scroll: {
    minHeight: height,
    justifyContent: 'flex-start',
  },
  topSection: {
    backgroundColor: '#e4f7f3',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 25,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  subtitle: {
    fontSize: 12,
    color: 'black',
    textAlign: 'center',
    marginTop: 4,
  },
  bottomSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f1fef4',
    flexGrow: 1,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2, // Android shadow
    // iOS shadow (nếu cần)
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cardIconLarge: {
    width: 58,
    height: 58,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  cardDescription: {
    fontSize: 12,
    color: 'black',
    marginBottom: 16,
  },
  actions: {
    width: '100%',
    marginTop: 12, // khoảng cách block nút với phần trên card
    gap: 12,        // khoảng cách giữa 2 nút (nếu RN hỗ trợ)
  },
  buttonGreen: {
    flexDirection: 'row',
    backgroundColor: '#17863d',
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  buttonTeal: {
    flexDirection: 'row',
    backgroundColor: '#17863d',
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  mb12: {
    marginBottom: 12, // fallback khi 'gap' không hoạt động
  },
  footerIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 20,
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
  },
  footerIcon: {
    width: 48,
    height: 48,
    marginBottom: 4,
    resizeMode: 'contain',
  },
  footerText: {
    fontSize: 11,
    color: 'black',
    textAlign: 'center',
  },
});
