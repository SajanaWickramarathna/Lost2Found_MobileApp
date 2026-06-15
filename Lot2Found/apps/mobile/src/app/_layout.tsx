import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/context/auth';
import { SocketProvider } from '@/context/SocketContext';
import { LocationSelectionProvider } from '@/context/LocationContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!user && !inAuthGroup) {
      // Redirect to the login page.
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirect away from the login page.
      router.replace('/');
    }
  }, [user, isLoading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen 
          name="location-picker" 
          options={{ 
            headerShown: false, 
            presentation: 'modal' 
          }} 
        />
        <Stack.Screen 
          name="post/lost" 
          options={{ 
            title: 'Lost Item', 
            headerShown: true, 
            headerBackTitle: 'Back' 
          }} 
        />
        <Stack.Screen 
          name="post/found" 
          options={{ 
            title: 'Found Item', 
            headerShown: true, 
            headerBackTitle: 'Back' 
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <LocationSelectionProvider>
      <SocketProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SocketProvider>
    </LocationSelectionProvider>
  );
}
