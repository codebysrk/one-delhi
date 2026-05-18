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

  if (!fontsLoaded || !appIsReady) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <Image 
          source={require('./assets/images/splash.png')} 
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          transition={300}
        />
      </View>
    );
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

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#D32F2F',
    justifyContent: 'flex-start', // Shifted from center
    alignItems: 'center',
  },
  splashImage: {
    // Style will be applied dynamically in the component to avoid top-level issues
  }
});
