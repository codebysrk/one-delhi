import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './navigators/AuthNavigator';
import { MainTabNavigator } from './navigators/MainTabNavigator';
import { RouteDetailScreen } from '../features/home/RouteDetailScreen';
import { NotificationScreen } from '../features/notifications/NotificationScreen';
import { BookingScreen } from '../features/booking/BookingScreen';
import { PaymentScreen } from '../features/payment/PaymentScreen';
import { PassScreen } from '../features/pass/PassScreen';
import { TicketScreen } from '../features/qr/TicketScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { HelpScreen } from '../features/profile/HelpScreen';
import { SettingsScreen } from '../features/profile/SettingsScreen';
import { useAppStore } from '../store/useAppStore';
import { db, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { registerDevice, listenToDeviceSecurity, clearForceLogout } from '../services/deviceService';
import { logAction } from '../services/logService';
import { signOut } from 'firebase/auth';
import { Alert, BackHandler, ToastAndroid } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

const Stack = createNativeStackNavigator();

export const ComingSoon = ({ navigation }: any) => (
  <View style={{ flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
    <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 25 }}>
      <MaterialCommunityIcons name="rocket-launch" size={60} color="#D32F2F" />
    </View>
    <Text style={{ fontSize: 24, fontWeight: '700', color: '#111' }}>Coming Soon</Text>
    <Text style={{ marginTop: 10, color: '#666', fontSize: 16, textAlign: 'center', paddingHorizontal: 40 }}>
      We are working hard to bring this feature to you. Stay tuned!
    </Text>
  </View>
);


export const RootNavigator = () => {
  const { width } = useWindowDimensions();
  const navigationRef = useNavigationContainerRef();
  const { user, setUser, userProfile, setUserProfile, setTickets, resetStore, showFooter, isVerifying, isAuthReady, setIsAuthReady } = useAppStore();
  const [initializing, setInitializing] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const docSnap = await getDoc(doc(db, "users", userId));
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, [setUserProfile]);

  const fetchUserTickets = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const q = query(
        collection(db, "tickets"), 
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const userTickets: any[] = [];
      querySnapshot.forEach((doc) => {
        userTickets.push({ id: doc.id, ...doc.data() });
      });
      setTickets(userTickets);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        // Silent catch for security-related permission denials during auth transitions
        return;
      }
      console.error("Error fetching user tickets:", error);
      // Do NOT clear tickets here. Keep the cached ones for offline access.
    }
  }, [setTickets]);

    const handleSecurityAction = useCallback(async (action: 'BANNED' | 'LOGOUT', type: 'USER' | 'DEVICE') => {
      const currentState = useAppStore.getState();
      
      // Stop any pending verification spinners and reset auth ready
      currentState.setIsVerifying(false);
      currentState.setIsAuthReady(false);

      // Clear forceLogout flag before signing out
      if (action === 'LOGOUT' && currentState.deviceId) {
        await clearForceLogout(currentState.deviceId).catch(() => {});
      }

      // Log the security action while still authenticated
      if (currentState.user) {
        await logAction({
          userId: currentState.user.uid,
          userName: currentState.userProfile?.name || 'User',
          userEmail: currentState.user.email || '',
          action: action === 'BANNED' ? 'BANNED' : 'LOGOUT',
          details: `Security action triggered: ${action} (${type})`,
          type: 'USER',
          deviceId: currentState.deviceId || undefined
        }).catch(() => {});
      }

      await signOut(auth);
      resetStore();
      
      const message = action === 'BANNED'
        ? (type === 'USER' 
            ? 'ACCOUNT BANNED!\n\nYour account has been permanently suspended. You cannot login from any device. Please contact support.' 
            : 'DEVICE RESTRICTED!\n\nThis specific device has been banned. You may still be able to login from a different, authorized device.')
        : 'SECURITY NOTICE\n\nYou have been remotely logged out by the administrator for security reasons.';

      Alert.alert('Access Denied', message);
    }, [resetStore]);
    
    // Handle Security Verification and Listener
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

        if (!user || isVerifying || !userProfile || !isAuthReady) return;
        
        try {
          const currentState = useAppStore.getState();
          let currentDeviceId = currentState.deviceId;
          console.log("[RootNavigator] Current Device ID in store:", currentDeviceId);

          // 1. Get or Register Device
          if (!currentDeviceId) {
            console.log("[RootNavigator] Initializing first-time device registration...");
            const [deviceResult] = await Promise.all([
              registerDevice(
                user.uid,
                userProfile.name || 'User',
                userProfile.email || ''
              ),
              fetchUserTickets(user.uid)
            ]);

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
            
            // Safety delay to ensure firestore state has propagated
            await new Promise(resolve => setTimeout(resolve, 800));

            // REAL-TIME DEVICE LISTENER
            deviceUnsubscribe = listenToDeviceSecurity(currentDeviceId, async (action) => {
              console.log("[RootNavigator] REAL-TIME SECURITY EVENT (Device):", action);
              await handleSecurityAction(action, 'DEVICE');
            });

            // REAL-TIME USER BAN LISTENER
            userUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
              if (!snap.exists()) {
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
            }, (err) => {
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

    const subscriber = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      
      try {
        if (firebaseUser) {
          console.log("[RootNavigator] Auth state changed: User detected.");
          
          try {
            // Fetch Profile
            const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
            const profile = docSnap.exists() ? docSnap.data() : null;
            
            if (!isMounted) return;

            // Always set user and profile to ensure UI transitions correctly
            setUser(firebaseUser);
            setUserProfile(profile);

            // IF RETURNING USER (session resume), set Auth Ready
            // If NEW LOGIN, isAuthReady remains false until LoginScreen finishes
            if (!useAppStore.getState().isVerifying) {
              console.log("[RootNavigator] Resuming session, setting Auth Ready.");
              setIsAuthReady(true);
            }
          } catch (error: any) {
            console.error("[RootNavigator] Profile fetch error during auth change:", error);
            // If it's a permission error, it's likely a BANNED user
            // We set the user anyway so the LoginScreen/Security check can handle it
            if (error.code === 'permission-denied') {
              setUser(firebaseUser);
            } else {
              // For other errors like network, we can keep the user but maybe don't set auth ready
              setUser(firebaseUser);
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
        return false; // Let navigation handle it
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

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  if (initializing) {
    return (
      <View style={styles.initializingContainer}>
        <Image 
          source={require('../../assets/images/splash.png')} 
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          transition={500}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 350,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }} 
        >
          {(!user || !isAuthReady || isVerifying) ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ presentation: 'modal' }} />
              <Stack.Screen name="Notifications" component={NotificationScreen} />
              <Stack.Screen name="Booking" component={BookingScreen} />
              <Stack.Screen name="Payment" component={PaymentScreen} />
              <Stack.Screen name="Pass" component={PassScreen} />
              <Stack.Screen name="Ticket" component={TicketScreen} options={{ presentation: 'modal' }} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Help" component={HelpScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="ComingSoon" component={ComingSoon} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#FFF',
  },
  footerShadow: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  globalFooter: { 
    backgroundColor: '#D32F2F', // Standardized Rail Red
    paddingVertical: 2, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)', // Inner shadow simulation
  },
  footerText: { color: 'white', fontSize: 10, fontWeight: '500' },
  initializingContainer: {
    flex: 1,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
