import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function createNotification(
  customerId: number,
  type: string,
  title: string,
  message: string
) {
  await db.insert(notifications).values({
    customerId,
    type,
    title,
    message,
  });
}
