import { create } from 'zustand';
import { Conversation, Message } from '../api/conversations';

interface ConversationsState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  isStreaming: boolean;
  toolStatus: string | null;
  setToolStatus: (status: string | null) => void;

  activeContext: { skills: string[]; mcps: string[] } | null;
  messageToolCalls: Record<string, string[]>;
  pendingToolCalls: string[];
  setActiveContext: (ctx: { skills: string[]; mcps: string[] } | null) => void;
  addPendingToolCall: (call: string) => void;
  commitToolCallsToMessage: (msgId: string) => void;
  clearPendingToolCalls: () => void;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;

  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  appendToLastMessage: (conversationId: string, content: string) => void;
  updateLastMessageId: (conversationId: string, id: string) => void;

  setStreaming: (streaming: boolean) => void;
}

export const useConversationsStore = create<ConversationsState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isStreaming: false,
  toolStatus: null,
  activeContext: null,
  messageToolCalls: {},
  pendingToolCalls: [],

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([k]) => k !== id)
      ),
    })),

  setActiveConversation: (id) => set({ activeConversationId: id, activeContext: null, pendingToolCalls: [] }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    })),

  appendToLastMessage: (conversationId, content) =>
    set((state) => {
      const msgs = state.messages[conversationId] || [];
      if (msgs.length === 0) return state;
      const last = msgs[msgs.length - 1];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [
            ...msgs.slice(0, -1),
            { ...last, content: last.content + content },
          ],
        },
      };
    }),

  updateLastMessageId: (conversationId, id) =>
    set((state) => {
      const msgs = state.messages[conversationId] || [];
      if (msgs.length === 0) return state;
      const last = msgs[msgs.length - 1];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...msgs.slice(0, -1), { ...last, id }],
        },
      };
    }),

  setStreaming: (isStreaming) => set({ isStreaming }),
  setToolStatus: (toolStatus) => set({ toolStatus }),

  setActiveContext: (activeContext) => set({ activeContext }),
  addPendingToolCall: (call) =>
    set((state) => ({ pendingToolCalls: [...state.pendingToolCalls, call] })),
  commitToolCallsToMessage: (msgId) =>
    set((state) => ({
      messageToolCalls: { ...state.messageToolCalls, [msgId]: state.pendingToolCalls },
      pendingToolCalls: [],
    })),
  clearPendingToolCalls: () => set({ pendingToolCalls: [] }),
}));
