// ═══════════════════════════════════════════════════════════════════════════════
// LIVE COUNTER DURABLE OBJECT
// Real-time counters for live dashboard metrics with WebSocket support
// ═══════════════════════════════════════════════════════════════════════════════

interface LiveMessage {
    type: 'visitor_count' | 'threat_level' | 'system_status' | 'ping';
    count?: number;
    level?: string;
    status?: string;
    timestamp?: string;
}

export class LiveCounter {
    private state: DurableObjectState;
    private count: number = 0;
    private lastReset: number = Date.now();
    private connections: Set<WebSocket> = new Set();
    private threatLevel: string = 'LOW';

    constructor(state: DurableObjectState) {
        this.state = state;

        // Load persisted count
        this.state.blockConcurrencyWhile(async () => {
            const stored = await this.state.storage.get<{ count: number; lastReset: number; threatLevel?: string }>('data');
            if (stored) {
                this.count = stored.count;
                this.lastReset = stored.lastReset;
                this.threatLevel = stored.threatLevel || 'LOW';
            }

            // Reset daily
            const now = Date.now();
            const dayMs = 24 * 60 * 60 * 1000;
            if (now - this.lastReset > dayMs) {
                this.count = 0;
                this.lastReset = now;
                await this.persist();
            }
        });
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        // Handle WebSocket upgrade
        if (request.headers.get('Upgrade') === 'websocket') {
            return this.handleWebSocket(request);
        }

        switch (url.pathname) {
            case '/increment':
                this.count++;
                await this.persist();
                await this.broadcast({ type: 'visitor_count', count: this.count });
                return new Response(JSON.stringify({ count: this.count }), {
                    headers: { 'Content-Type': 'application/json' },
                });

            case '/get':
                return new Response(JSON.stringify({
                    count: this.count,
                    threat_level: this.threatLevel,
                    connections: this.connections.size,
                    last_reset: new Date(this.lastReset).toISOString(),
                }), {
                    headers: { 'Content-Type': 'application/json' },
                });

            case '/reset':
                this.count = 0;
                this.lastReset = Date.now();
                await this.persist();
                await this.broadcast({ type: 'visitor_count', count: 0 });
                return new Response(JSON.stringify({ count: 0 }), {
                    headers: { 'Content-Type': 'application/json' },
                });

            case '/threat':
                const level = url.searchParams.get('level') || 'LOW';
                this.threatLevel = level.toUpperCase();
                await this.persist();
                await this.broadcast({ type: 'threat_level', level: this.threatLevel });
                return new Response(JSON.stringify({ threat_level: this.threatLevel }), {
                    headers: { 'Content-Type': 'application/json' },
                });

            case '/stream':
                // WebSocket upgrade request without upgrade header - show help
                return new Response(JSON.stringify({
                    message: 'WebSocket endpoint. Connect with ws:// protocol.',
                    connected_clients: this.connections.size
                }), {
                    headers: { 'Content-Type': 'application/json' },
                });

            default:
                return new Response('Not found', { status: 404 });
        }
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // WebSocket Handler
    // ───────────────────────────────────────────────────────────────────────────────
    private handleWebSocket(_request: Request): Response {
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        // Accept the WebSocket connection
        server.accept();
        this.connections.add(server);

        // Send initial state
        const initialMessage: LiveMessage = {
            type: 'visitor_count',
            count: this.count,
            timestamp: new Date().toISOString()
        };
        server.send(JSON.stringify(initialMessage));

        // Send threat level
        const threatMessage: LiveMessage = {
            type: 'threat_level',
            level: this.threatLevel,
            timestamp: new Date().toISOString()
        };
        server.send(JSON.stringify(threatMessage));

        // Send system status
        const statusMessage: LiveMessage = {
            type: 'system_status',
            status: 'OPERATIONAL',
            timestamp: new Date().toISOString()
        };
        server.send(JSON.stringify(statusMessage));

        // Handle incoming messages
        server.addEventListener('message', async (event) => {
            try {
                const data = JSON.parse(event.data as string);

                if (data.type === 'ping') {
                    server.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
                } else if (data.type === 'increment') {
                    this.count++;
                    await this.persist();
                    await this.broadcast({ type: 'visitor_count', count: this.count });
                }
            } catch (_e) {
                // Ignore parse errors
            }
        });

        // Handle disconnect
        server.addEventListener('close', () => {
            this.connections.delete(server);
        });

        server.addEventListener('error', () => {
            this.connections.delete(server);
        });

        return new Response(null, {
            status: 101,
            webSocket: client
        });
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // Broadcast to all connected clients
    // ───────────────────────────────────────────────────────────────────────────────
    private async broadcast(message: LiveMessage): Promise<void> {
        const payload = JSON.stringify({
            ...message,
            timestamp: new Date().toISOString()
        });

        const dead: WebSocket[] = [];

        for (const ws of this.connections) {
            try {
                ws.send(payload);
            } catch (_e) {
                dead.push(ws);
            }
        }

        // Clean up dead connections
        for (const ws of dead) {
            this.connections.delete(ws);
        }
    }

    private async persist(): Promise<void> {
        await this.state.storage.put('data', {
            count: this.count,
            lastReset: this.lastReset,
            threatLevel: this.threatLevel,
        });
    }
}
