import React from 'react';
import { BookOpen, Plug } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { useConversationsStore } from '../stores/conversations';

export function ChatPage() {
  const { activeConversationId, activeContext } = useConversationsStore();
  const hasContext = activeContext && (activeContext.skills.length > 0 || activeContext.mcps.length > 0);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        {/* Active context strip */}
        {hasContext && (
          <div className="flex items-center gap-3 px-4 py-1.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 text-xs flex-wrap">
            {activeContext!.skills.map((name) => (
              <span key={name} className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                <BookOpen size={11} />
                {name}
              </span>
            ))}
            {activeContext!.mcps.map((name) => (
              <span key={name} className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <Plug size={11} />
                {name}
              </span>
            ))}
          </div>
        )}

        {activeConversationId ? (
          <>
            <MessageList conversationId={activeConversationId} />
            <MessageInput conversationId={activeConversationId} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600
          flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-white font-bold text-4xl">J</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Hello! I'm Jarvis
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
          Your AI-powered assistant. Create a new conversation to get started, or select
          an existing one from the sidebar.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 dark:text-gray-500">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-left">
            <span className="text-lg block mb-1">📄</span>
            Upload PDFs, Word docs, spreadsheets
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-left">
            <span className="text-lg block mb-1">⚡</span>
            Real-time streaming responses
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-left">
            <span className="text-lg block mb-1">💡</span>
            Markdown &amp; code highlighting
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-left">
            <span className="text-lg block mb-1">🌙</span>
            Dark / Light theme
          </div>
        </div>
      </div>
    </div>
  );
}
