import { supabase } from './supabase';

export const saveTicket = async (ticketId: string, ticket: any): Promise<void> => {
  const row = {
    id: ticketId,
    user_id: ticket.userId,
    user_name: ticket.userName,
    user_email: ticket.userEmail,
    route: ticket.route,
    source: ticket.source || ticket.from,
    destination: ticket.destination || ticket.to,
    fare: Number(ticket.fare ?? ticket.total ?? ticket.baseFare) || 0,
    passengers: Number(ticket.passengers) || 1,
    bus_number: ticket.busNumber,
    qr_payload: ticket.qrPayload,
    is_used: ticket.isUsed || false,
    status: ticket.status || 'ACTIVE',
    expiry_time: ticket.expiryTime || ticket.expiresAt,
    timestamp: ticket.timestamp || new Date().toISOString(),
  };
  await supabase.from('tickets').upsert(row);
};

export const fetchUserTicketsFromDb = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });
  if (error || !data) return [];
  return data.map((t: any) => ({
    id: t.id,
    userId: t.user_id,
    userName: t.user_name,
    userEmail: t.user_email,
    route: t.route,
    source: t.source,
    from: t.source,
    destination: t.destination,
    to: t.destination,
    fare: t.fare,
    passengers: t.passengers,
    busNumber: t.bus_number,
    qrPayload: t.qr_payload,
    isUsed: t.is_used,
    status: t.status,
    expiryTime: t.expiry_time,
    expiresAt: t.expiry_time,
    timestamp: t.timestamp,
  }));
};