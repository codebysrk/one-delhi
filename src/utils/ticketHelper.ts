export enum TicketStatus {
  ACTIVE = 'Active',
  INVALID = 'INVALID',
}
export const getRouteNumberOnly = (route: string): string => {
  if (!route) return '';
  const base = route.split(/[\s(]/)[0].trim();
  return base.replace(/UP$|DOWN$/, '');
};
export const formatTimeTo12hr = (timeStr: string): string => {
  if (!timeStr) return '';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;
  try {
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    const m = minutes || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};
export interface Ticket {
  tid: string;
  id?: string;
  userId: string;
  route: string;
  source: string;
  dest: string;
  src?: string;
  dst?: string;
  busType: 'AC' | 'Non-AC';
  fare: number;
  baseFare: number;
  finalFare: string;
  total: string;
  originalTotal?: string;
  toll?: number;
  isInterstate?: boolean;
  qty: number;
  status: 'Active' | 'Expired' | 'INVALID';
  date: string;
  time: string;
  timestamp: number;
  expiresAt?: number;
  fareSource: string;
  isCustom?: boolean;
  isPass?: boolean;
  passName?: string;
  holderName?: string;
  phone?: string;
  dob?: string;
  idType?: string;
  idLastDigits?: string;
  slab?: {
    acFare: number;
    nonACFare: number;
    maxStops?: number;
    minStops?: number;
    maxKm?: number;
    minKm?: number;
  };
}
export const isTicketExpired = (timestamp: any, expiresAt?: any): boolean => {
  const now = Date.now();
  if (expiresAt) {
    const exp = typeof expiresAt === 'number' ? expiresAt : expiresAt?.toMillis?.() || (expiresAt?.seconds ? expiresAt.seconds * 1000 : 0);
    if (exp) return now > exp;
  }
  if (!timestamp) return false;
  const ts = typeof timestamp === 'number' ? timestamp : timestamp?.toMillis?.() || (timestamp?.seconds ? timestamp.seconds * 1000 : 0);
  if (!ts) return false;
  const twoHoursInMs = 2 * 60 * 60 * 1000;
  return now - ts > twoHoursInMs;
};
export const getRemainingValidity = (timestamp: any, expiresAt?: any): string => {
  const ts = typeof timestamp === 'number' ? timestamp : timestamp?.toMillis?.() || (timestamp?.seconds ? timestamp.seconds * 1000 : 0);
  if (!ts) return "Expired";
  const now = Date.now();
  let remainingMs = 0;
  if (expiresAt) {
    const exp = typeof expiresAt === 'number' ? expiresAt : expiresAt?.toMillis?.() || (expiresAt?.seconds ? expiresAt.seconds * 1000 : 0);
    remainingMs = exp - now;
  } else {
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    remainingMs = ts + twoHoursInMs - now;
  }
  if (remainingMs <= 0) return "Expired";
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor(remainingMs % (1000 * 60 * 60) / (1000 * 60));
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
};
export const generateTicketId = (): string => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString();
  const dateStr = `${day}${month}${year}`;
  const hexStr = Math.random().toString(16).substring(2, 12).padEnd(10, '0');
  return `T${dateStr}${hexStr}`;
};
export const getLatestActiveTicket = (tickets: Ticket[]): Ticket | null => {
  const activeOnes = tickets.filter(t => t.status === TicketStatus.ACTIVE && !isTicketExpired(t.timestamp, t.expiresAt));
  if (activeOnes.length === 0) return null;
  const getMs = (timestamp: any): number => {
    if (!timestamp) return 0;
    return typeof timestamp === 'number' ? timestamp : timestamp.toMillis?.() || (timestamp.seconds ? timestamp.seconds * 1000 : 0);
  };
  return activeOnes.sort((a, b) => getMs(b.timestamp) - getMs(a.timestamp))[0];
};
export const getLatestTicket = (tickets: Ticket[]): Ticket | null => {
  const busTickets = tickets.filter(t => !t.isPass);
  if (busTickets.length === 0) return null;
  const getMs = (timestamp: any): number => {
    if (!timestamp) return 0;
    return typeof timestamp === 'number' ? timestamp : timestamp.toMillis?.() || (timestamp.seconds ? timestamp.seconds * 1000 : 0);
  };
  return busTickets.sort((a, b) => getMs(b.timestamp) - getMs(a.timestamp))[0];
};