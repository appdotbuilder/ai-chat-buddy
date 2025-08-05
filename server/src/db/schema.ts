
import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);
export const aiAgentTypeEnum = pgEnum('ai_agent_type', [
  'emotional_support',
  'psychology', 
  'sociology',
  'general_qa',
  'meal_planning',
  'travel_planning'
]);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Conversations table
export const conversationsTable = pgTable('conversations', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  title: text('title'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Messages table
export const messagesTable = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversation_id: integer('conversation_id').notNull().references(() => conversationsTable.id),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  ai_agent_type: aiAgentTypeEnum('ai_agent_type'), // Nullable for user messages
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  conversations: many(conversationsTable)
}));

export const conversationsRelations = relations(conversationsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [conversationsTable.user_id],
    references: [usersTable.id]
  }),
  messages: many(messagesTable)
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  conversation: one(conversationsTable, {
    fields: [messagesTable.conversation_id],
    references: [conversationsTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Conversation = typeof conversationsTable.$inferSelect;
export type NewConversation = typeof conversationsTable.$inferInsert;
export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  users: usersTable, 
  conversations: conversationsTable, 
  messages: messagesTable 
};
