import { db } from './firebase';

export const saveTicket = async (ticketId: string, ticket: any): Promise<void> => {
  await db.collection("tickets").doc(ticketId).set(ticket);
};
