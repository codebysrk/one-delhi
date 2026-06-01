import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

export const linking: LinkingOptions<any> = {
  prefixes: [Linking.createURL('/'), 'onedelhi://', 'https://onedelhi.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
          Signup: 'signup',
        },
      },
      Main: {
        path: 'app',
        screens: {
          MapTab: {
            screens: {
              Map: 'map',
              Search: 'search',
            },
          },
          TicketsTab: 'tickets',
          HubTab: 'hub',
          TripPlanTab: 'plan',
          HelpTab: 'help',
        },
      },
      BookingStack: {
        path: 'checkout',
        screens: {
          Booking: 'booking',
          Payment: 'payment',
        },
      },
      ProfileStack: {
        path: 'profile',
        screens: {
          History: 'history',
          Settings: 'settings',
        },
      },
      Ticket: 'ticket',
      RouteDetail: 'route',
      Notifications: 'notifications',
      Pass: 'pass',
      ComingSoon: 'coming-soon',
    },
  },
};
