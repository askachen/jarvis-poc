import { spawn } from 'child_process';

interface McpServerConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface McpTool {
  name: string;
  description?: string;
}

export interface McpTestResult {
  success: boolean;
  tools?: McpTool[];
  error?: string;
}

export function testMcpConnection(server: McpServerConfig): Promise<McpTestResult> {
  return new Promise((resolve) => {
    let resolved = false;

    const safeResolve = (result: McpTestResult) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        try {
          child.kill();
        } catch {}
        resolve(result);
      }
    };

    const child = spawn(server.command, server.args, {
      env: { ...process.env, ...server.env },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    const timer = setTimeout(() => {
      safeResolve({ success: false, error: 'Connection timed out after 5 seconds' });
    }, 5000);

    let buffer = '';
    let initSent = false;

    child.stdout.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const msg = JSON.parse(trimmed);

          if (msg.id === 1 && !msg.error) {
            // Got initialize response, send tools/list
            const toolsListReq = JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/list',
              params: {},
            }) + '\n';
            child.stdin.write(toolsListReq);
          } else if (msg.id === 2) {
            if (msg.error) {
              safeResolve({ success: false, error: msg.error.message || 'tools/list failed' });
            } else {
              const tools: McpTool[] = (msg.result?.tools ?? []).map((t: any) => ({
                name: t.name,
                description: t.description,
              }));
              safeResolve({ success: true, tools });
            }
          }
        } catch {
          // Not JSON, skip
        }
      }
    });

    child.stderr.on('data', (_data: Buffer) => {
      // Ignore stderr output — MCP servers often log startup info there
    });

    child.on('error', (err) => {
      safeResolve({ success: false, error: err.message });
    });

    child.on('close', (code) => {
      if (!resolved) {
        safeResolve({ success: false, error: `Process exited with code ${code}` });
      }
    });

    // Send initialize request after process starts
    child.stdin.on('error', () => {});
    setTimeout(() => {
      if (!initSent && !resolved) {
        initSent = true;
        const initReq = JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'jarvis', version: '1.0.0' },
          },
        }) + '\n';
        try {
          child.stdin.write(initReq);
        } catch (err) {
          safeResolve({ success: false, error: 'Failed to write to process stdin' });
        }
      }
    }, 100);
  });
}

// ── Session types ────────────────────────────────────────────────────────────

export interface McpToolFull {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface McpSession {
  serverId: string;
  serverName: string;
  child: ReturnType<typeof spawn>;
  tools: McpToolFull[];
  pendingCalls: Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>;
  nextId: number; // starts at 3; 1+2 used in startup handshake
}

// ── startMcpSession ──────────────────────────────────────────────────────────

export function startMcpSession(
  serverId: string,
  serverName: string,
  server: { command: string; args: string[]; env: Record<string, string> }
): Promise<McpSession> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const safeReject = (err: Error) => {
      if (!settled) {
        settled = true;
        clearTimeout(startupTimer);
        try { child.kill(); } catch {}
        reject(err);
      }
    };

    const startupTimer = setTimeout(
      () => safeReject(new Error(`MCP "${serverName}" startup timeout`)),
      10_000
    );

    const child = spawn(server.command, server.args, {
      env: { ...process.env, ...server.env },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    const session: McpSession = {
      serverId, serverName, child, tools: [],
      pendingCalls: new Map(), nextId: 3,
    };
    let buffer = '';

    child.stdout.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        let msg: any;
        try { msg = JSON.parse(line); } catch { continue; }

        if (!settled) {
          // Startup handshake phase
          if (msg.id === 1 && !msg.error) {
            // MCP spec: send notifications/initialized before any other requests
            child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
            child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n');
          } else if (msg.id === 2) {
            clearTimeout(startupTimer);
            settled = true;
            if (msg.error) {
              try { child.kill(); } catch {}
              reject(new Error(`tools/list failed for "${serverName}": ${msg.error.message}`));
              return;
            }
            session.tools = (msg.result?.tools ?? []).map((t: any) => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema ?? { type: 'object', properties: {} },
            }));
            resolve(session);
          }
        } else {
          // Post-startup: route by id to pending call
          if (msg.id != null) {
            const pending = session.pendingCalls.get(msg.id);
            if (pending) {
              session.pendingCalls.delete(msg.id);
              msg.error
                ? pending.reject(new Error(msg.error.message ?? 'MCP error'))
                : pending.resolve(msg.result);
            }
          }
        }
      }
    });

    child.stderr.on('data', () => {});
    child.on('error', (err) => { if (!settled) safeReject(err); });
    child.on('close', (code) => {
      if (!settled) safeReject(new Error(`"${serverName}" exited (code ${code}) before init`));
      for (const [, p] of session.pendingCalls) p.reject(new Error(`MCP "${serverName}" closed`));
      session.pendingCalls.clear();
    });
    child.stdin.on('error', () => {});

    setTimeout(() => {
      if (!settled) {
        try {
          child.stdin.write(JSON.stringify({
            jsonrpc: '2.0', id: 1, method: 'initialize',
            params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'jarvis', version: '1.0.0' } },
          }) + '\n');
        } catch { safeReject(new Error(`Failed to write initialize to "${serverName}"`)); }
      }
    }, 100);
  });
}

// ── callMcpTool ──────────────────────────────────────────────────────────────

export function callMcpTool(
  session: McpSession,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = session.nextId++;
    const timer = setTimeout(() => {
      session.pendingCalls.delete(id);
      reject(new Error(`Tool "${toolName}" timed out after 30s`));
    }, 30_000);
    session.pendingCalls.set(id, {
      resolve: (v) => { clearTimeout(timer); resolve(v); },
      reject: (e) => { clearTimeout(timer); reject(e); },
    });
    try {
      if (!session.child.stdin) throw new Error('MCP process stdin is not available');
      session.child.stdin.write(
        JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: toolName, arguments: toolInput } }) + '\n'
      );
    } catch (err) {
      session.pendingCalls.delete(id);
      clearTimeout(timer);
      reject(err);
    }
  });
}

// ── stopMcpSession ───────────────────────────────────────────────────────────

export function stopMcpSession(session: McpSession): void {
  try { session.child.kill(); } catch {}
}
