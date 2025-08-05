
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable } from '../db/schema';
import { type GetConversationsInput } from '../schema';
import { getConversations } from '../handlers/get_conversations';
import { eq } from 'drizzle-orm';

describe('getConversations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return conversations for a user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test conversations
    await db.insert(conversationsTable)
      .values([
        {
          user_id: userId,
          title: 'First conversation'
        },
        {
          user_id: userId,
          title: 'Second conversation'
        }
      ])
      .execute();

    const input: GetConversationsInput = {
      user_id: userId
    };

    const result = await getConversations(input);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(userId);
    expect(result[1].user_id).toEqual(userId);
    expect(result[0].title).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return conversations ordered by most recent updated_at', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create conversations with different timestamps
    const olderDate = new Date('2023-01-01');
    const newerDate = new Date('2023-12-01');

    const conversationResults = await db.insert(conversationsTable)
      .values([
        {
          user_id: userId,
          title: 'Older conversation'
        },
        {
          user_id: userId,
          title: 'Newer conversation'
        }
      ])
      .returning()
      .execute();

    // Update timestamps to simulate different update times
    await db.update(conversationsTable)
      .set({ updated_at: olderDate })
      .where(eq(conversationsTable.id, conversationResults[0].id))
      .execute();

    await db.update(conversationsTable)
      .set({ updated_at: newerDate })
      .where(eq(conversationsTable.id, conversationResults[1].id))
      .execute();

    const input: GetConversationsInput = {
      user_id: userId
    };

    const result = await getConversations(input);

    expect(result).toHaveLength(2);
    // Should be ordered by most recent first
    expect(result[0].title).toEqual('Newer conversation');
    expect(result[1].title).toEqual('Older conversation');
    expect(result[0].updated_at.getTime()).toBeGreaterThan(result[1].updated_at.getTime());
  });

  it('should return empty array for user with no conversations', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    const input: GetConversationsInput = {
      user_id: userId
    };

    const result = await getConversations(input);

    expect(result).toHaveLength(0);
  });

  it('should only return conversations for the specified user', async () => {
    // Create two test users
    const userResults = await db.insert(usersTable)
      .values([
        {
          username: 'user1',
          email: 'user1@example.com'
        },
        {
          username: 'user2',
          email: 'user2@example.com'
        }
      ])
      .returning()
      .execute();
    
    const user1Id = userResults[0].id;
    const user2Id = userResults[1].id;

    // Create conversations for both users
    await db.insert(conversationsTable)
      .values([
        {
          user_id: user1Id,
          title: 'User 1 conversation'
        },
        {
          user_id: user2Id,
          title: 'User 2 conversation'
        }
      ])
      .execute();

    const input: GetConversationsInput = {
      user_id: user1Id
    };

    const result = await getConversations(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1Id);
    expect(result[0].title).toEqual('User 1 conversation');
  });
});
