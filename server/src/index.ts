
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  createUserInputSchema,
  createConversationInputSchema,
  sendMessageInputSchema,
  getConversationsInputSchema,
  getMessagesInputSchema,
  updateConversationTitleInputSchema
} from './schema';
import { createUser } from './handlers/create_user';
import { createConversation } from './handlers/create_conversation';
import { getConversations } from './handlers/get_conversations';
import { sendMessage } from './handlers/send_message';
import { getMessages } from './handlers/get_messages';
import { updateConversationTitle } from './handlers/update_conversation_title';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  // Conversation management
  createConversation: publicProcedure
    .input(createConversationInputSchema)
    .mutation(({ input }) => createConversation(input)),
  
  getConversations: publicProcedure
    .input(getConversationsInputSchema)
    .query(({ input }) => getConversations(input)),
  
  updateConversationTitle: publicProcedure
    .input(updateConversationTitleInputSchema)
    .mutation(({ input }) => updateConversationTitle(input)),
  
  // Message management
  sendMessage: publicProcedure
    .input(sendMessageInputSchema)
    .mutation(({ input }) => sendMessage(input)),
  
  getMessages: publicProcedure
    .input(getMessagesInputSchema)
    .query(({ input }) => getMessages(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
