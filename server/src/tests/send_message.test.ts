
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, conversationsTable, messagesTable } from '../db/schema';
import { type SendMessageInput } from '../schema';
import { sendMessage } from '../handlers/send_message';
import { eq } from 'drizzle-orm';

describe('sendMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let conversationId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test conversation
    const conversationResult = await db.insert(conversationsTable)
      .values({
        user_id: userId,
        title: 'Test Conversation'
      })
      .returning()
      .execute();
    conversationId = conversationResult[0].id;
  });

  it('should save user message and return AI response', async () => {
    const testInput: SendMessageInput = {
      conversation_id: conversationId,
      content: 'Hello, I need help with something.',
      ai_agent_type: 'general_qa'
    };

    const result = await sendMessage(testInput);

    // Verify AI response message structure
    expect(result.conversation_id).toEqual(conversationId);
    expect(result.role).toEqual('assistant');
    expect(result.content).toContain('谢谢你的提问');
    expect(result.ai_agent_type).toEqual('general_qa');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save both user and AI messages to database', async () => {
    const testInput: SendMessageInput = {
      conversation_id: conversationId,
      content: 'Test message content',
      ai_agent_type: 'psychology'
    };

    await sendMessage(testInput);

    // Query all messages for this conversation
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.conversation_id, conversationId))
      .execute();

    expect(messages).toHaveLength(2);

    // Check user message
    const userMessage = messages.find(m => m.role === 'user');
    expect(userMessage).toBeDefined();
    expect(userMessage!.content).toEqual('Test message content');
    expect(userMessage!.ai_agent_type).toBeNull();

    // Check AI message
    const aiMessage = messages.find(m => m.role === 'assistant');
    expect(aiMessage).toBeDefined();
    expect(aiMessage!.content).toContain('心理学视角');
    expect(aiMessage!.ai_agent_type).toEqual('psychology');
  });

  it('should use general_qa as default agent type', async () => {
    const testInput: SendMessageInput = {
      conversation_id: conversationId,
      content: 'Message without agent type'
    };

    const result = await sendMessage(testInput);

    expect(result.ai_agent_type).toEqual('general_qa');
    expect(result.content).toContain('谢谢你的提问');
  });

  it('should generate appropriate responses for different agent types', async () => {
    const agentTypes = [
      'emotional_support',
      'psychology',
      'sociology',
      'meal_planning',
      'travel_planning'
    ] as const;

    for (const agentType of agentTypes) {
      const testInput: SendMessageInput = {
        conversation_id: conversationId,
        content: `Test message for ${agentType}`,
        ai_agent_type: agentType
      };

      const result = await sendMessage(testInput);

      expect(result.ai_agent_type).toEqual(agentType);
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    }
  });

  it('should handle conversation with foreign key constraint', async () => {
    const testInput: SendMessageInput = {
      conversation_id: conversationId,
      content: 'Test foreign key handling'
    };

    const result = await sendMessage(testInput);

    // Verify the message was saved with correct foreign key
    const savedMessage = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, result.id))
      .execute();

    expect(savedMessage).toHaveLength(1);
    expect(savedMessage[0].conversation_id).toEqual(conversationId);
  });

  it('should throw error for non-existent conversation', async () => {
    const testInput: SendMessageInput = {
      conversation_id: 99999, // Non-existent conversation ID
      content: 'This should fail'
    };

    await expect(sendMessage(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
