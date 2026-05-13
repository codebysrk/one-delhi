import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LoginScreen } from '../features/auth/LoginScreen';
import { SignupScreen } from '../features/auth/SignupScreen';
import { MapScreen } from '../features/home/MapScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { BookingScreen } from '../features/booking/BookingScreen';
import { PaymentScreen } from '../features/payment/PaymentScreen';
import { TicketScreen } from '../features/qr/TicketScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { SettingsScreen } from '../features/profile/SettingsScreen';
import { EVScreen } from '../features/ev/EVScreen';
import { PassScreen } from '../features/pass/PassScreen';
import { AdminScreen } from '../features/admin/AdminScreen';
import { SearchScreen } from '../features/home/SearchScreen';
import { RouteDetailScreen } from '../features/home/RouteDetailScreen';
import { NotificationScreen } from '../features/notifications/NotificationScreen';
import { HelpScreen } from '../features/profile/HelpScreen';
import { useAppStore } from '../store/useAppStore';
import { db, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { RemixIcon } from '../components/RemixIcon';
import { COLORS } from '../core/theme';
import { Rocket } from 'lucide-react-native';
import { registerDevice, listenToDeviceSecurity, clearForceLogout } from '../services/deviceService';
import { logActivity } from '../services/logService';
import { signOut } from 'firebase/auth';
import { Alert } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const ComingSoon = ({ navigation }: any) => (
  <View style={{ flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
    <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 25 }}>
      <Rocket size={60} color="#D32F2F" />
    </View>
    <Text style={{ fontSize: 24, fontWeight: '700', color: '#111' }}>Coming Soon</Text>
    <Text style={{ marginTop: 10, color: '#666', fontSize: 16, textAlign: 'center', paddingHorizontal: 40 }}>
      We are working hard to bring this feature to you. Stay tuned!
    </Text>
  </View>
);

const MainTabs = () => {
  const { showFooter } = useAppStore();
  
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#EEE',
            height: 65,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: '#D32F2F',
          tabBarInactiveTintColor: '#555',
          headerShown: false,
          lazy: true,
        }}
      >
        <Tab.Screen 
          name="BusTab" 
          component={MapScreen} 
          options={{
            tabBarIcon: ({ color }) => <RemixIcon name="bus-fill" size={24} color={color} />,
            tabBarLabel: 'Bus'
          }}
        />
        <Tab.Screen 
          name="TicketsTab" 
          component={HomeScreen} 
          options={{
            tabBarIcon: ({ color }) => <RemixIcon name="ticket-fill" size={24} color={color} />,
            tabBarLabel: 'Tickets'
          }}
        />
        <Tab.Screen 
          name="HubTab" 
          component={EVScreen}
          options={{
            tabBarIcon: ({ color }) => <RemixIcon name="charging-pile-fill" size={24} color={color} />,
            tabBarLabel: 'Hub'
          }}
        />
        <Tab.Screen 
          name="TripPlanTab" 
          component={ComingSoon}
          options={{
            tabBarIcon: ({ color }) => <RemixIcon name="map-2-fill" size={24} color={color} />,
            tabBarLabel: 'Trip Plan'
          }}
        />
        <Tab.Screen 
          name="ProfileTab" 
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color }) => <RemixIcon name="user-fill" size={24} color={color} />,
            tabBarLabel: 'Profile'
          }}
        />
      </Tab.Navigator>
      
      {showFooter && (
        <View style={styles.footerContainer}>
          <View style={styles.footerShadow} />
          <View style={styles.globalFooter}>
            <Text style={styles.footerText}>Powered by IIIT-Delhi</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export const RootNavigator = () => {
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
      setTickets([]); // Set empty array on error to prevent stale data
    }
  }, [setTickets]);

  useEffect(() => {
    let isMounted = true;
    let securityUnsubscribe: (() => void) | null = null;

    const handleSecurityAction = async (action: 'BANNED' | 'LOGOUT', type: 'USER' | 'DEVICE') => {
      if (securityUnsubscribe) securityUnsubscribe();
      
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
    };

    const subscriber = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      
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

          // 3. Register Device
          const deviceResult = await registerDevice(
            firebaseUser.uid,
            profile.name || 'User',
            profile.email
          );

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

            // 6. Log Login
            await logActivity({
              type: 'SYSTEM',
              action: 'SESSION_START',
              details: 'User session restored automatically.',
              targetId: firebaseUser.uid,
              targetType: 'AUTH'
            });
          }
        }
        await fetchUserTickets(firebaseUser.uid); 
      } else {
        if (securityUnsubscribe) securityUnsubscribe();
        resetStore();
      }
      if (initializing && isMounted) setInitializing(false);
    });
    
    return () => {
      isMounted = false;
      subscriber?.();
      if (securityUnsubscribe) securityUnsubscribe();
    };
  }, [fetchUserTickets, resetStore, setUser, initializing, setUserProfile]);

  if (initializing) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      <NavigationContainer>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 200,
          }} 
        >
          {!user ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Search" component={SearchScreen} />
              <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ presentation: 'modal' }} />
              <Stack.Screen name="Notifications" component={NotificationScreen} />
              <Stack.Screen name="Booking" component={BookingScreen} />
              <Stack.Screen name="Payment" component={PaymentScreen} />
              <Stack.Screen name="Pass" component={PassScreen} />
              <Stack.Screen name="Ticket" component={TicketScreen} options={{ presentation: 'modal' }} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="Admin" component={AdminScreen} />
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
});
