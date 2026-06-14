import { db } from './firebase';

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
  const snapshot = await db.collection("ev_stations").limit(50).get();
  const list: EVStation[] = [];
  snapshot.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() } as EVStation);
  });
  return list;
};

export const saveEVStation = async (station: EVStation): Promise<void> => {
  await db.collection("ev_stations").doc(station.id).set(station);
};
