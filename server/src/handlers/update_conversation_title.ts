
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type UpdateConversationTitleInput, type Conversation } from '../schema';
import { eq } from 'drizzle-orm';

export const updateConversationTitle = async (input: UpdateConversationTitleInput): Promise<Conversation> => {
  try {
    // Update conversation title and updated_at timestamp
    const result = await db.update(conversationsTable)
      .set({
        title: input.title,
        updated_at: new Date()
      })
      .where(eq(conversationsTable.id, input.conversation_id))
      .returning()
      .execute();

    // Check if conversation exists
    if (result.length === 0) {
      throw new Error(`Conversation with id ${input.conversation_id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Conversation title update failed:', error);
    throw error;
  }
};
