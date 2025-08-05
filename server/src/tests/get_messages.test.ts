
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable, messagesTable } from '../db/schema';
import { type GetMessagesInput } from '../schema';
import { getMessages } from '../handlers/get_messages';

describe('getMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for non-existent conversation', async () => {
    const input: GetMessagesInput = {
      conversation_id: 999
    };

    const result = await getMessages(input);
    expect(result).toEqual([]);
  });

  it('should return messages for a conversation in chronological order', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create test conversation
    const [conversation] = await db.insert(conversationsTable)
      .values({
        user_id: user.id,
        title: 'Test Conversation'
      })
      .returning()
      .execute();

    // Create messages with different timestamps
    const now = new Date();
    const message1Time = new Date(now.getTime() - 2000); // 2 seconds ago
    const message2Time = new Date(now.getTime() - 1000); // 1 second ago
    const message3Time = now;

    // Insert messages in reverse chronological order to test ordering
    await db.insert(messagesTable)
      .values([
        {
          conversation_id: conversation.id,
          role: 'assistant',
          content: 'This is the third message',
          ai_agent_type: 'general_qa',
          created_at: message3Time
        },
        {
          conversation_id: conversation.id,
          role: 'user',
          content: 'This is the first message',
          created_at: message1Time
        },
        {
          conversation_id: conversation.id,
          role: 'assistant',
          content: 'This is the second message',
          ai_agent_type: 'emotional_support',
          created_at: message2Time
        }
      ])
      .execute();

    const input: GetMessagesInput = {
      conversation_id: conversation.id
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(3);
    
    // Verify chronological order (oldest first)
    expect(result[0].content).toEqual('This is the first message');
    expect(result[0].role).toEqual('user');
    expect(result[0].ai_agent_type).toBeNull();
    
    expect(result[1].content).toEqual('This is the second message');
    expect(result[1].role).toEqual('assistant');
    expect(result[1].ai_agent_type).toEqual('emotional_support');
    
    expect(result[2].content).toEqual('This is the third message');
    expect(result[2].role).toEqual('assistant');
    expect(result[2].ai_agent_type).toEqual('general_qa');

    // Verify all messages have required fields
    result.forEach(message => {
      expect(message.id).toBeDefined();
      expect(message.conversation_id).toEqual(conversation.id);
      expect(message.content).toBeDefined();
      expect(message.role).toBeDefined();
      expect(message.created_at).toBeInstanceOf(Date);
    });
  });

  it('should only return messages for the specified conversation', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create two conversations
    const [conversation1] = await db.insert(conversationsTable)
      .values({
        user_id: user.id,
        title: 'Conversation 1'
      })
      .returning()
      .execute();

    const [conversation2] = await db.insert(conversationsTable)
      .values({
        user_id: user.id,
        title: 'Conversation 2'
      })
      .returning()
      .execute();

    // Add messages to both conversations
    await db.insert(messagesTable)
      .values([
        {
          conversation_id: conversation1.id,
          role: 'user',
          content: 'Message in conversation 1'
        },
        {
          conversation_id: conversation2.id,
          role: 'user',
          content: 'Message in conversation 2'
        }
      ])
      .execute();

    const input: GetMessagesInput = {
      conversation_id: conversation1.id
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('Message in conversation 1');
    expect(result[0].conversation_id).toEqual(conversation1.id);
  });
});
