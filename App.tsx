import 'react-native-get-random-values';
import 'fast-text-encoding';
import React, { useState, useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window');

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    'Exiger': require('./assets/fonts/Exiger-Stamp.otf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        if (fontsLoaded) {
          // Artificial delay to show custom splash
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
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

  if (!fontsLoaded) return null;

  if (!appIsReady) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <Image 
          source={require('./assets/images/splash.webp')} 
          style={styles.splashImage}
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
    width: width * 0.8,
    height: width * 0.8,
    marginTop: height * 0.25, // Khiskao neeche (shifted down)
  }
});
