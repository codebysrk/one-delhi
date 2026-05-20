// Ticket Status Constants
export enum TicketStatus {
  ACTIVE = 'Active',
  INVALID = 'INVALID'
}

/**
 * Extracts only the route number from a full route string
 * Example: "857 - Hasan Pur Village → Shakarpur X-ing" -> "857"
 */
export const getRouteNumberOnly = (route: string): string => {
  if (!route) return '';
  // 1. Get the first part (before space or bracket)
  const base = route.split(/[\s(]/)[0].trim();
  // 2. Strip UP or DOWN suffix for clean display
  return base.replace(/UP$|DOWN$/, '');
};

/**
 * Formats any time string to 12-hour format with AM/PM
 * Handles "HH:mm:ss" or existing 12hr strings
 */
export const formatTimeTo12hr = (timeStr: string): string => {
  if (!timeStr) return '';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;
  
  try {
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    const m = minutes || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};


export interface Ticket {
  tid: string;
  id?: string; // Document ID
  userId: string;
  route: string;
  source: string;
  dest: string;
  src?: string; // Backward compatibility
  dst?: string; // Backward compatibility
  busType: 'AC' | 'Non-AC';
  fare: number;
  baseFare: number;
  finalFare: string;
  total: string;
  qty: number;
  status: 'Active' | 'Expired' | 'INVALID';
  date: string;
  time: string;
  timestamp: number;
  fareSource: string;
  slab: {
    acFare: number;
    nonACFare: number;
    maxStops: number;
    minStops: number;
  };
}

/**
 * Utility to check if a ticket is expired (2 hours validity)
 */
export const isTicketExpired = (timestamp: any): boolean => {
  if (!timestamp) return false;
  const ts = typeof timestamp === 'number' 
    ? timestamp 
    : (timestamp?.toMillis?.() || (timestamp?.seconds ? timestamp.seconds * 1000 : 0));
  
  if (!ts) return false;
  const now = Date.now();
  const twoHoursInMs = 2 * 60 * 60 * 1000;
  return (now - ts) > twoHoursInMs;
};

/**
 * Get remaining validity time in "01h 12m" format
 */
export const getRemainingValidity = (timestamp: any): string => {
  const ts = typeof timestamp === 'number' 
    ? timestamp 
    : (timestamp?.toMillis?.() || (timestamp?.seconds ? timestamp.seconds * 1000 : 0));
    
  if (!ts) return "Expired";
  const now = Date.now();
  const twoHoursInMs = 2 * 60 * 60 * 1000;
  const remainingMs = (ts + twoHoursInMs) - now;
  
  if (remainingMs <= 0) return "Expired";
  
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
};
/**
 * Generate a unique ticket ID in format: T + DDMMYYYY + 10-char hex
 * Example: T050520265baff746fa
 */
export const generateTicketId = (): string => {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString();
  
  const dateStr = `${day}${month}${year}`;
  
  // Generate 10-character random hex string
  const hexStr = Math.random().toString(16).substring(2, 12).padEnd(10, '0');
  
  return `T${dateStr}${hexStr}`;
};

/**
 * Filter and sort tickets to find the latest valid active ticket
 */
export const getLatestActiveTicket = (tickets: Ticket[]): Ticket | null => {
  const activeOnes = tickets.filter(t => 
    t.status === TicketStatus.ACTIVE && !isTicketExpired(t.timestamp)
  );
  
  if (activeOnes.length === 0) return null;
  
  const getMs = (timestamp: any): number => {
    if (!timestamp) return 0;
    return typeof timestamp === 'number' 
      ? timestamp 
      : (timestamp.toMillis?.() || (timestamp.seconds ? timestamp.seconds * 1000 : 0));
  };
  
  return activeOnes.sort((a, b) => getMs(b.timestamp) - getMs(a.timestamp))[0];
};
