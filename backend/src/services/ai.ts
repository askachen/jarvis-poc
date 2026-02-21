import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';
const MAX_CONTEXT_MESSAGES = 20;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChatOptions {
  tools?: Anthropic.Tool[];
  onToolCall?: (toolName: string, toolInput: Record<string, unknown>) => Promise<string>;
  system?: string;
}

export async function streamChat(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  onDone: (fullContent: string) => Promise<void>,
  onError: (error: Error) => Promise<void>,
  options: StreamChatOptions = {}
): Promise<void> {
  const contextMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
  const { tools, onToolCall, system } = options;
  const hasTools = tools && tools.length > 0 && onToolCall;
  let fullContent = '';

  try {
    if (!hasTools) {
      // Original streaming path — unchanged
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 4096,
        ...(system && { system }),
        messages: contextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          fullContent += chunk.delta.text;
          onDelta(chunk.delta.text);
        }
      }

      await onDone(fullContent);
      return;
    }

    // Agentic loop path
    type ApiMsg = Anthropic.MessageParam;
    const apiMessages: ApiMsg[] = contextMessages.map((m) => ({ role: m.role, content: m.content }));

    for (let i = 0; i < 10; i++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        ...(system && { system }),
        tools,
        messages: apiMessages,
      });

      // Stream text blocks to client immediately
      for (const block of response.content) {
        if (block.type === 'text' && block.text) {
          fullContent += block.text;
          onDelta(block.text);
        }
      }

      if (response.stop_reason !== 'tool_use') break;

      // Append full assistant turn (text + tool_use blocks)
      apiMessages.push({ role: 'assistant', content: response.content });

      // Execute tool calls
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      );

      type ToolResult = Anthropic.ToolResultBlockParam;
      const toolResults: ToolResult[] = [];
      for (const tu of toolUseBlocks) {
        let result: string;
        try {
          result = await onToolCall(tu.name, tu.input as Record<string, unknown>);
        } catch (e) {
          result = `Error: ${(e as Error).message}`;
        }
        toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: result });
      }

      // Append tool results as user turn (Anthropic API convention)
      apiMessages.push({ role: 'user', content: toolResults });
    }

    await onDone(fullContent);
  } catch (error) {
    await onError(error as Error);
  }
}

export async function runTaskPrompt(prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  throw new Error('Unexpected response type from AI');
}

export async function generateTitle(firstUserMessage: string): Promise<string> {
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 60,
      messages: [
        {
          role: 'user',
          content: `Generate a concise title (5 words or less) for a conversation that starts with this message. Reply with only the title, no quotes or punctuation:\n\n${firstUserMessage.slice(0, 500)}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim().slice(0, 100);
    }
    return 'New Conversation';
  } catch {
    return 'New Conversation';
  }
}
