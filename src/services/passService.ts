import { db } from './firebase';

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
  await db.collection("passes").doc(passId).set(pass);
};
