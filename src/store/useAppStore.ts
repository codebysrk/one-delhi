import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket } from '../utils/ticketHelper';

interface AppState {
  user: any | null;
  userProfile: any | null;
  tickets: Ticket[];
  loading: boolean;
  showFooter: boolean;
  deviceId: string | null;
  setUser: (user: any) => void;
  setUserProfile: (profile: any) => void;
  setTickets: (tickets: Ticket[]) => void;
  addTicket: (ticket: Ticket) => void;
  setLoading: (loading: boolean) => void;
  setShowFooter: (show: boolean) => void;
  setDeviceId: (id: string | null) => void;
  resetStore: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      userProfile: null,
      tickets: [],
      loading: false,
      showFooter: true,
      deviceId: null,

      setUser: (user) => set({ user }),
      setUserProfile: (userProfile) => set({ userProfile }),
      setTickets: (tickets) => set({ tickets }),
      addTicket: (ticket) => set((state) => ({ 
        tickets: [ticket, ...state.tickets] 
      })),
      setLoading: (loading) => set({ loading }),
      setShowFooter: (show) => set({ showFooter: show }),
      setDeviceId: (deviceId) => set({ deviceId }),
      resetStore: () => set({ user: null, userProfile: null, tickets: [], loading: false, deviceId: null }),
    }),
    {
      name: 'railone-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
