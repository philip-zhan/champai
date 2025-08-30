import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { tickets } from "./schema/tickets";
import { ticketComments } from "./schema/ticketComments";

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    tickets,
    ticketComments,
  },
});
