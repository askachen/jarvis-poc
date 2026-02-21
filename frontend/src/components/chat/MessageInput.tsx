import React, { useState, useRef, KeyboardEvent } from 'react';
import { Paperclip, Send, X, Loader2 } from 'lucide-react';
import { useConversationsStore } from '../../stores/conversations';
import { useStream } from '../../hooks/useStream';
import { filesApi } from '../../api/files';
import { FileAttachment } from '../../api/conversations';
import toast from 'react-hot-toast';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

interface Props {
  conversationId: string;
}

export function MessageInput({ conversationId }: Props) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const { isStreaming } = useConversationsStore();
  const { sendMessage } = useStream();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const disabled = isStreaming || uploading;

  const handleSend = async () => {
    if (disabled) return;
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;

    const files = [...attachments];
    setContent('');
    setAttachments([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(conversationId, trimmed, files);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  };

  const handleFileClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Reset input
    e.target.value = '';

    const file = files[0];

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be under 20MB');
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(`File type not supported: ${file.type}`);
      return;
    }

    setUploading(true);
    try {
      const attachment = await filesApi.upload(file);
      if (attachment.parseError) {
        toast('File uploaded but text extraction failed. You can still send it.', {
          icon: '⚠️',
        });
      }
      setAttachments((prev) => [...prev, attachment]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs
                bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300
                border border-indigo-200 dark:border-indigo-700"
            >
              <Paperclip size={11} />
              <span className="truncate max-w-[150px]">{att.name}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="ml-0.5 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File upload button */}
        <button
          onClick={handleFileClick}
          disabled={disabled}
          className={`p-2 rounded-lg transition-colors flex-shrink-0 mb-0.5
            ${disabled
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          title="Attach file"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Paperclip size={20} />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={isStreaming ? 'Waiting for response...' : 'Type a message... (Enter to send, Shift+Enter for newline)'}
          rows={1}
          className={`flex-1 resize-none px-4 py-2.5 rounded-xl text-sm
            bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500
            focus:outline-none focus:bg-white dark:focus:bg-gray-750 transition-colors
            min-h-[44px] max-h-[200px] leading-relaxed
            ${disabled ? 'cursor-not-allowed opacity-70' : ''}
          `}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || (!content.trim() && attachments.length === 0)}
          className={`p-2.5 rounded-xl transition-colors flex-shrink-0 mb-0.5
            ${
              disabled || (!content.trim() && attachments.length === 0)
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }
          `}
        >
          {isStreaming ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
