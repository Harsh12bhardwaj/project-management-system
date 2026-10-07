import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { getStoredToken } from '../lib/auth';
import { apiClient, ApiError } from '../lib/api';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await getStoredToken();
        if (token) {
          try {
            await apiClient('/auth/me');
            router.replace('/(tabs)/dashboard');
          } catch (err) {
            // Token invalid/expired — stay on auth screens
            router.replace('/(auth)/login');
          }
        } else {
          router.replace('/(auth)/login');
        }
      } finally {
        SplashScreen.hideAsync();
      }
    }
    bootstrap();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="projects/[id]"
          options={{ headerShown: true, title: 'Project Details', headerBackTitle: 'Projects' }}
        />
        <Stack.Screen
          name="projects/create"
          options={{ headerShown: true, title: 'New Project', headerBackTitle: 'Back', presentation: 'modal' }}
        />
        <Stack.Screen
          name="projects/edit"
          options={{ headerShown: true, title: 'Edit Project', headerBackTitle: 'Back', presentation: 'modal' }}
        />
        <Stack.Screen
          name="tasks/create"
          options={{ headerShown: true, title: 'New Task', headerBackTitle: 'Back', presentation: 'modal' }}
        />
        <Stack.Screen
          name="tasks/edit"
          options={{ headerShown: true, title: 'Edit Task', headerBackTitle: 'Back', presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}
