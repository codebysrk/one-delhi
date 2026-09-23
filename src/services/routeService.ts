import { supabase } from './supabase';

export interface Route {
  id?: string;
  route: string;
  routeNumber?: string;
  isActive?: boolean;
  isNCR?: boolean;
  directions?: {
    up: {
      from: string;
      to: string;
      totalStops: number;
      stops: string[];
    };
    down?: {
      from: string;
      to: string;
      totalStops: number;
      stops: string[];
    };
  };
}

export interface Stop {
  id: string;
  name: string;
  type: string;
  lat?: number;
  lng?: number;
  isActive?: boolean;
}

export const getRoutes = async (): Promise<Route[]> => {
  const { data, error } = await supabase.from('routes').select('*');
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: r.id,
    route: r.route,
    routeNumber: r.route,
    isActive: r.is_active,

    isNCR: r.is_ncr,
    directions: r.directions,
  }));
};

export const getStops = async (): Promise<Stop[]> => {
  return [];
};

export const getFareConfig = async (): Promise<any> => {
  const { data, error } = await supabase.from('configs').select('value').eq('key', 'fare_config').maybeSingle();
  if (error || !data) return null;
  return data.value;
};