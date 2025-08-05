
import { db } from '../db';
import { conversationsTable, usersTable } from '../db/schema';
import { type CreateConversationInput, type Conversation } from '../schema';
import { eq } from 'drizzle-orm';

export const createConversation = async (input: CreateConversationInput): Promise<Conversation> => {
  try {
    // Validate that the user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert conversation record
    const result = await db.insert(conversationsTable)
      .values({
        user_id: input.user_id,
        title: input.title || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Conversation creation failed:', error);
    throw error;
  }
};
