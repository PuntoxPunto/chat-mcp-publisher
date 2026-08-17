// Reference template: adapt rather than copying blindly.
// This shows the known-good AppDeploy ChatGPT transport structure.

import { router, error } from '@appdeploy/sdk';

type Rpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const SERVER_INFO = { name: 'REPLACE_SERVER_NAME', version: '0.1.0' };
const MODERN_VERSION = '2026-07-28';

const LEGACY_VERSIONS = new Set([
  '2025-11-25',
  '2025-06-18',
  '2025-03-26'
]);

const MODERN_METHODS = new Set([
  'server/discover',
  'ping',
  'tools/list',
  'resources/list',
  'resources/read',
  'tools/call'
]);

const NOAUTH = [{ type: 'noauth' }];

const INSTRUCTIONS =
  'REPLACE_WITH_MODEL_INSTRUCTIONS';

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' }
  },
  required: ['ok'],
  additionalProperties: false
};

const tools = [
  {
    name: 'REPLACE_TOOL_NAME',
    title: 'REPLACE_TOOL_TITLE',
    description: 'Use this when the user explicitly asks to ...',
    inputSchema: {
      type: 'object',
      properties: {
        request: { type: 'string' }
      },
      required: ['request'],
      additionalProperties: false
    },
    outputSchema: OUTPUT_SCHEMA,
    securitySchemes: NOAUTH,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
      idempotentHint: true
    },
    _meta: {
      securitySchemes: NOAUTH,
      ui: { visibility: ['model'] }
    }
  }
];

const metaResult = (result: Record<string, unknown>) => ({
  ...result,
  resultType: 'complete',
  _meta: {
    ...((result._meta as Record<string, unknown>) || {}),
    'io.modelcontextprotocol/serverInfo': SERVER_INFO
  }
});

const call = async (
  name: string,
  args: Record<string, unknown>
) => {
  if (name !== 'REPLACE_TOOL_NAME') {
    throw new Error('Unknown tool ' + name);
  }

  return {
    structuredContent: { ok: true },
    content: [
      {
        type: 'text',
        text: 'REPLACE_MODEL_FACING_RESULT'
      }
    ]
  };
};

const rpc = async (r: Rpc) => {
  const id = r.id ?? null;

  try {
    if (r.method === 'server/discover') {
      return {
        jsonrpc: '2.0',
        id,
        result: metaResult({
          supportedVersions: [MODERN_VERSION],
          capabilities: { tools: {}, resources: {} },
          instructions: INSTRUCTIONS,
          ttlMs: 60000,
          cacheScope: 'public'
        })
      };
    }

    if (r.method === 'initialize') {
      const requested = String(
        (r.params && r.params.protocolVersion) ||
        '2025-11-25'
      );

      const legacy = [
        '2025-11-25',
        '2025-06-18',
        '2025-03-26'
      ];

      const protocolVersion =
        legacy.includes(requested)
          ? requested
          : '2025-11-25';

      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion,
          capabilities: {
            tools: { listChanged: false },
            resources: { listChanged: false }
          },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS
        }
      };
    }

    if (r.method === 'ping') {
      return {
        jsonrpc: '2.0',
        id,
        result: metaResult({})
      };
    }

    if (r.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: metaResult({
          tools,
          ttlMs: 60000,
          cacheScope: 'public'
        })
      };
    }

    if (r.method === 'resources/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: metaResult({
          resources: [],
          ttlMs: 60000,
          cacheScope: 'public'
        })
      };
    }

    if (r.method === 'resources/read') {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32002,
          message: 'Resource not found'
        }
      };
    }

    if (r.method === 'tools/call') {
      const p = (r.params || {}) as {
        name?: string;
        arguments?: Record<string, unknown>;
      };

      const name = String(p.name || '');

      try {
        return {
          jsonrpc: '2.0',
          id,
          result: metaResult(
            await call(name, p.arguments || {})
          )
        };
      } catch (e) {
        const message =
          e instanceof Error ? e.message : String(e);

        console.error(
          'MCP_TOOL_ERROR',
          JSON.stringify({ tool: name, message })
        );

        return {
          jsonrpc: '2.0',
          id,
          result: metaResult({
            isError: true,
            content: [
              {
                type: 'text',
                text: 'Tool error: ' + message
              }
            ]
          })
        };
      }
    }

    if (r.method === 'notifications/initialized') {
      return null;
    }

    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: 'Method not found: ' + r.method
      }
    };
  } catch (e) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message:
          e instanceof Error ? e.message : String(e)
      }
    };
  }
};

export const handler = router({
  'GET /api/mcp': [
    async () => ({
      statusCode: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error:
          'SSE stream not offered; use POST for MCP JSON-RPC.'
      })
    })
  ],

  'POST /api/mcp': [
    async ({ body, event }) => {
      if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body)
      ) {
        return error('Invalid JSON-RPC request', 400);
      }

      const request = body as Rpc;

      const raw =
        (event?.headers || {}) as Record<
          string,
          unknown
        >;

      const headers = Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [
          k.toLowerCase(),
          String(v ?? '')
        ])
      );

      const protocol =
        headers['mcp-protocol-version'] || '';

      const method = String(request.method || '');
      const params =
        (request.params || {}) as Record<
          string,
          unknown
        >;

      const bodyMeta =
        (params._meta || {}) as Record<
          string,
          unknown
        >;

      const bodyVersion = String(
        bodyMeta[
          'io.modelcontextprotocol/protocolVersion'
        ] || ''
      );

      const modern =
        protocol === MODERN_VERSION ||
        bodyVersion === MODERN_VERSION ||
        method === 'server/discover';

      console.warn(
        'MCP_REQUEST',
        JSON.stringify({
          method,
          protocol: protocol || null,
          bodyVersion: bodyVersion || null,
          mcpMethod:
            headers['mcp-method'] || null,
          mcpName:
            headers['mcp-name'] || null,
          userAgent:
            headers['user-agent'] || null,
          modern
        })
      );

      const jsonRpcError = (
        status: number,
        code: number,
        message: string,
        data?: unknown
      ) => ({
        statusCode: status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: request.id ?? null,
          error: {
            code,
            message,
            ...(data === undefined ? {} : { data })
          }
        })
      });

      if (modern) {
        if (
          protocol !== MODERN_VERSION ||
          bodyVersion !== MODERN_VERSION
        ) {
          return jsonRpcError(
            400,
            -32020,
            'Header mismatch: MCP-Protocol-Version and request _meta protocolVersion must both be 2026-07-28'
          );
        }

        if (headers['mcp-method'] !== method) {
          return jsonRpcError(
            400,
            -32020,
            'Header mismatch: Mcp-Method does not match JSON-RPC method'
          );
        }

        const expectedName =
          method === 'tools/call'
            ? String(params.name || '')
            : method === 'resources/read'
              ? String(params.uri || '')
              : '';

        if (
          expectedName &&
          headers['mcp-name'] !== expectedName
        ) {
          return jsonRpcError(
            400,
            -32020,
            'Header mismatch: Mcp-Name does not match request body'
          );
        }

        if (!MODERN_METHODS.has(method)) {
          return jsonRpcError(
            404,
            -32601,
            'Method not found: ' + method
          );
        }

        const response = await rpc(request);

        return response === null
          ? {
              statusCode: 202,
              headers: {
                'Cache-Control': 'no-store'
              },
              body: ''
            }
          : {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
              },
              body: JSON.stringify(response)
            };
      }

      if (
        method !== 'initialize' &&
        protocol &&
        !LEGACY_VERSIONS.has(protocol)
      ) {
        return jsonRpcError(
          400,
          -32000,
          'Unsupported MCP protocol version',
          {
            supportedVersions: [
              MODERN_VERSION,
              ...LEGACY_VERSIONS
            ]
          }
        );
      }

      const response = await rpc(request);

      return response === null
        ? {
            statusCode: 202,
            headers: {
              'Cache-Control': 'no-store'
            },
            body: ''
          }
        : {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            },
            body: JSON.stringify(response)
          };
    }
  ]
});
