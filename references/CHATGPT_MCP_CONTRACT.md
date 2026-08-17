# ChatGPT MCP Contract — AppDeploy Golden Compatibility

This reference captures the transport contract that matched a known-good ChatGPT Web MCP deployment in the same AppDeploy environment.

Treat this as an AppDeploy compatibility recipe, not as a replacement for current official OpenAI/MCP documentation.

## Constants

```ts
const SERVER_INFO = { name: 'your-server-name', version: 'x.y.z' };
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
```

## Result metadata wrapper

Modern discovery results should include:

```ts
const metaResult = (result: Record<string, unknown>) => ({
  ...result,
  resultType: 'complete',
  _meta: {
    ...((result._meta as Record<string, unknown>) || {}),
    'io.modelcontextprotocol/serverInfo': SERVER_INFO
  }
});
```

## server/discover

Use:

```ts
{
  jsonrpc: '2.0',
  id,
  result: metaResult({
    supportedVersions: [MODERN_VERSION],
    capabilities: {
      tools: {},
      resources: {}
    },
    instructions: INSTRUCTIONS,
    ttlMs: 60000,
    cacheScope: 'public'
  })
}
```

Do not return the legacy `initialize` shape from `server/discover`.

## initialize legacy fallback

A known-good compatibility shape:

```ts
const requested = String(
  (request.params && request.params.protocolVersion) || '2025-11-25'
);

const legacy = ['2025-11-25', '2025-06-18', '2025-03-26'];

const protocolVersion = legacy.includes(requested)
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
```

## GET /api/mcp

Known-good AppDeploy MCP behavior:

```ts
{
  statusCode: 405,
  headers: {
    Allow: 'POST',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    error: 'SSE stream not offered; use POST for MCP JSON-RPC.'
  })
}
```

Do not "fix" this to a GET discovery response merely because a generic Streamable HTTP implementation might support GET. The known-good ChatGPT scanner accepted 405 here.

## Modern POST validation

Normalize request headers to lowercase.

A request is considered modern when:

```ts
const modern =
  protocol === MODERN_VERSION ||
  bodyVersion === MODERN_VERSION ||
  method === 'server/discover';
```

Where:

```ts
const protocol = headers['mcp-protocol-version'] || '';
const bodyMeta = (params._meta || {}) as Record<string, unknown>;
const bodyVersion = String(
  bodyMeta['io.modelcontextprotocol/protocolVersion'] || ''
);
```

For modern requests require:

```text
MCP-Protocol-Version = 2026-07-28
body params._meta["io.modelcontextprotocol/protocolVersion"] = 2026-07-28
Mcp-Method = JSON-RPC method
```

For:

```text
tools/call
```

also require:

```text
Mcp-Name = params.name
```

For:

```text
resources/read
```

require:

```text
Mcp-Name = params.uri
```

Header/body mismatches should return a JSON-RPC error result with an HTTP error status, rather than silently accepting inconsistent discovery metadata.

## Legacy POST compatibility

For requests that are not modern:

- allow `initialize`
- allow supported legacy protocol versions
- reject unsupported non-empty protocol versions on non-initialize methods
- return normal JSON-RPC

## tools/list

Return:

```ts
metaResult({
  tools,
  ttlMs: 60000,
  cacheScope: 'public'
})
```

## resources/list

Tool-only apps may return:

```ts
metaResult({
  resources: [],
  ttlMs: 60000,
  cacheScope: 'public'
})
```

Widget apps should list their `ui://` resource.

## resources/read

For a widget:

```ts
{
  uri: 'ui://widget/example/v1.html',
  mimeType: 'text/html;profile=mcp-app',
  text: widgetHtml,
  _meta: {
    ui: {
      prefersBorder: false,
      csp: {
        connectDomains: [],
        resourceDomains: []
      }
    },
    'openai/widgetDescription': '...'
  }
}
```

For tool-only apps, an unknown resource may return a resource-not-found JSON-RPC error.

## tools/call errors

Prefer:

```ts
{
  jsonrpc: '2.0',
  id,
  result: metaResult({
    isError: true,
    content: [
      { type: 'text', text: 'Tool error: ...' }
    ]
  })
}
```

for normal tool execution errors.

## notifications/initialized

Return no JSON-RPC body:

```ts
null
```

At the HTTP layer:

```text
202
empty body
```

## Tool metadata

Each model-visible tool should normally include:

```ts
securitySchemes: [{ type: 'noauth' }],
_meta: {
  securitySchemes: [{ type: 'noauth' }],
  ui: { visibility: ['model'] }
}
```

If returning `structuredContent`, declare `outputSchema`.

## Widget metadata

A render tool should use:

```ts
_meta: {
  securitySchemes: NOAUTH,
  ui: {
    resourceUri: URI,
    visibility: ['model']
  },
  'openai/outputTemplate': URI
}
```

Widget-only mutation tools:

```ts
_meta: {
  securitySchemes: NOAUTH,
  ui: { visibility: ['app'] },
  'openai/widgetAccessible': true,
  'openai/visibility': 'private'
}
```

## Logging

For debugging registration, log only safe transport metadata:

```ts
console.warn('MCP_REQUEST', JSON.stringify({
  method,
  protocol: protocol || null,
  bodyVersion: bodyVersion || null,
  mcpMethod: headers['mcp-method'] || null,
  mcpName: headers['mcp-name'] || null,
  userAgent: headers['user-agent'] || null,
  modern
}));
```

Do not log user tool arguments by default.
