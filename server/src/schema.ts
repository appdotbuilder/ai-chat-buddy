
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Conversation schema
export const conversationSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Conversation = z.infer<typeof conversationSchema>;

// Message role enum
export const messageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof messageRoleSchema>;

// AI agent type enum
export const aiAgentTypeSchema = z.enum([
  'emotional_support',
  'psychology',
  'sociology', 
  'general_qa',
  'meal_planning',
  'travel_planning'
]);
export type AiAgentType = z.infer<typeof aiAgentTypeSchema>;

// Message schema
export const messageSchema = z.object({
  id: z.number(),
  conversation_id: z.number(),
  role: messageRoleSchema,
  content: z.string(),
  ai_agent_type: aiAgentTypeSchema.nullable(),
  created_at: z.coerce.date()
});

export type Message = z.infer<typeof messageSchema>;

// Input schemas for creating/updating data
export const createUserInputSchema = z.object({
  username: z.string().min(1).max(50),
  email: z.string().email()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createConversationInputSchema = z.object({
  user_id: z.number(),
  title: z.string().nullable().optional()
});

export type CreateConversationInput = z.infer<typeof createConversationInputSchema>;

export const sendMessageInputSchema = z.object({
  conversation_id: z.number(),
  content: z.string().min(1),
  ai_agent_type: aiAgentTypeSchema.optional()
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

export const getConversationsInputSchema = z.object({
  user_id: z.number()
});

export type GetConversationsInput = z.infer<typeof getConversationsInputSchema>;

export const getMessagesInputSchema = z.object({
  conversation_id: z.number()
});

export type GetMessagesInput = z.infer<typeof getMessagesInputSchema>;

export const updateConversationTitleInputSchema = z.object({
  conversation_id: z.number(),
  title: z.string()
});

export type UpdateConversationTitleInput = z.infer<typeof updateConversationTitleInputSchema>;
