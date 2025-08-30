'use server';

import { getTickets } from "@/lib/zendesk";

export async function syncTicketsAction() {
  console.log('Starting sync from Zendesk...');
  const data = await getTickets();
  console.log('Sync completed:', data);
  // Form actions should not return values, just log the results
}
