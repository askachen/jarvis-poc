import { useCallback, useEffect } from 'react';
import { conversationsApi } from '../api/conversations';
import { useConversationsStore } from '../stores/conversations';
import toast from 'react-hot-toast';

export function useConversations() {
  const {
    conversations,
    activeConversationId,
    messages,
    setConversations,
    addConversation,
    removeConversation,
    setActiveConversation,
    setMessages,
  } = useConversationsStore();

  const loadConversations = useCallback(async () => {
    try {
      const data = await conversationsApi.list();
      setConversations(data.data);
    } catch {
      toast.error('Failed to load conversations');
    }
  }, [setConversations]);

  const createConversation = useCallback(async () => {
    try {
      const conv = await conversationsApi.create();
      addConversation(conv);
      setActiveConversation(conv.id);
      return conv;
    } catch {
      toast.error('Failed to create conversation');
      return null;
    }
  }, [addConversation, setActiveConversation]);

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await conversationsApi.delete(id);
        removeConversation(id);
      } catch {
        toast.error('Failed to delete conversation');
      }
    },
    [removeConversation]
  );

  const switchConversation = useCallback(
    async (id: string) => {
      setActiveConversation(id);
      if (!messages[id]) {
        try {
          const msgs = await conversationsApi.getMessages(id);
          setMessages(id, msgs);
        } catch {
          toast.error('Failed to load messages');
        }
      }
    },
    [setActiveConversation, messages, setMessages]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    activeConversationId,
    messages,
    loadConversations,
    createConversation,
    deleteConversation,
    switchConversation,
  };
}
