
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, usersTable } from '../db/schema';
import { type CreateConversationInput } from '../schema';
import { createConversation } from '../handlers/create_conversation';
import { eq } from 'drizzle-orm';

describe('createConversation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user for all conversation tests
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  it('should create a conversation with title', async () => {
    const testInput: CreateConversationInput = {
      user_id: testUserId,
      title: 'Test Conversation'
    };

    const result = await createConversation(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.title).toEqual('Test Conversation');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a conversation without title', async () => {
    const testInput: CreateConversationInput = {
      user_id: testUserId
    };

    const result = await createConversation(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.title).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save conversation to database', async () => {
    const testInput: CreateConversationInput = {
      user_id: testUserId,
      title: 'Saved Conversation'
    };

    const result = await createConversation(testInput);

    // Query using proper drizzle syntax
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, result.id))
      .execute();

    expect(conversations).toHaveLength(1);
    expect(conversations[0].user_id).toEqual(testUserId);
    expect(conversations[0].title).toEqual('Saved Conversation');
    expect(conversations[0].created_at).toBeInstanceOf(Date);
    expect(conversations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const testInput: CreateConversationInput = {
      user_id: 999999, // Non-existent user ID
      title: 'Invalid User Conversation'
    };

    expect(createConversation(testInput)).rejects.toThrow(/User with id 999999 does not exist/i);
  });

  it('should handle null title explicitly', async () => {
    const testInput: CreateConversationInput = {
      user_id: testUserId,
      title: null
    };

    const result = await createConversation(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.title).toBeNull();
    expect(result.id).toBeDefined();
  });
});
