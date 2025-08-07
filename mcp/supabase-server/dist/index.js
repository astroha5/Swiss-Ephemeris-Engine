import 'dotenv/config';
import supabasePkg from '@supabase/supabase-js';
const { createClient } = supabasePkg;
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase configuration. Ensure SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) are set.');
}
// Create supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Define Zod schemas for tools
const SelectArgs = z.object({
    table: z.string().min(1).describe('Table name to select from'),
    columns: z.string().default('*').describe('Comma-separated columns to select, default "*"'),
    match: z.record(z.any()).optional().describe('Optional exact match filters: { column: value }'),
    eq: z.record(z.any()).optional().describe('Optional equality filters, same as match'),
    limit: z.number().int().positive().optional().describe('Optional row limit'),
    order: z
        .object({
        column: z.string(),
        ascending: z.boolean().default(true),
    })
        .optional()
        .describe('Optional ordering'),
});
const InsertArgs = z.object({
    table: z.string().min(1).describe('Table name to insert into'),
    rows: z.array(z.record(z.any())).min(1).describe('Array of rows (objects) to insert'),
    upsert: z.boolean().optional().describe('If true, perform upsert'),
});
const RpcArgs = z.object({
    fn: z.string().min(1).describe('Postgres function name'),
    args: z.record(z.any()).default({}).describe('Function arguments object'),
});
// Tool implementations
const selectTool = {
    name: 'supabase_select',
    description: 'Query rows from a Supabase table with optional filters, ordering and limit.',
    inputSchema: zodToJsonSchema(SelectArgs, 'SelectArgs'),
    async call({ input }) {
        const parsed = SelectArgs.parse(input);
        let q = supabase.from(parsed.table).select(parsed.columns);
        const filters = { ...(parsed.match ?? {}), ...(parsed.eq ?? {}) };
        for (const [col, val] of Object.entries(filters)) {
            // basic eq filter; more operators can be added as needed
            // Using any cast to satisfy generic constraint differences across SDK versions
            q = q.eq(col, val);
        }
        if (parsed.order) {
            q = q.order(parsed.order.column, { ascending: parsed.order.ascending });
        }
        if (parsed.limit) {
            q = q.limit(parsed.limit);
        }
        const { data, error } = await q;
        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
        return {
            content: [{ type: 'json', json: data ?? [] }],
        };
    },
};
const insertTool = {
    name: 'supabase_insert',
    description: 'Insert one or more rows into a Supabase table. Supports optional upsert.',
    inputSchema: zodToJsonSchema(InsertArgs, 'InsertArgs'),
    async call({ input }) {
        const parsed = InsertArgs.parse(input);
        const insertBuilder = supabase.from(parsed.table).insert(parsed.rows);
        const { data, error } = parsed.upsert
            ? await supabase.from(parsed.table).upsert(parsed.rows).select()
            : await insertBuilder.select();
        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
        return {
            content: [{ type: 'json', json: data ?? [] }],
        };
    },
};
const rpcTool = {
    name: 'supabase_rpc',
    description: 'Invoke a Postgres function via Supabase RPC.',
    inputSchema: zodToJsonSchema(RpcArgs, 'RpcArgs'),
    async call({ input }) {
        const parsed = RpcArgs.parse(input);
        const { data, error } = await supabase.rpc(parsed.fn, parsed.args);
        if (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
        return {
            content: [{ type: 'json', json: data }],
        };
    },
};
// Start MCP server
async function main() {
    const server = new Server({
        name: 'astrova-supabase-mcp',
        version: '0.1.0',
        description: 'Supabase MCP server exposing select/insert/rpc tools for Astrova.',
        tools: [selectTool, insertTool, rpcTool],
    });
    // Use explicit stdio transport for compatibility with latest SDK
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Keep process alive when hosted directly
    if (process.stdin.isTTY === false) {
        process.stdin.resume();
    }
}
main().catch((err) => {
    console.error('Failed to start Supabase MCP server:', err);
    process.exit(1);
});
