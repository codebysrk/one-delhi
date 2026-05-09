import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket } from '../utils/ticketHelper';

interface AppState {
  user: any | null;
  tickets: Ticket[];
  loading: boolean;
  showFooter: boolean;
  setUser: (user: any) => void;
  setTickets: (tickets: Ticket[]) => void;
  addTicket: (ticket: Ticket) => void;
  setLoading: (loading: boolean) => void;
  setShowFooter: (show: boolean) => void;
  resetStore: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      tickets: [],
      loading: false,
      showFooter: true,

      setUser: (user) => set({ user }),
      setTickets: (tickets) => set({ tickets }),
      addTicket: (ticket) => set((state) => ({ 
        tickets: [ticket, ...state.tickets] 
      })),
      setLoading: (loading) => set({ loading }),
      setShowFooter: (show) => set({ showFooter: show }),
      resetStore: () => set({ user: null, tickets: [], loading: false }),
    }),
    {
      name: 'railone-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
