import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { streamChat, generateTitle, ChatMessage } from '../services/ai';
import { startMcpSession, callMcpTool, stopMcpSession, McpSession } from '../services/mcp';

const router = Router();
const prisma = new PrismaClient();

// POST /api/conversations/:id/messages
router.post('/:id/messages', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: conversationId } = req.params;
  const { content, files } = req.body;

  if (!content?.trim() && (!files || files.length === 0)) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Message content is required',
      statusCode: 400,
    });
  }

  // Verify conversation ownership
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Conversation not found',
      statusCode: 404,
    });
  }

  if (conversation.userId !== req.user!.id) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Access denied',
      statusCode: 403,
    });
  }

  // Build user message content (include extracted text from files)
  let userContent = content || '';
  if (files && files.length > 0) {
    const fileTexts = files
      .filter((f: any) => f.extractedText)
      .map((f: any) => `\n\n[File: ${f.name}]\n${f.extractedText}`)
      .join('');
    if (fileTexts) {
      userContent += fileTexts;
    }
  }

  // Save user message
  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      role: 'user',
      content: content || '',
      files: files || null,
    },
  });

  // Fetch conversation history for context
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  const chatMessages: ChatMessage[] = history.map((m) => {
    // For the current user message, include file content
    if (m.id === userMessage.id && userContent !== content) {
      return { role: m.role as 'user' | 'assistant', content: userContent };
    }
    return { role: m.role as 'user' | 'assistant', content: m.content };
  });

  // ── Skills → system prompt ───────────────────────────────────────────────
  const enabledSkills = await prisma.skill.findMany({
    where: {
      enabled: true,
      OR: [{ isSystem: true }, { ownerId: req.user!.id }],
    },
    select: { name: true, skillContent: true },
  });
  const systemPrompt = enabledSkills
    .map((s) => s.skillContent)
    .filter(Boolean)
    .join('\n\n---\n\n') || undefined;

  // ── MCP sessions ─────────────────────────────────────────────────────────
  const mcpRecords = await prisma.mcpServer.findMany({
    where: { OR: [{ isSystem: true }, { ownerId: req.user!.id }] },
  });

  const sessions: McpSession[] = [];
  if (mcpRecords.length > 0) {
    const results = await Promise.allSettled(
      mcpRecords.map((srv) =>
        startMcpSession(srv.id, srv.name, {
          command: srv.command,
          args: (srv.args as string[]) ?? [],
          env: (srv.env as Record<string, string>) ?? {},
        })
      )
    );
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') sessions.push(r.value);
      else console.warn(`[MCP] "${mcpRecords[i].name}" failed: ${(r as PromiseRejectedResult).reason?.message}`);
    });
  }

  // Build Anthropic tool definitions; sanitize names to [a-zA-Z0-9_-]
  const anthropicTools: Anthropic.Tool[] = [];
  const toolSessionMap = new Map<string, { session: McpSession; realName: string }>();
  for (const session of sessions) {
    for (const tool of session.tools) {
      const prefix = session.serverName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const suffix = tool.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const qualName = `${prefix}__${suffix}`.slice(0, 64);
      anthropicTools.push({
        name: qualName,
        description: tool.description ?? '',
        input_schema: tool.inputSchema as Anthropic.Tool['input_schema'],
      });
      toolSessionMap.set(qualName, { session, realName: tool.name });
    }
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Inform client of saved user message id
  sendEvent({ type: 'user_message', id: userMessage.id });

  // Inform client of active context (skills + MCP servers)
  const activeSkillNames = enabledSkills.filter((s) => s.skillContent).map((s) => s.name);
  const activeMcpNames = sessions.map((s) => s.serverName);
  if (activeSkillNames.length > 0 || activeMcpNames.length > 0) {
    sendEvent({ type: 'context_info', skills: activeSkillNames, mcps: activeMcpNames });
  }

  try {
    await streamChat(
      chatMessages,
      (delta) => {
        sendEvent({ type: 'delta', content: delta });
      },
      async (fullContent) => {
        // Save assistant message
        const assistantMessage = await prisma.message.create({
          data: {
            conversationId,
            role: 'assistant',
            content: fullContent,
          },
        });

        // Update conversation updatedAt
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        sendEvent({ type: 'done', id: assistantMessage.id });
        res.end();

        // Auto-generate title for first message (fire-and-forget background task)
        if (conversation.title === 'New Conversation' && history.length <= 1) {
          generateTitle(content || '').then(async (title) => {
            if (title && title !== 'New Conversation') {
              await prisma.conversation.update({
                where: { id: conversationId },
                data: { title },
              });
            }
          }).catch(console.error);
        }
      },
      async (error) => {
        console.error('Stream error:', error);
        sendEvent({ type: 'error', message: 'Stream interrupted, please retry' });
        res.end();
      },
      {
        ...(systemPrompt && { system: systemPrompt }),
        ...(anthropicTools.length > 0 && {
          tools: anthropicTools,
          onToolCall: async (qualName, toolInput) => {
              const entry = toolSessionMap.get(qualName);
              if (!entry) throw new Error(`No session for tool "${qualName}"`);

              sendEvent({ type: 'tool_status', serverName: entry.session.serverName, toolName: entry.realName, status: 'calling' });
              const raw = await callMcpTool(entry.session, entry.realName, toolInput);
              sendEvent({ type: 'tool_status', serverName: entry.session.serverName, toolName: entry.realName, status: 'done' });

              // Normalize MCP result: raw string OR { content: [{ type:'text', text }] }
              if (typeof raw === 'string') return raw;
              const r = raw as any;
              if (Array.isArray(r?.content) && r.content[0]?.text) return r.content[0].text;
              return JSON.stringify(raw);
            },
          }),
      }
    );
  } finally {
    sessions.forEach(stopMcpSession);
  }
});

export { router as messagesRouter };
