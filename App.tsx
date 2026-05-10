import 'react-native-get-random-values';
import 'fast-text-encoding';
import React, { useState, useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { Asset } from 'expo-asset';

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
    'Exiger': require('./assets/fonts/Exiger-Stamp.otf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load images
        const imageAssets = cacheImages([
          require('./assets/images/logo.webp'),
          require('./assets/images/map-header-logo.webp'),
          require('./assets/images/map-header.webp'),
          require('./assets/images/splash.png'),
          require('./assets/images/transit_header.webp'),
        ]);

        await Promise.all([...imageAssets]);
      } catch (e) {
        console.warn(e);
      } finally {
        if (fontsLoaded) {
          setAppIsReady(true);
          await SplashScreen.hideAsync();
        }
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
          style={[styles.splashImage, { width: width * 0.8, height: width * 0.8, marginTop: height * 0.25 }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" />
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
