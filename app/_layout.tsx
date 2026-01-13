import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '../context/AuthContext';


export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Start with splash screen on first app open
  initialRouteName: 'splash',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { profileComplete, isLoading, isAuthenticated } = useAuth();
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Force splash screen on very first render ONLY if not authenticated
  useEffect(() => {
    if (isLoading) return; // Wait for auth to load first

    if (!initialCheckDone) {
      setInitialCheckDone(true);

      // Only show splash if user is not authenticated
      if (!isAuthenticated && segments[0] !== 'splash') {
        router.replace('/splash');
        return;
      }
    }
  }, [initialCheckDone, segments, isLoading, isAuthenticated]);

  useEffect(() => {
    if (isLoading || !initialCheckDone) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';
    const inWelcome = segments[0] === 'welcome';
    const inSplash = segments[0] === 'splash';
    const inLogin = segments[0] === 'login';
    const inProfileEdit = segments[0] === 'profile-edit';
    const inChat = segments[0] === 'chat';

    // Don't redirect if user is on splash screen (let it auto-navigate)
    if (inSplash) return;

    // Don't redirect if user is on authenticated screens (profile-edit, chat, etc.)
    if (inProfileEdit || inChat) return;

    // If not authenticated or profile incomplete, redirect to welcome/login
    if (!isAuthenticated || profileComplete === false) {
      if (!inWelcome && !inLogin && !inOnboarding) {
        router.replace('/welcome');
      }
    } else if (profileComplete === true && !inTabsGroup && !inWelcome && !inLogin && !inOnboarding) {
      // User is authenticated and profile is complete, go to Community tab
      router.replace('/(tabs)/three');
    }
  }, [profileComplete, isAuthenticated, segments, isLoading, initialCheckDone]);

  if (isLoading || !initialCheckDone) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
