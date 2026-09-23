import { supabase } from './supabase';
import { fetchUserPassesFromDb } from './passService';

export const saveTicket = async (ticketId: string, ticket: any): Promise<void> => {
  const row = {
    id: ticketId,
    user_id: ticket.userId || ticket.user_id,
    route: ticket.route,
    source: ticket.source,
    destination: ticket.destination,
    fare: Number(ticket.fare) || 0,
    passengers: Number(ticket.passengers) || 1,
    status: (ticket.status || 'ACTIVE').toUpperCase(),
    bus_type: (ticket.busType || ticket.bus_type || 'Non-AC').toUpperCase(),
    device_id: ticket.deviceId || ticket.device_id || null,
  };
  const { error } = await supabase.from('tickets').upsert(row);
  if (error) {
    console.error('[ticketService] Error saving ticket to Supabase:', error);
    throw error;
  }
};

export const expireTicketInDb = async (ticketId: string): Promise<void> => {
  if (!ticketId) return;
  try {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'EXPIRED' })
      .eq('id', ticketId);
    if (error) {
      console.error('[ticketService] Error updating ticket status to EXPIRED:', error);
    }
  } catch (err) {
    console.error('[ticketService] Error marking ticket expired:', err);
  }
};

export const fetchUserTicketsFromDb = async (userId: string): Promise<any[]> => {
  try {
    const [{ data, error }, passes] = await Promise.all([
      supabase
        .from('tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      fetchUserPassesFromDb(userId),
    ]);

    const now = Date.now();
    const expiredIds: string[] = [];

    const mappedTickets = (error || !data) ? [] : data.map((t: any) => {
      const d = t.created_at ? new Date(t.created_at) : new Date();
      const ts = d.getTime();
      const exp = ts + 2 * 60 * 60 * 1000;
      const isPast = now > exp;
      let status = t.status;
      if (isPast && String(status).toUpperCase() === 'ACTIVE') {
        status = 'EXPIRED';
        expiredIds.push(t.id);
      }
      const dateStr = `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('en-GB', { month: 'short' })}, ${d.getFullYear()}`;
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      return {
        id: t.id,
        tid: t.id,
        user_id: t.user_id,
        userId: t.user_id,
        route: t.route,
        source: t.source,
        destination: t.destination,
        fare: Number(t.fare || 0),
        passengers: Number(t.passengers || 1),
        status,
        timestamp: ts,
        created_at: t.created_at,
        expiresAt: exp,
        date: dateStr,
        time: timeStr,
        is_pass: false,
        isPass: false,
        busType: t.bus_type || (t.route && t.route.toLowerCase().includes('ac') ? 'AC' : 'Non-AC'),
        bus_type: t.bus_type || (t.route && t.route.toLowerCase().includes('ac') ? 'AC' : 'Non-AC'),
        device_id: t.device_id,
        deviceId: t.device_id,
      };
    });

    if (expiredIds.length > 0) {
      supabase
        .from('tickets')
        .update({ status: 'EXPIRED' })
        .in('id', expiredIds)
        .then(({ error: updateErr }) => {
          if (updateErr) {
            console.error('[ticketService] Error batch updating expired tickets in DB:', updateErr);
          }
        });
    }

    const combined = [...mappedTickets, ...(passes || [])];
    combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return combined;
  } catch (err) {
    console.error('[ticketService] Error fetching tickets & passes:', err);
    return [];
  }
};