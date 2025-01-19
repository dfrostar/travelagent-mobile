import React from 'react';
import { StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { AppNavigator } from '@/navigation/AppNavigator';
import { colors } from '@/theme';
import CONFIG from '@/config';

// Initialize Sentry
if (CONFIG.SENTRY_DSN) {
  Sentry.init({
    dsn: CONFIG.SENTRY_DSN,
    enabled: !__DEV__,
    debug: __DEV__,
  });
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: CONFIG.MAX_RETRIES,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
      />
      <AppNavigator />
    </QueryClientProvider>
  );
}
