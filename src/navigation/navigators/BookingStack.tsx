import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BookingScreen } from '../../features/booking/BookingScreen';
import { PaymentScreen } from '../../features/payment/PaymentScreen';

const Stack = createNativeStackNavigator();

export const BookingStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
};
