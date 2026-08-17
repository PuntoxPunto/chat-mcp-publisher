# AppDeploy Golden Path for ChatGPT Web MCP Apps

## Objective

Deploy an MCP-backed capability so ChatGPT Web Chat can register it as a custom app/plugin.

## 1. Discover AppDeploy capabilities

Before code changes:

1. Load AppDeploy deployment instructions.
2. Load the API SDK reference.
3. Inspect the current source snapshot for updates.
4. If the account contains a known-good ChatGPT MCP deployment, inspect its backend transport layer.

Prefer evidence over assumptions.

## 2. App shape

Use:

```text
app_type: frontend+backend
```

The frontend may be only a diagnostic page.

Backend entry point:

```text
backend/index.ts
```

MCP route:

```text
POST /api/mcp
```

## 3. Minimal backend route surface

Recommended:

```text
GET /api/_healthcheck
GET /api/mcp
POST /api/mcp
```

Avoid unrelated backend endpoints so QA coverage remains meaningful.

## 4. Deployment lifecycle

Always:

1. deploy
2. poll status
3. wait through `deploying`
4. wait through `deployed_and_testing`
5. stop only at `ready` or `failed`

If QA/runtime fails, inspect logs and fix automatically when safe.

## 5. QA

Hosting QA should exercise:

- legacy initialize
- tools/list
- tools/call
- GET /api/mcp expected behavior
- tool metadata
- structured output
- error handling

For a widget also test:

- resources/list
- resources/read
- `text/html;profile=mcp-app`
- `ui://` resource metadata

## 6. Frontend diagnostic URL

Example:

```text
https://my-app.v2.appdeploy.ai/
```

This is useful for a human diagnostic page.

Do not automatically use it as the ChatGPT registration endpoint.

## 7. ChatGPT registration URL

Validated AppDeploy gateway pattern:

```text
https://api-v2.appdeploy.ai/app/<APP_ID>/api/mcp
```

Example:

```text
https://api-v2.appdeploy.ai/app/my-app-id/api/mcp
```

## 8. Registration test

After deployment:

1. ChatGPT Settings → Apps/Plugins.
2. Developer Mode enabled.
3. Create custom app/plugin.
4. Connection = Server URL.
5. Authentication = No authentication, unless required.
6. Paste the gateway URL.
7. Complete scan/create.
8. Open a **new normal Chat**.
9. Select the app from Tools or @mention it.
10. Invoke a model-visible tool.

## 9. Critical diagnostic rule

If ChatGPT registration fails:

### If backend logs show ChatGPT requests

Inspect:

- modern headers
- request `_meta`
- method/name consistency
- server/discover shape
- tool schemas and metadata

### If backend logs show no ChatGPT request

Do NOT keep changing JSON-RPC handlers blindly.

Investigate:

- endpoint selection
- gateway exposure
- TLS/network/access
- product/workspace restrictions

## 10. Known-good differential debugging

When another MCP in the same AppDeploy account works:

1. Read its `backend/index.ts`.
2. Compare:
   - modern version
   - legacy versions
   - server/discover
   - initialize
   - modern header validation
   - metaResult
   - tool metadata
   - resource metadata
3. Port the transport layer first.
4. Keep the new app's business logic separate.

This method is preferred over trial-and-error protocol changes.
