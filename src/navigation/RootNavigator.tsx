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
import { supabase } from '../services/supabase';
import { getUserProfile } from '../services/userService';
import { fetchUserTicketsFromDb } from '../services/ticketService';
import { COLORS } from '../theme/theme';
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
  backgroundColor: COLORS.white
}}>
    <Header title="Coming Soon" onBackPress={() => navigation.goBack()} backgroundColor={COLORS.white} textColor={COLORS.text} height={50} showShadow={true} />
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
      backgroundColor: '#E8F5E9',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24
    }}>
        <MaterialCommunityIcons name="clock-fast" size={60} color="#059669" />
      </View>
      <Text style={{
      fontSize: 22,
      fontWeight: 'bold',
      color: COLORS.text,
      marginBottom: 8
    }}>Coming Soon</Text>
      <Text style={{
      fontSize: 15,
      color: COLORS.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 40,
      lineHeight: 22
    }}>We're working hard to bring this feature to you. Stay tuned!</Text>
    </View>
    <BrandingFooter />
  </Screen>;
export const RootNavigator = () => {
  const {
    user,
    userProfile,
    setUser,
    setUserProfile,
    isAuthReady,
    setIsAuthReady,
    isVerifying,
    setTickets,
    resetStore
  } = useAppStore();
  const [initializing, setInitializing] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const navigationRef = useNavigationContainerRef();
  useEffect(() => {
    if (!initializing) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => setSplashVisible(false));
    }
  }, [initializing]);
  const fetchUserTickets = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const tickets = await fetchUserTicketsFromDb(userId);
      setTickets(tickets);
    } catch (error: any) {
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
    const currentUserId = currentState.user?.id || currentState.user?.uid;
    if (currentUserId) {
      await logAction({
        userId: currentUserId,
        userName: currentState.userProfile?.name || 'User',
        userEmail: currentState.userProfile?.email || currentState.user?.email || '',
        action: action === 'BANNED' ? type === 'USER' ? 'USER_BANNED' : 'DEVICE_BANNED' : 'LOGOUT',
        details: `Security action triggered: ${action} (${type})`,
        type: 'USER',
        deviceId: currentState.deviceId || undefined
      }).catch(() => {});
    }
    await supabase.auth.signOut().catch(() => {});
    resetStore();
    const message = action === 'BANNED' ? type === 'USER' ? 'ACCOUNT BANNED!\n\nYour account has been permanently suspended. You cannot login from any device. Please contact support.' : 'DEVICE RESTRICTED!\n\nThis specific device has been banned. You may still be able to login from a different, authorized device.' : 'SECURITY NOTICE\n\nYou have been remotely logged out by the administrator for security reasons.';
    Alert.alert('Access Denied', message);
  }, [resetStore]);
  useEffect(() => {
    let deviceUnsubscribe: (() => void) | null = null;
    let userChannel: any = null;
    const currentUid = user?.id || user?.uid;
    const initSecurity = async () => {
      if (!currentUid || isVerifying || !userProfile || !isAuthReady) return;
      try {
        const currentState = useAppStore.getState();
        let currentDeviceId = currentState.deviceId;
        if (!currentDeviceId) {
          const [deviceResult] = await Promise.all([
            registerDevice(currentUid, userProfile.name || 'User', userProfile.email || ''),
            fetchUserTickets(currentUid)
          ]);
          if (deviceResult) {
            currentDeviceId = deviceResult.deviceId;
            useAppStore.getState().setDeviceId(currentDeviceId);
            if (deviceResult.status === 'BANNED') {
              await handleSecurityAction('BANNED', 'DEVICE');
              return;
            }
          }
        } else {
          await fetchUserTickets(currentUid);
        }
        if (currentDeviceId) {
          deviceUnsubscribe = listenToDeviceSecurity(currentDeviceId, async action => {
            await handleSecurityAction(action, 'DEVICE');
          });
          userChannel = supabase
            .channel(`user-sec-${currentUid}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'users', filter: `id=eq.${currentUid}` },
              (payload: any) => {
                if (payload.eventType === 'DELETE') {
                  handleSecurityAction('BANNED', 'USER');
                } else if (payload.new) {
                  if (payload.new.status === 'BANNED' || payload.new.status === 'DELETED') {
                    handleSecurityAction('BANNED', 'USER');
                  }
                }
              }
            )
            .subscribe();
        }
      } catch (error) {
        console.error("[RootNavigator] Security init error:", error);
      }
    };
    initSecurity();
    return () => {
      if (deviceUnsubscribe) deviceUnsubscribe();
      if (userChannel) supabase.removeChannel(userChannel);
    };
  }, [user?.id, user?.uid, isVerifying, !!userProfile, isAuthReady, fetchUserTickets, handleSecurityAction]);
  useEffect(() => {
    let isMounted = true;
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      try {
        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          if (!isMounted) return;
          if (!profile || profile.status === 'DELETED') {
            await supabase.auth.signOut().catch(() => {});
            resetStore();
            return;
          }
          setUser({
            ...session.user,
            uid: session.user.id,
            displayName: profile.name,
          });
          setUserProfile(profile);
          if (!useAppStore.getState().isVerifying) {
            setIsAuthReady(true);
          }
        } else {
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
      authListener?.subscription?.unsubscribe();
    };
  }, [setUser, setUserProfile, resetStore, initializing, setIsAuthReady]);
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
    backgroundColor: COLORS.white
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
        opacity: fadeAnim
      }]}>
          <View style={{
        height: Platform.OS === 'android' ? 24 : 44
      }} />
          <Image source={require('../../assets/images/splash.png')} style={{
        flex: 1,
        width: '100%'
      }} contentFit="cover" />
          <BrandingFooter variant="splash" containerStyle={styles.splashFooter} textStyle={styles.splashFooterText} />
        </Animated.View>}
    </View>;
};
const styles = StyleSheet.create({
  initializingContainer: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  splashFooter: {
    width: '100%',
    backgroundColor: COLORS.primary,
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