import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket } from '../utils/ticketHelper';

interface AppState {
  user: any | null;
  userProfile: any | null;
  tickets: Ticket[];
  cachedStops: any[];
  loading: boolean;
  showFooter: boolean;
  deviceId: string | null;
  setUser: (user: any) => void;
  setUserProfile: (profile: any) => void;
  setTickets: (tickets: Ticket[]) => void;
  setCachedStops: (stops: any[]) => void;
  addTicket: (ticket: Ticket) => void;
  setLoading: (loading: boolean) => void;
  setShowFooter: (show: boolean) => void;
  recentRoutes: any[];
  recentTrips: { id: string; source: string; dest: string; timestamp: number }[];
  lastSeenNotification: number;
  latestNotificationTimestamp: number;
  isVerifying: boolean;
  isAuthReady: boolean;
  setDeviceId: (id: string | null) => void;
  setLastSeenNotification: (timestamp: number) => void;
  setLatestNotificationTimestamp: (timestamp: number) => void;
  setIsVerifying: (val: boolean) => void;
  setIsAuthReady: (val: boolean) => void;
  addRecentRoute: (route: any) => void;
  removeRecentRoute: (routeId: string) => void;
  clearRecentRoutes: () => void;
  addRecentTrip: (source: string, dest: string) => void;
  removeRecentTrip: (id: string) => void;
  clearRecentTrips: () => void;
  resetStore: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      userProfile: null,
      tickets: [],
      cachedStops: [],
      loading: false,
      showFooter: true,
      deviceId: null,
      recentRoutes: [],
      recentTrips: [],
      lastSeenNotification: 0,
      latestNotificationTimestamp: 0,
      isVerifying: false,
      isAuthReady: false,

      setUser: (user) => set({ user }),
      setUserProfile: (userProfile) => set({ userProfile }),
      setTickets: (tickets) => set({ tickets }),
      setCachedStops: (cachedStops) => set({ cachedStops }),
      addTicket: (ticket) => set((state) => ({ 
        tickets: [ticket, ...state.tickets] 
      })),
      setLoading: (loading) => set({ loading }),
      setShowFooter: (show) => set({ showFooter: show }),
      setDeviceId: (deviceId) => set({ deviceId }),
      setLastSeenNotification: (timestamp) => set({ lastSeenNotification: timestamp }),
      setLatestNotificationTimestamp: (timestamp) => set({ latestNotificationTimestamp: timestamp }),
      setIsVerifying: (isVerifying) => set({ isVerifying }),
      setIsAuthReady: (isAuthReady) => set({ isAuthReady }),
      addRecentRoute: (route) => set((state) => {
        // Filter out existing route to avoid duplicates and keep it at top
        const filtered = state.recentRoutes.filter(r => r.route !== route.route);
        const updated = [route, ...filtered].slice(0, 5); // Limit to 5 recent routes
        return { recentRoutes: updated };
      }),
      removeRecentRoute: (routeId) => set((state) => ({
        recentRoutes: state.recentRoutes.filter(r => r.route !== routeId)
      })),
      clearRecentRoutes: () => set({ recentRoutes: [] }),
      addRecentTrip: (source, dest) => set((state) => {
        const id = `${source}_${dest}_${Date.now()}`;
        // Filter out existing similar trips to avoid duplicates
        const filtered = state.recentTrips.filter(t => !(t.source === source && t.dest === dest));
        const updated = [{ id, source, dest, timestamp: Date.now() }, ...filtered].slice(0, 5);
        return { recentTrips: updated };
      }),
      removeRecentTrip: (id) => set((state) => ({
        recentTrips: state.recentTrips.filter(t => t.id !== id)
      })),
      clearRecentTrips: () => set({ recentTrips: [] }),
      resetStore: () => set({ user: null, userProfile: null, tickets: [], cachedStops: [], loading: false, deviceId: null, recentRoutes: [], recentTrips: [], isVerifying: false, isAuthReady: false }),
    }),
    {
      name: 'railone-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
