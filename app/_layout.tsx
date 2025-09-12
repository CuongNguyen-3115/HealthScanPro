import { useColorScheme } from '../hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { HealthProfileProvider } from '../contexts/HealthProfileContext';
import { UserProvider } from '../contexts/UserContext';
import 'react-native-reanimated';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <UserProvider>
      <HealthProfileProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="WelcomeScreen" />
            <Stack.Screen name="HomeScreen" />
            <Stack.Screen name="ChatBotScreen" />
            <Stack.Screen name="HealthProfileScreen" />
            <Stack.Screen name="CreateProfileScreen" />
            <Stack.Screen name="HealthConditionScreen" />
            <Stack.Screen name="AllergyScreen" />
            <Stack.Screen name="HealthGoalScreen" />
            <Stack.Screen name="ScanProductScreen" />
            <Stack.Screen name="NutrientsScreen" />
            <Stack.Screen name="AnalysisHistoryScreen" />
            <Stack.Screen name="ProfileScreen" />
            <Stack.Screen name="NutrientDetailScreen" />
            <Stack.Screen name="ProductAnalysisScreen" />
            <Stack.Screen name="PersonalizedAssessment" />
            <Stack.Screen name="UpdateProfileScreen" />
            <Stack.Screen name="EditHistoryScreen" />
            <Stack.Screen name="ChatHistoryScreen" />
            <Stack.Screen name="ChatDetailScreen" />
            <Stack.Screen name="LoginScreen" />
            <Stack.Screen name="RegisterScreen" />
            <Stack.Screen name="ForgotPasswordScreen" />
            <Stack.Screen name="AdminSetupScreen" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </HealthProfileProvider>
    </UserProvider>
  );
}