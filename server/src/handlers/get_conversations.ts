
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type GetConversationsInput, type Conversation } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getConversations(input: GetConversationsInput): Promise<Conversation[]> {
  try {
    const result = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.user_id, input.user_id))
      .orderBy(desc(conversationsTable.updated_at))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    throw error;
  }
}
