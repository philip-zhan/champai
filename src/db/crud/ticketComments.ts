import { db } from "@/db";
import { ticketComments } from "@/db/schema/ticketComments";
import { InferInsertModel } from "drizzle-orm";

export async function insertTicketComments(
  payload: InferInsertModel<typeof ticketComments>[]
) {
  const result = await db.insert(ticketComments).values(payload);
  return result;
}
