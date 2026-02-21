import { useCallback } from 'react';
import { useConversationsStore } from '../stores/conversations';
import { Message, FileAttachment } from '../api/conversations';
import toast from 'react-hot-toast';

export function useStream() {
  const {
    addMessage, appendToLastMessage, updateLastMessageId,
    setStreaming, updateConversation, setToolStatus,
    setActiveContext, addPendingToolCall, commitToolCallsToMessage, clearPendingToolCalls,
  } = useConversationsStore();

  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      files: FileAttachment[]
    ) => {
      const token = localStorage.getItem('token');
      if (!token) return;

      setStreaming(true);

      // Optimistic user message
      const tempUserMsg: Message = {
        id: `temp-user-${Date.now()}`,
        conversationId,
        role: 'user',
        content,
        files: files.length > 0 ? files : null,
        createdAt: new Date().toISOString(),
      };
      addMessage(conversationId, tempUserMsg);

      // Placeholder assistant message for streaming
      const tempAssistantId = `temp-assistant-${Date.now()}`;
      const tempAssistantMsg: Message = {
        id: tempAssistantId,
        conversationId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
      };
      addMessage(conversationId, tempAssistantMsg);

      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content, files }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to send message');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No response body');

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const event = JSON.parse(raw);

              if (event.type === 'context_info') {
                setActiveContext({ skills: event.skills ?? [], mcps: event.mcps ?? [] });
              } else if (event.type === 'delta') {
                appendToLastMessage(conversationId, event.content);
              } else if (event.type === 'done') {
                commitToolCallsToMessage(event.id);
                updateLastMessageId(conversationId, event.id);
                // Refresh conversation to get updated title
                setTimeout(() => {
                  fetch(`/api/conversations`, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                    .then((r) => r.json())
                    .then((data) => {
                      const conv = data.data?.find((c: any) => c.id === conversationId);
                      if (conv) {
                        updateConversation(conversationId, { title: conv.title });
                      }
                    })
                    .catch(() => {});
                }, 1000);
              } else if (event.type === 'tool_status') {
                if (event.status === 'calling') {
                  addPendingToolCall(`${event.serverName}: ${event.toolName}`);
                }
                setToolStatus(event.status === 'calling'
                  ? `Calling ${event.serverName}: ${event.toolName}…`
                  : null);
              } else if (event.type === 'error') {
                toast.error(event.message || 'Response interrupted, please retry');
              }
            } catch {
              // Malformed event, skip
            }
          }
        }
      } catch (error) {
        const msg = (error as Error).message;
        toast.error(msg.includes('interrupted') ? msg : `Failed to send message: ${msg}`);
        // Remove temp assistant message on error
        appendToLastMessage(conversationId, '\n\n[Error sending message]');
      } finally {
        setStreaming(false);
        setToolStatus(null);
        clearPendingToolCalls();
      }
    },
    [addMessage, appendToLastMessage, updateLastMessageId, setStreaming, updateConversation,
     setToolStatus, setActiveContext, addPendingToolCall, commitToolCallsToMessage, clearPendingToolCalls]
  );

  return { sendMessage };
}
