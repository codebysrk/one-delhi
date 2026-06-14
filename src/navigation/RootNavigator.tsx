import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Alert, BackHandler, ToastAndroid, Animated, Dimensions } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './navigators/AuthNavigator';
import { MainTabNavigator } from './navigators/MainTabNavigator';
import { RouteDetailScreen } from '../features/home/RouteDetailScreen';
import { NotificationScreen } from '../features/notifications/NotificationScreen';
import { PassScreen } from '../features/pass/PassScreen';
import { TicketScreen } from '../features/qr/TicketScreen';
import { BookingStack } from './navigators/BookingStack';
import { ProfileStack } from './navigators/ProfileStack';
import { linking } from './linking';
import { useAppStore } from '../store/useAppStore';
import { db, auth } from '../services/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { registerDevice, listenToDeviceSecurity, clearForceLogout } from '../services/deviceService';
import { logAction } from '../services/logService';
import { Image } from 'expo-image';
import { Screen } from '../components/layout/Screen';
import { Header } from '../components/layout/Header';
import { BrandingFooter } from '../components/ui/BrandingFooter';
const Stack = createNativeStackNavigator();
export const ComingSoon = ({
  navigation
}: any) => <Screen noPadding ignoreTopSafe style={{
  backgroundColor: '#FFF'
}}>
    <Header title="Coming Soon" onBackPress={() => navigation.goBack()} backgroundColor="#FFFFFF" textColor="#000000" height={50} showShadow={true} />
    <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100
  }}>
      <View style={{
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#FEF2F2',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 25
    }}>
        <MaterialCommunityIcons name="rocket-launch" size={60} color="#D32F2F" />
      </View>
      <Text style={{
      fontSize: 24,
      fontWeight: '700',
      color: '#111'
    }}>Coming Soon</Text>
      <Text style={{
      marginTop: 10,
      color: '#666',
      fontSize: 16,
      textAlign: 'center',
      paddingHorizontal: 40
    }}>
        We are working hard to bring this feature to you. Stay tuned!
      </Text>
    </View>
  </Screen>;
export const RootNavigator = () => {
  const navigationRef = useNavigationContainerRef();
  const {
    user,
    setUser,
    userProfile,
    setUserProfile,
    setTickets,
    resetStore,
    isVerifying,
    isAuthReady,
    setIsAuthReady
  } = useAppStore();
  const [initializing, setInitializing] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);
  const splashAnim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!initializing) {
      Animated.timing(splashAnim, {
        toValue: -Dimensions.get('window').width,
        duration: 320,
        useNativeDriver: true
      }).start(() => setSplashVisible(false));
    }
  }, [initializing]);
  const fetchUserTickets = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const querySnapshot = await db.collection("tickets").where("userId", "==", userId).orderBy("timestamp", "desc").get();
      const userTickets: any[] = [];
      querySnapshot.forEach(doc => {
        userTickets.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setTickets(userTickets);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        return;
      }
      console.error("Error fetching user tickets:", error);
    }
  }, [setTickets]);
  const handleSecurityAction = useCallback(async (action: 'BANNED' | 'LOGOUT', type: 'USER' | 'DEVICE') => {
    const currentState = useAppStore.getState();
    currentState.setIsVerifying(false);
    currentState.setIsAuthReady(false);
    if (action === 'LOGOUT' && currentState.deviceId) {
      await clearForceLogout(currentState.deviceId).catch(() => {});
    }
    if (currentState.user) {
      await logAction({
        userId: currentState.user.uid,
        userName: currentState.userProfile?.name || 'User',
        userEmail: currentState.user.email || '',
        action: action === 'BANNED' ? type === 'USER' ? 'USER_BANNED' : 'DEVICE_BANNED' : 'LOGOUT',
        details: `Security action triggered: ${action} (${type})`,
        type: 'USER',
        deviceId: currentState.deviceId || undefined
      }).catch(() => {});
    }
    await auth.signOut();
    resetStore();
    const message = action === 'BANNED' ? type === 'USER' ? 'ACCOUNT BANNED!\n\nYour account has been permanently suspended. You cannot login from any device. Please contact support.' : 'DEVICE RESTRICTED!\n\nThis specific device has been banned. You may still be able to login from a different, authorized device.' : 'SECURITY NOTICE\n\nYou have been remotely logged out by the administrator for security reasons.';
    Alert.alert('Access Denied', message);
  }, [resetStore]);
  useEffect(() => {
    let deviceUnsubscribe: (() => void) | null = null;
    let userUnsubscribe: (() => void) | null = null;
    const initSecurity = async () => {
      console.log("[RootNavigator] Running initSecurity. State:", {
        hasUser: !!user,
        isVerifying,
        hasProfile: !!userProfile,
        isAuthReady
      });
      if (!user || !user.uid || isVerifying || !userProfile || !isAuthReady) return;
      try {
        const currentState = useAppStore.getState();
        let currentDeviceId = currentState.deviceId;
        console.log("[RootNavigator] Current Device ID in store:", currentDeviceId);
        if (!currentDeviceId) {
          console.log("[RootNavigator] Initializing first-time device registration...");
          const [deviceResult] = await Promise.all([registerDevice(user.uid, userProfile.name || 'User', userProfile.email || ''), fetchUserTickets(user.uid)]);
          if (deviceResult) {
            console.log("[RootNavigator] Device registered successfully:", deviceResult.deviceId);
            currentDeviceId = deviceResult.deviceId;
            useAppStore.getState().setDeviceId(currentDeviceId);
            if (deviceResult.status === 'BANNED') {
              await handleSecurityAction('BANNED', 'DEVICE');
              return;
            }
          }
        } else {
          console.log("[RootNavigator] Device already known, fetching tickets...");
          await fetchUserTickets(user.uid);
        }
        if (currentDeviceId) {
          console.log("[RootNavigator] Setting up real-time listeners for device:", currentDeviceId);
          await new Promise(resolve => setTimeout(resolve, 800));
          deviceUnsubscribe = listenToDeviceSecurity(currentDeviceId, async action => {
            console.log("[RootNavigator] REAL-TIME SECURITY EVENT (Device):", action);
            await handleSecurityAction(action, 'DEVICE');
          });
          userUnsubscribe = db.collection('users').doc(user.uid).onSnapshot(snap => {
            if (!snap || !snap.exists) {
              console.log("[RootNavigator] User document DELETED. Logging out.");
              handleSecurityAction('BANNED', 'USER');
              return;
            }
            const data = snap.data();
            console.log("[RootNavigator] User profile update detected. Status:", data?.status);
            if (data?.status === 'BANNED') {
              console.log("[RootNavigator] User BANNED in real-time. Triggering logout.");
              handleSecurityAction('BANNED', 'USER');
            }
          }, (err: any) => {
            if (err.code === 'permission-denied') {
              console.log("[RootNavigator] Permission denied for user doc (likely BANNED). Triggering logout.");
              handleSecurityAction('BANNED', 'USER');
            }
          });
          console.log("[RootNavigator] Real-time listeners active.");
        } else {
          console.warn("[RootNavigator] No device ID available. Security listeners NOT active.");
        }
      } catch (error) {
        console.error("[RootNavigator] Security init error:", error);
      }
    };
    initSecurity();
    return () => {
      if (deviceUnsubscribe) deviceUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, [user?.uid, isVerifying, !!userProfile, isAuthReady, fetchUserTickets, handleSecurityAction]);
  useEffect(() => {
    let isMounted = true;
    const subscriber = auth.onAuthStateChanged(async firebaseUser => {
      if (!isMounted) return;
      try {
        if (firebaseUser) {
          console.log("[RootNavigator] Auth state changed: User detected.");
          try {
            const docSnap = await db.collection("users").doc(firebaseUser.uid).get();
            const profile = docSnap.exists ? docSnap.data() : null;
            if (!isMounted) return;
            setUser(firebaseUser);
            setUserProfile(profile);
            if (!useAppStore.getState().isVerifying) {
              console.log("[RootNavigator] Resuming session, setting Auth Ready.");
              setIsAuthReady(true);
            }
          } catch (error: any) {
            const isOffline = error.message?.includes('offline') || error.code === 'unavailable';
            if (isOffline) {
              console.log("[RootNavigator] Client is offline. Resuming session using cache.");
              setUser(firebaseUser);
              setIsAuthReady(true);
            } else {
              console.error("[RootNavigator] Profile fetch error during auth change:", error);
              if (error.code === 'permission-denied') {
                setUser(firebaseUser);
              } else {
                setUser(firebaseUser);
              }
            }
          }
        } else {
          console.log("[RootNavigator] Auth state changed: No user.");
          resetStore();
        }
      } catch (error) {
        console.error("[RootNavigator] Auth state change error:", error);
      } finally {
        if (initializing && isMounted) setInitializing(false);
      }
    });
    return () => {
      isMounted = false;
      subscriber();
    };
  }, [setUser, setUserProfile, resetStore, handleSecurityAction, initializing, setIsAuthReady]);
  useEffect(() => {
    let lastBackPressed = 0;
    const backAction = () => {
      if (navigationRef.canGoBack()) {
        return false;
      }
      const now = Date.now();
      if (lastBackPressed && now - lastBackPressed < 2000) {
        BackHandler.exitApp();
        return true;
      }
      lastBackPressed = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      }
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);
  return <View style={{
    flex: 1,
    backgroundColor: '#FFF'
  }}>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <Stack.Navigator screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        gestureEnabled: true,
        gestureDirection: 'horizontal'
      }}>
          {!user || !isAuthReady || isVerifying ? <Stack.Screen name="Auth" component={AuthNavigator} /> : <>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen name="BookingStack" component={BookingStack} />
              <Stack.Screen name="ProfileStack" component={ProfileStack} />
              <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{
            presentation: 'modal'
          }} />
              <Stack.Screen name="Notifications" component={NotificationScreen} />
              <Stack.Screen name="Pass" component={PassScreen} />
              <Stack.Screen name="Ticket" component={TicketScreen} options={{
            presentation: 'modal'
          }} />
              <Stack.Screen name="ComingSoon" component={ComingSoon} />
            </>}
        </Stack.Navigator>
      </NavigationContainer>

      {splashVisible && <Animated.View style={[StyleSheet.absoluteFill, styles.initializingContainer, {
      transform: [{
        translateX: splashAnim
      }]
    }]}>
          <View style={{
        height: Platform.OS === 'android' ? 24 : 44
      }} />
          <Image source={require('../../assets/images/splash.png')} style={{
        flex: 1,
        width: '100%'
      }} contentFit="cover" />
          <BrandingFooter variant="ticket" containerStyle={styles.splashFooter} textStyle={styles.splashFooterText} />
        </Animated.View>}
    </View>;
};
const styles = StyleSheet.create({
  initializingContainer: {
    flex: 1,
    backgroundColor: '#FFF'
  },
  splashFooter: {
    width: '100%',
    backgroundColor: '#A51F38',
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  splashFooterText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center'
  }
});