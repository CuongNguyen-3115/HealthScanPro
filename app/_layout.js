import { Stack } from 'expo-router';
import { HealthProfileProvider } from '../contexts/HealthProfileContext';

export default function Layout() {
  return (
    <HealthProfileProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="screens/WelcomeScreen" />
        <Stack.Screen name="screens/LoginScreen" />
        <Stack.Screen name="screens/RegisterScreen" />
        <Stack.Screen name="screens/ForgotPasswordScreen" />
        <Stack.Screen name="screens/HomeScreen" />
        <Stack.Screen name="screens/ProfileScreen" />
        <Stack.Screen name="screens/UpdateProfileScreen" />
        <Stack.Screen name="screens/EditHistoryScreen" />
        <Stack.Screen name="screens/HealthFormScreen" />
        <Stack.Screen name="screens/HealthConditionScreen" />
        <Stack.Screen name="screens/AllergyScreen" />
        <Stack.Screen name="screens/HealthGoalScreen" />
        <Stack.Screen name="screens/ScanProductScreen" />
        <Stack.Screen name="screens/ProductAnalysisScreen" />
        <Stack.Screen name="screens/ChatBotScreen" />
        <Stack.Screen name="screens/ChatHistoryScreen" />
        <Stack.Screen name="screens/ChatDetailScreen" />
        <Stack.Screen name="screens/PersonalizedAssessment" />
        <Stack.Screen name="screens/NutrientsScreen" />
        <Stack.Screen name="screens/NutrientDetailScreen" />
        <Stack.Screen name="screens/AnalysisHistoryScreen" />
        <Stack.Screen name="screens/HealthProfileScreen" />
        <Stack.Screen name="test/test-menu-functions" />
        <Stack.Screen name="demo/demo-hamburger" />
        <Stack.Screen name="test/test-slide" />
        <Stack.Screen name="test/test-health-system" />
        <Stack.Screen name="test/test-simple" />
      </Stack>
    </HealthProfileProvider>
  );
}
