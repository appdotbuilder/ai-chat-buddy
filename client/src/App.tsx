
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { trpc } from '@/utils/trpc';
import type { Message, Conversation, User, AiAgentType } from '../../server/src/schema';

// Stub user data - in a real app this would come from authentication
const STUB_USER: User = {
  id: 1,
  username: 'demo_user',
  email: 'demo@example.com',
  created_at: new Date(),
  updated_at: new Date()
};

// Agent type configurations with Chinese labels and emojis
const AGENT_CONFIGS = {
  emotional_support: { label: '情感支持', emoji: '💝', color: 'bg-pink-100 text-pink-800' },
  psychology: { label: '心理学', emoji: '🧠', color: 'bg-purple-100 text-purple-800' },
  sociology: { label: '社会学', emoji: '👥', color: 'bg-blue-100 text-blue-800' },
  general_qa: { label: '常识问答', emoji: '💡', color: 'bg-yellow-100 text-yellow-800' },
  meal_planning: { label: '饮食规划', emoji: '🍽️', color: 'bg-green-100 text-green-800' },
  travel_planning: { label: '旅行规划', emoji: '✈️', color: 'bg-cyan-100 text-cyan-800' }
} as const;

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedAgentType, setSelectedAgentType] = useState<AiAgentType>('general_qa');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getConversations.query({ user_id: STUB_USER.id });
      setConversations(result);
      // Select first conversation if available
      if (result.length > 0 && !currentConversation) {
        setCurrentConversation(result[0]);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  // Load messages for current conversation
  const loadMessages = useCallback(async () => {
    if (!currentConversation) return;
    
    try {
      const result = await trpc.getMessages.query({ 
        conversation_id: currentConversation.id 
      });
      setMessages(result);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [currentConversation]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewConversation = async () => {
    try {
      const newConversation = await trpc.createConversation.mutate({
        user_id: STUB_USER.id,
        title: `新对话 ${conversations.length + 1}`
      });
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentConversation || isSending) return;

    const userMessage: Message = {
      id: Date.now(), // Temporary ID for optimistic update
      conversation_id: currentConversation.id,
      role: 'user',
      content: inputMessage.trim(),
      ai_agent_type: null,
      created_at: new Date()
    };

    // Optimistic update
    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      // Send message and get AI response
      const aiResponse = await trpc.sendMessage.mutate({
        conversation_id: currentConversation.id,
        content: messageContent,
        ai_agent_type: selectedAgentType
      });

      // Replace optimistic message with server response and add AI response
      setMessages(prev => {
        const withoutOptimistic = prev.slice(0, -1);
        return [...withoutOptimistic, {
          ...userMessage,
          id: aiResponse.id - 1, // Assuming server creates user message before AI response
        }, aiResponse];
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic update on error
      setMessages(prev => prev.slice(0, -1));
      setInputMessage(messageContent); // Restore input
    } finally {
      setIsSending(false);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Conversations */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">🤖 AI 智能助手</h1>
            <Button 
              size="sm" 
              onClick={createNewConversation}
              className="bg-blue-600 hover:bg-blue-700"
            >
              ➕ 新对话
            </Button>
          </div>
          
          {/* Agent Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">选择AI助手类型:</label>
            <Select
              value={selectedAgentType}
              onValueChange={(value: AiAgentType) => setSelectedAgentType(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AGENT_CONFIGS).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span>{config.emoji}</span>
                      <span>{config.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8">加载中...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>暂无对话</p>
                <p className="text-sm">点击"新对话"开始聊天</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <Card 
                  key={conversation.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    currentConversation?.id === conversation.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => selectConversation(conversation)}
                >
                  <CardContent className="p-3">
                    <div className="font-medium text-sm truncate">
                      {conversation.title || '未命名对话'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTime(conversation.updated_at)}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-800">
                    {currentConversation.title || '对话'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={AGENT_CONFIGS[selectedAgentType].color}>
                      <span className="mr-1">{AGENT_CONFIGS[selectedAgentType].emoji}</span>
                      {AGENT_CONFIGS[selectedAgentType].label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-lg mb-2">开始与AI助手对话</p>
                    <p className="text-sm">
                      当前选择: {AGENT_CONFIGS[selectedAgentType].emoji} {AGENT_CONFIGS[selectedAgentType].label}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.role === 'assistant' && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            🤖
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white ml-auto'
                          : 'bg-white border shadow-sm'
                      }`}>
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                          {message.ai_agent_type && (
                            <span className="ml-2">
                              {AGENT_CONFIGS[message.ai_agent_type].emoji}
                            </span>
                          )}
                        </div>
                      </div>

                      {message.role === 'user' && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-gray-100 text-gray-600">
                            👤
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
                
                {isSending && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        🤖
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border shadow-sm px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        <span className="text-sm text-gray-500 ml-2">AI正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t p-4">
              <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                    placeholder={`向${AGENT_CONFIGS[selectedAgentType].label}发送消息...`}
                    className="flex-1"
                    disabled={isSending}
                  />
                  <Button 
                    type="submit" 
                    disabled={!inputMessage.trim() || isSending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSending ? '发送中...' : '发送 📤'}
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">选择一个对话开始聊天</p>
              <p className="text-sm">或者创建一个新对话</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
