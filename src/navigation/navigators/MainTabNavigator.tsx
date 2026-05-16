import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { MapScreen } from '../../features/home/MapScreen';
import { HomeScreen } from '../../features/home/HomeScreen';
import { EVScreen } from '../../features/ev/EVScreen';
import { TripPlanScreen } from '../../features/trips/TripPlanScreen';
import { HelpScreen } from '../../features/profile/HelpScreen';
import { SearchScreen } from '../../features/home/SearchScreen';
import { TripPlanIcon } from '../../components/icons/TripPlanIcon';
import { useAppStore } from '../../store/useAppStore';
import { COLORS, TYPOGRAPHY, LAYOUT, ANIMATIONS } from '../../core/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabButton = (props: any) => {
  const { onPress, accessibilityState } = props;
  const focused = accessibilityState.selected;
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, ANIMATIONS.fastSpring);
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: 'rgba(0, 0, 0, 0.25)', borderless: true, radius: 45 }}
      style={styles.tabButton}
    >
      <Animated.View style={[animatedStyle, styles.tabButtonInner]}>
        {props.children}
      </Animated.View>
    </Pressable>
  );
};

const BusStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Map" component={MapScreen} />
    <Stack.Screen name="Search" component={SearchScreen} />
  </Stack.Navigator>
);

export const MainTabNavigator = () => {
  const { showFooter } = useAppStore();
  
  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarLabelStyle: styles.tabBarLabel,
          headerShown: false,
          lazy: true,
        }}
      >
        <Tab.Screen 
          name="BusTab" 
          component={BusStack} 
          options={{
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="bus" size={26} color={color} />,
            tabBarLabel: 'Bus',
            tabBarButton: (props) => <TabButton {...props} />
          }}
        />
        <Tab.Screen 
          name="TicketsTab" 
          component={HomeScreen} 
          options={{
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="ticket-confirmation" size={26} color={color} />,
            tabBarLabel: 'Tickets',
            tabBarButton: (props) => <TabButton {...props} />
          }}
        />
        <Tab.Screen 
          name="HubTab" 
          component={EVScreen}
          options={{
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="ev-station" size={26} color={color} />,
            tabBarLabel: 'Hub',
            tabBarButton: (props) => <TabButton {...props} />
          }}
        />
        <Tab.Screen 
          name="TripPlanTab" 
          component={TripPlanScreen}
          options={{
            tabBarIcon: ({ color }) => <TripPlanIcon color={color} size={26} />,
            tabBarLabel: 'Trip Plan',
            tabBarButton: (props) => <TabButton {...props} />
          }}
        />
        <Tab.Screen 
          name="HelpTab" 
          component={HelpScreen}
          options={{
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="help-circle" size={26} color={color} />,
            tabBarLabel: 'Help',
            tabBarButton: (props) => <TabButton {...props} />
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: LAYOUT.tabBarHeight,
    paddingBottom: 10,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: -8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerContainer: {
    backgroundColor: '#FFF',
  },
  footerShadow: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  globalFooter: { 
    backgroundColor: COLORS.primary,
    paddingVertical: 2, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  footerText: { 
    color: 'white', 
    fontSize: 10, 
    fontWeight: '500' 
  },
});
