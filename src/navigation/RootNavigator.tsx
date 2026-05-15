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
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
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
  const { user, setUser, userProfile, setUserProfile, setTickets, resetStore, showFooter } = useAppStore();
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
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      // Do NOT clear tickets here. Keep the cached ones for offline access.
    }
  }, [setTickets]);

    const handleSecurityAction = useCallback(async (action: 'BANNED' | 'LOGOUT', type: 'USER' | 'DEVICE') => {
      const currentState = useAppStore.getState();
      
      // Clear forceLogout flag before signing out
      if (action === 'LOGOUT' && currentState.deviceId) {
        await clearForceLogout(currentState.deviceId).catch(() => {});
      }
      
      await signOut(auth);
      resetStore();
      
      const message = action === 'BANNED'
        ? `Your ${type.toLowerCase()} has been banned. Please contact support.`
        : 'You have been remotely logged out by the administrator.';

      Alert.alert('Security Alert', message);
    }, [resetStore]);

    useEffect(() => {
    let isMounted = true;
    let securityUnsubscribe: (() => void) | null = null;


    const subscriber = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      
      try {
        if (firebaseUser) {
          // 1. Fetch Profile
          const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (docSnap.exists()) {
            const profile = docSnap.data();
            
            // 2. Check if User is BANNED
            if (profile.status === 'BANNED') {
              await handleSecurityAction('BANNED', 'USER');
              return;
            }
            
            setUser(firebaseUser);
            setUserProfile(profile);

            // Parallelize device registration and ticket fetching for faster startup
            const [deviceResult] = await Promise.all([
              registerDevice(
                firebaseUser.uid,
                profile.name || 'User',
                profile.email
              ),
              fetchUserTickets(firebaseUser.uid)
            ]);

            if (deviceResult) {
              const { deviceId, status, forceLogout } = deviceResult;
              useAppStore.getState().setDeviceId(deviceId);

              // 4. Check if Device is BANNED or FORCE LOGOUT
              if (status === 'BANNED') {
                await handleSecurityAction('BANNED', 'DEVICE');
                return;
              }
              if (forceLogout) {
                await handleSecurityAction('LOGOUT', 'DEVICE');
                return;
              }

              // 5. Listen for realtime security updates
              securityUnsubscribe = listenToDeviceSecurity(deviceId, async (action) => {
                await handleSecurityAction(action, 'DEVICE');
              });

              // 6. Log Login (non-awaited to speed up navigation)
              logAction({
                userId: firebaseUser.uid,
                userName: profile.name || 'User',
                userEmail: profile.email,
                action: 'LOGIN',
                details: 'User logged in successfully',
                type: 'USER',
                deviceId
              }).catch(() => {});
            }
          }
        } else {
          if (securityUnsubscribe) securityUnsubscribe();
          resetStore();
        }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          // If we can't read the profile, the user is likely banned
          await handleSecurityAction('BANNED', 'USER');
        } else {
          console.error("Auth state change error:", error);
        }
      } finally {
        if (initializing && isMounted) setInitializing(false);
      }
    });
    
    return () => {
      isMounted = false;
      subscriber();
      if (securityUnsubscribe) securityUnsubscribe();
    };
  }, [fetchUserTickets, resetStore, setUser, setUserProfile, handleSecurityAction]);

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
          {!user ? (
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
