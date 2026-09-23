import { supabase } from './supabase';

export interface BusPass {
  passId: string;
  userId: string;
  passType: string;
  status: string;
  validFrom: number;
  validTill: number;
  createdAt: number;
  holderName: string;
  phone: string;
  dob: string;
  idType: string;
  idLastDigits: string;
  fare: string;
  paymentStatus: string;
  txnId: string;
}

export const savePass = async (passId: string, pass: BusPass): Promise<void> => {
  try {
    const validFromIso = pass.validFrom ? new Date(pass.validFrom).toISOString() : new Date().toISOString();
    const validTillIso = pass.validTill ? new Date(pass.validTill).toISOString() : new Date().toISOString();
    const fareNum = Number(pass.fare) || 0;

    await supabase.from('passes').upsert({
      id: passId,
      user_id: pass.userId,
      pass_type: pass.passType,
      status: (pass.status || 'ACTIVE').toUpperCase(),
      valid_from: validFromIso,
      valid_till: validTillIso,
      holder_name: pass.holderName,
      phone: pass.phone,
      dob: pass.dob,
      id_type: pass.idType,
      id_last_digits: pass.idLastDigits,
      fare: fareNum,
      payment_status: pass.paymentStatus || 'PAID',
    });

  } catch (e) {
    console.error('[passService] Error saving pass:', e);
  }
};

export const fetchUserPassesFromDb = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('passes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((p: any) => {
      const createdAtDate = p.created_at ? new Date(p.created_at) : new Date();
      const validFromDate = p.valid_from ? new Date(p.valid_from) : createdAtDate;
      const validTillDate = p.valid_till ? new Date(p.valid_till) : new Date(createdAtDate.getTime() + 24 * 60 * 60 * 1000);

      const ts = validFromDate.getTime();
      const exp = validTillDate.getTime();
      const dateStr = `${validFromDate.getDate().toString().padStart(2, '0')} ${validFromDate.toLocaleString('en-GB', { month: 'short' })}, ${validFromDate.getFullYear()}`;
      const timeStr = validFromDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      return {
        id: p.id,
        tid: p.id,
        userId: p.user_id,
        route: 'BUS PASS',
        source: 'Delhi NCR',
        destination: p.pass_type || 'All Route Pass',
        fare: Number(p.fare || 0),
        passengers: 1,
        status: p.status,
        timestamp: ts,
        expiresAt: exp,
        date: dateStr,
        time: timeStr,
        isPass: true,
        passName: p.pass_type,
        holderName: p.holder_name,
        phone: p.phone,
        dob: p.dob,
        idType: p.id_type,
        idLastDigits: p.id_last_digits,
        paymentStatus: p.payment_status,
        txnId: p.txn_id,
      };
    });
  } catch (err) {
    console.error('[passService] Error fetching passes:', err);
    return [];
  }
};