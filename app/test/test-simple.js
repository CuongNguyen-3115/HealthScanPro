import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useHealthProfile } from '../../contexts/HealthProfileContext';

export default function TestSimple() {
  const { healthProfile, hasProfile, loading } = useHealthProfile();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Test HealthProfile Context</Text>
      <Text style={styles.text}>Có hồ sơ: {hasProfile() ? 'Có' : 'Không'}</Text>
      {healthProfile && (
        <Text style={styles.text}>Hồ sơ: {JSON.stringify(healthProfile, null, 2)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 16,
    marginVertical: 5,
  },
});
