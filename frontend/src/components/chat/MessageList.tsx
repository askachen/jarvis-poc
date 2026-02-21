import React, { useEffect, useRef } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Loader2, Paperclip, Wrench } from 'lucide-react';
import { Message } from '../../api/conversations';
import { useConversationsStore } from '../../stores/conversations';

interface Props {
  conversationId: string;
}

export function MessageList({ conversationId }: Props) {
  const { messages, isStreaming, toolStatus, messageToolCalls } = useConversationsStore();
  const msgs = messages[conversationId] || [];
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  if (msgs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Hello! I'm Jarvis
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
            Ask me anything, upload a file, or start a conversation.
          </p>
        </div>
      </div>
    );
  }

  const isLastMessage = (index: number) => index === msgs.length - 1;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {msgs.map((msg, index) => {
        const isLast = isLastMessage(index);
        return (
          <React.Fragment key={msg.id}>
            {isStreaming && isLast && msg.role === 'assistant' && toolStatus && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pl-11 -mb-2">
                <Loader2 size={12} className="animate-spin text-indigo-500" />
                <span>{toolStatus}</span>
              </div>
            )}
            <MessageBubble
              message={msg}
              isStreaming={isStreaming && isLast && msg.role === 'assistant'}
              toolCalls={messageToolCalls[msg.id]}
            />
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    if (match) {
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
          className="rounded-lg text-xs"
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }
    return (
      <code
        className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        {children}
      </a>
    );
  },
};

function MessageBubble({
  message,
  isStreaming,
  toolCalls,
}: {
  message: Message;
  isStreaming: boolean;
  toolCalls?: string[];
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
          <span className="text-white text-xs font-bold">J</span>
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? '' : 'flex-1'}`}>
        {/* Tool call badges */}
        {!isUser && toolCalls && toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {toolCalls.map((call, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs
                  bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
              >
                <Wrench size={9} />
                {call}
              </span>
            ))}
          </div>
        )}

        {/* File attachments */}
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {message.files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs
                  bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                <Paperclip size={11} />
                <span className="truncate max-w-[120px]">{file.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className={`markdown-body ${isStreaming ? 'streaming-cursor' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content || ' '}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
