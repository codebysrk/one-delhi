import { db } from './firebase';

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
  const snapshot = await db.collection("routes").get();
  const list: Route[] = [];
  snapshot.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() } as Route);
  });
  return list;
};

export const getStops = async (): Promise<Stop[]> => {
  const snapshot = await db.collection("stops").get();
  const list: Stop[] = [];
  snapshot.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() } as Stop);
  });
  return list;
};

export const getFareConfig = async (): Promise<any> => {
  const doc = await db.collection("metadata").doc("fare_config").get();
  if (doc.exists) {
    return doc.data();
  }
  return null;
};
