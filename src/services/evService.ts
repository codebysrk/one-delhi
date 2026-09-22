import { supabase } from './supabase';

export interface EVStation {
  id: string;
  name: string;
  status: string;
  distance: string;
  address: string;
  supports: string;
  lat: number;
  lng: number;
}

export const getEVStations = async (): Promise<EVStation[]> => {
  try {
    const { data } = await supabase
      .from('ev_stations')
      .select('*')
      .limit(50);
    return (data || []) as EVStation[];
  } catch (_) {
    return [];
  }
};

export const saveEVStation = async (station: EVStation): Promise<void> => {
  try {
    await supabase.from('ev_stations').upsert(station);
  } catch (_) {}
};