(global as any).RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
import 'react-native-get-random-values';
import 'fast-text-encoding';
import React, { useState, useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { Asset } from 'expo-asset';
import { NotificationListener } from './src/components/feedback/NotificationListener';
import { checkForUpdate } from './src/utils/checkForUpdate';

SplashScreen.preventAutoHideAsync();

function cacheImages(images: any[]) {
  return images.map(image => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}

export default function App() {
  const { width, height } = useWindowDimensions();
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    'StencilBold': require('./assets/fonts/OPTIStencil-Bold.otf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        if (fontsLoaded) {
          setAppIsReady(true);
          await SplashScreen.hideAsync();
        }

        // Pre-load images in background without blocking the splash screen hide
        cacheImages([
          require('./assets/images/logo.webp'),
          require('./assets/images/map-header-logo.webp'),
          require('./assets/images/splash.png'),
          require('./assets/images/transit_header.webp'),
          require('./assets/images/ticket-first.webp'),
          require('./assets/images/ticket-second.webp'),
        ]);
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, [fontsLoaded]);

  useEffect(() => {
    if (appIsReady) {
      checkForUpdate();
    }
  }, [appIsReady]);

  if (!fontsLoaded || !appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <NotificationListener />
        <RootNavigator />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({});
