import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import SimpleHamburger from '../../components/SimpleHamburger';

export default function TestHamburger() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header với Hamburger Menu */}
      <View style={styles.header}>
        <SimpleHamburger />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Test Hamburger</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Text style={styles.text}>Hamburger Menu đã được thêm!</Text>
        <Text style={styles.subtext}>Nhấn vào button 3 gạch để mở menu</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1fef4'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#e4f7f3'
  },
  headerContent: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black'
  },
  headerRight: {
    width: 50
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 10
  },
  subtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center'
  }
});
