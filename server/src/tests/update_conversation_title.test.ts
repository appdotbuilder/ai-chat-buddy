
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable } from '../db/schema';
import { type UpdateConversationTitleInput, type CreateUserInput, type CreateConversationInput } from '../schema';
import { updateConversationTitle } from '../handlers/update_conversation_title';
import { eq } from 'drizzle-orm';

// Test input for updating conversation title
const testUpdateInput: UpdateConversationTitleInput = {
  conversation_id: 1,
  title: 'Updated Conversation Title'
};

// Test data for creating prerequisites
const testUserInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com'
};

const testConversationInput: CreateConversationInput = {
  user_id: 1,
  title: 'Original Title'
};

describe('updateConversationTitle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update conversation title', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create conversation
    const conversationResult = await db.insert(conversationsTable)
      .values({
        ...testConversationInput,
        user_id: userId
      })
      .returning()
      .execute();

    const conversationId = conversationResult[0].id;

    // Update the conversation title
    const result = await updateConversationTitle({
      conversation_id: conversationId,
      title: 'Updated Conversation Title'
    });

    // Validate the response
    expect(result.id).toEqual(conversationId);
    expect(result.title).toEqual('Updated Conversation Title');
    expect(result.user_id).toEqual(userId);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should save updated title to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create conversation
    const conversationResult = await db.insert(conversationsTable)
      .values({
        ...testConversationInput,
        user_id: userId
      })
      .returning()
      .execute();

    const conversationId = conversationResult[0].id;

    // Update the conversation title
    await updateConversationTitle({
      conversation_id: conversationId,
      title: 'Updated Conversation Title'
    });

    // Query database to verify the update
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .execute();

    expect(conversations).toHaveLength(1);
    expect(conversations[0].title).toEqual('Updated Conversation Title');
    expect(conversations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent conversation', async () => {
    const nonExistentId = 999;

    await expect(updateConversationTitle({
      conversation_id: nonExistentId,
      title: 'Some Title'
    })).rejects.toThrow(/not found/i);
  });

  it('should handle null title update', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create conversation with null title
    const conversationResult = await db.insert(conversationsTable)
      .values({
        user_id: userId,
        title: null
      })
      .returning()
      .execute();

    const conversationId = conversationResult[0].id;

    // Update to a proper title
    const result = await updateConversationTitle({
      conversation_id: conversationId,
      title: 'New Title'
    });

    expect(result.title).toEqual('New Title');
    expect(result.id).toEqual(conversationId);
  });
});
