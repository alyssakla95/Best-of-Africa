// ═══════════════════════════════════════════════════════════════════════════════
// TEST MOCKS - Cloudflare Workers Environment
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../../src/types';

/**
 * Creates a mock D1 Database for testing
 */
export function createMockD1Database(): D1Database {
    // Routes call statements both directly (prepare(sql).first()) and after
    // bind (prepare(sql).bind(x).first()) — the statement must support both.
    const statement = {
        bind: () => statement,
        first: () => Promise.resolve({ count: 1 }),
        all: () => Promise.resolve({ results: [], success: true }),
        run: () => Promise.resolve({ success: true, meta: {} }),
    };
    const mockDb = {
        prepare: () => statement,
        batch: () => Promise.resolve([]),
        exec: () => Promise.resolve({ success: true, meta: {} }),
    };
    return mockDb as unknown as D1Database;
}

/**
 * Creates a mock KV Namespace for testing
 */
export function createMockKVNamespace(): KVNamespace {
    const store = new Map<string, { value: string; expiration?: number }>();

    return {
        get: async (key: string, type?: string) => {
            const item = store.get(key);
            if (!item) return null;
            if (item.expiration && Date.now() > item.expiration) {
                store.delete(key);
                return null;
            }
            if (type === 'json') {
                try {
                    return JSON.parse(item.value);
                } catch {
                    return null;
                }
            }
            return item.value;
        },
        put: async (key: string, value: string, options?: { expirationTtl?: number }) => {
            const expiration = options?.expirationTtl 
                ? Date.now() + options.expirationTtl * 1000 
                : undefined;
            store.set(key, { value, expiration });
        },
        delete: async (key: string) => {
            store.delete(key);
        },
        list: async () => ({ keys: [], list_complete: true, cursor: '' }),
    } as unknown as KVNamespace;
}

/**
 * Creates a mock R2 Bucket for testing
 */
export function createMockR2Bucket(): R2Bucket {
    const store = new Map<string, ArrayBuffer>();

    return {
        get: async (key: string) => {
            const data = store.get(key);
            if (!data) return null;
            return {
                body: new ReadableStream(),
                bodyUsed: false,
                arrayBuffer: () => Promise.resolve(data),
                text: () => Promise.resolve(''),
                json: () => Promise.resolve({}),
                blob: () => Promise.resolve(new Blob()),
                writeHttpMetadata: () => {},
                httpEtag: '',
                httpMetadata: {},
                customMetadata: {},
                size: data.byteLength,
                etag: '',
                uploaded: new Date(),
                version: '',
            } as unknown as R2ObjectBody;
        },
        put: async (key: string, value: ArrayBuffer | string) => {
            const data = typeof value === 'string' 
                ? new TextEncoder().encode(value).buffer 
                : value;
            store.set(key, data);
            return {
                key,
                size: data.byteLength,
                etag: '',
                httpEtag: '',
                httpMetadata: {},
                customMetadata: {},
                version: '',
                uploaded: new Date(),
            } as R2Object;
        },
        delete: async (key: string) => {
            store.delete(key);
        },
        list: async () => ({ objects: [], truncated: false, cursor: '' }),
        head: async (key: string) => null,
        createMultipartUpload: async () => ({ key: '', uploadId: '' }),
        resumeMultipartUpload: async () => ({ key: '', uploadId: '' }),
    } as unknown as R2Bucket;
}

/**
 * Creates a mock AI service for testing
 */
export function createMockAI(): Ai {
    return {
        run: async (model: string, inputs: unknown) => {
            // Mock responses based on model type
            if (model.includes('llama') || model.includes('text')) {
                return {
                    response: 'Mock AI response for testing',
                    tool_calls: [],
                };
            }
            if (model.includes('bge') || model.includes('embed')) {
                return {
                    data: [new Array(768).fill(0.1)],
                    shape: [1, 768],
                };
            }
            if (model.includes('stable-diffusion') || model.includes('image')) {
                return new ArrayBuffer(100);
            }
            return {};
        },
        models: async () => [],
    } as unknown as Ai;
}

/**
 * Creates a mock Vectorize Index for testing
 */
export function createMockVectorize(): VectorizeIndex {
    return {
        query: async () => ({
            matches: [],
            count: 0,
        }),
        insert: async () => ({ ids: [], count: 0, mutationId: '' }),
        upsert: async () => ({ ids: [], count: 0, mutationId: '' }),
        deleteByIds: async () => ({ ids: [], count: 0, mutationId: '' }),
        describe: async () => ({
            name: 'test-index',
            dimensions: 768,
            metric: 'cosine',
            description: '',
            vectorsCount: 0,
        }),
    } as unknown as VectorizeIndex;
}

/**
 * Creates a mock Queue for testing
 */
export function createMockQueue<T>(): Queue<T> {
    const messages: T[] = [];
    return {
        send: async (message: T) => {
            messages.push(message);
            return { messageId: crypto.randomUUID() };
        },
        sendBatch: async (msgs: Iterable<MessageSendRequest<T>>) => {
            for (const msg of msgs) {
                messages.push(msg.body);
            }
            return { messageIds: messages.map(() => crypto.randomUUID()) };
        },
    } as unknown as Queue<T>;
}

/**
 * Creates a mock Analytics Engine dataset for testing
 */
export function createMockAnalytics(): AnalyticsEngineDataset {
    const events: unknown[] = [];
    return {
        writeDataPoint: (event: unknown) => {
            events.push(event);
        },
    } as unknown as AnalyticsEngineDataset;
}

/**
 * Creates a mock Durable Object namespace for testing
 */
export function createMockDurableObjectNamespace(): DurableObjectNamespace {
    return {
        idFromName: () => ({ toString: () => 'mock-id', equals: () => true } as DurableObjectId),
        idFromString: () => ({ toString: () => 'mock-id', equals: () => true } as DurableObjectId),
        get: () => ({
            fetch: () => Promise.resolve(new Response('{"count":0}')),
        } as unknown as DurableObjectStub),
        jurisdiction: () => ({} as DurableObjectNamespace),
        newUniqueId: () => ({ toString: () => 'mock-id', equals: () => true } as DurableObjectId),
    } as unknown as DurableObjectNamespace;
}

/**
 * Creates a complete mock environment for testing
 */
export function createMockEnv(overrides: Partial<Env> = {}): Env {
    return {
        DB: createMockD1Database(),
        CACHE: createMockKVNamespace(),
        RATE_LIMIT: createMockKVNamespace(),
        MEDIA: createMockR2Bucket(),
        AI: createMockAI(),
        VECTORS: createMockVectorize(),
        CONTENT_QUEUE: createMockQueue(),
        TRANSLATION_QUEUE: createMockQueue(),
        OPTIMIZATION_QUEUE: createMockQueue(),
        ANALYTICS: createMockAnalytics(),
        LIVE_COUNTER: createMockDurableObjectNamespace(),
        ENVIRONMENT: 'test',
        API_VERSION: '1.0.0-test',
        JWT_SECRET: 'test-secret',
        NEWS_API_KEY: 'test-api-key',
        ADMIN_API_KEY: 'test-admin-key',
        ...overrides,
    };
}
