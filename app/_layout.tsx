import { useColorScheme } from '@/hooks/useColorScheme';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { HealthProvider } from "../context/HealthContext"; // ✅ import Provider

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <HealthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="HomeScreen" />
        <Stack.Screen name="HealthFormScreen" />
        <Stack.Screen name="HealthConditionScreen" />
        <Stack.Screen name="AllergyScreen" />
        <Stack.Screen name="HealthGoalScreen" />
        <Stack.Screen name="ScanProductScreen" />
        <Stack.Screen name="ChatBotScreen" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </HealthProvider>
  );
}