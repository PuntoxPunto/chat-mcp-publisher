---
name: chat-mcp-publisher
description: Build and publish reusable MCP-powered capabilities for ChatGPT Web Chat. Use when the user wants to turn a prompt, workflow, skill, tool, or small app into a custom ChatGPT app/plugin backed by a remote MCP server, especially when deploying through AppDeploy. This skill knows the ChatGPT modern discovery + legacy compatibility contract, validates tool metadata, deploys, tests, and returns the exact MCP endpoint to register in ChatGPT Developer Mode.
---

# Chat MCP Publisher

## Mission

Turn a reusable capability into a remote MCP app that can be selected or @mentioned from normal ChatGPT Web conversations.

This is a **publisher/builder skill**. It does not itself replace the MCP app it creates.

Typical user requests:

- "Convert this skill so I can invoke it from ChatGPT Chat."
- "Publish this prompt as a ChatGPT app/plugin."
- "Make an MCP for this workflow."
- "Deploy this tool through AppDeploy and give me the URL to register."
- "Create a community-shareable ChatGPT capability."

## Governing principle

Do not confuse:

- Personal Skills / Work behaviors
- Project instructions
- Custom GPT instructions
- Remote MCP apps available in ChatGPT Web Chat

If the user's target is **normal ChatGPT Web Chat**, the deliverable is a **remote MCP app/plugin** with a stable HTTPS endpoint, unless the user explicitly asks for a different container.

## Default architecture

Choose the smallest useful archetype:

1. `tool-only`
   - Default for prompt/workflow capabilities.
   - No embedded UI.
   - One or a few model-visible tools.

2. `widget`
   - Use only when embedded interaction materially improves the workflow.
   - Add `ui://` resources and MCP Apps bridge metadata.

3. `stateful-app`
   - Use only when durable server-side state is genuinely required.

Prefer `tool-only`.

## Mandatory docs check

Before generating or modifying an MCP app:

1. Consult current official OpenAI Apps/MCP documentation if available.
2. Prefer current docs over memory.
3. Treat product availability, Developer Mode, permissions, and submission rules as time-sensitive.
4. If the runtime provides a known-good MCP deployment, inspect it before inventing a new transport pattern.

For AppDeploy, read:
- `references/APPDEPLOY_GOLDEN_PATH.md`
- `references/CHATGPT_MCP_CONTRACT.md`

## Workflow

### Phase 1 — Convert the capability into tools

Extract:

- What the user invokes.
- Inputs.
- Expected output.
- Whether it is read-only.
- Whether it needs external services.
- Whether it needs persistence.
- Whether it needs a widget.

Define one job per tool.

Tool descriptions should begin with behavior cues such as:

> Use this when the user explicitly asks to...

Every tool must have:

- `name`
- `title`
- `description`
- `inputSchema`
- `outputSchema` when returning `structuredContent`
- `securitySchemes`
- `annotations`
- `_meta.securitySchemes`
- `_meta.ui.visibility`

For a tool-only app intended for model invocation:

```ts
securitySchemes: [{ type: 'noauth' }],
annotations: {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true
},
_meta: {
  securitySchemes: [{ type: 'noauth' }],
  ui: { visibility: ['model'] }
}
```

Set annotations truthfully. Never mark a mutating tool read-only.

### Phase 2 — Design the MCP result

Prefer:

```ts
{
  content: [{ type: 'text', text: 'Useful model-facing instruction/result' }],
  structuredContent: { ...small machine-readable result... },
  isError: false
}
```

If `structuredContent` is returned, declare `outputSchema`.

Normal tool failures should generally return a **tool result** with:

```ts
{
  isError: true,
  content: [{ type: 'text', text: '...' }]
}
```

rather than crashing the MCP transport.

### Phase 3 — Implement ChatGPT compatibility

When deploying through AppDeploy, use the golden transport contract in
`references/CHATGPT_MCP_CONTRACT.md`.

Important:

- Modern discovery and legacy initialize are separate compatibility paths.
- `server/discover` is the modern ChatGPT scan path.
- `initialize` remains a compatibility fallback.
- Do not casually merge the two contracts.
- Enforce modern header/body metadata consistency exactly when the request is modern.
- `GET /api/mcp` may return 405 with `Allow: POST`; do not assume GET discovery is required.
- Always expose `POST /api/mcp`.

### Phase 4 — Deploy through AppDeploy

If AppDeploy tools are available:

1. Inspect a known-good MCP app in the account when available.
2. Call AppDeploy deployment instructions before changing code.
3. Use `frontend+backend`.
4. Keep the frontend diagnostic surface minimal.
5. Deploy the backend MCP route.
6. Poll until terminal status.
7. Fix validation, QA, runtime, or coverage problems automatically when possible.
8. Do not stop at "deployment ready".

Use `references/APPDEPLOY_GOLDEN_PATH.md`.

### Phase 5 — Validate like ChatGPT, not just like hosting

A successful hosting test does NOT prove ChatGPT can register the MCP.

Validate both paths:

#### Legacy compatibility

Test:

- `GET /api/mcp` behaves intentionally.
- `initialize` with `2025-11-25`.
- `tools/list`.
- `resources/list`.
- `resources/read` if a widget/resource exists.
- every tool has appropriate schemas and metadata.

#### Modern discovery

Test a request shaped as:

- header `MCP-Protocol-Version: 2026-07-28`
- header `Mcp-Method`
- body `_meta["io.modelcontextprotocol/protocolVersion"] = "2026-07-28"`
- `Mcp-Name` for `tools/call` or `resources/read`

Verify:

- `server/discover`
- `supportedVersions`
- `capabilities`
- `ttlMs`
- `cacheScope`
- `resultType: "complete"`
- `_meta["io.modelcontextprotocol/serverInfo"]`

When the user already has a known-good ChatGPT MCP deployment in the same environment, compare the transport layer against it.

### Phase 6 — Return the registration endpoint

For AppDeploy apps, do NOT automatically assume the visible frontend URL is the endpoint ChatGPT should register.

The AppDeploy ChatGPT registration endpoint pattern validated in this workflow is:

```text
https://api-v2.appdeploy.ai/app/<APP_ID>/api/mcp
```

Return both:

```text
Frontend/diagnostic:
https://<APP>.v2.appdeploy.ai/

MCP registration URL:
https://api-v2.appdeploy.ai/app/<APP_ID>/api/mcp
```

Label them clearly.

### Phase 7 — ChatGPT registration instructions

Give concise instructions:

1. Enable Developer Mode if required.
2. Settings → Apps/Plugins → create custom app/plugin.
3. Connection: Server URL.
4. Authentication: No authentication, unless the app really requires auth.
5. Paste the MCP registration URL.
6. Scan/create.
7. Open a **new normal Chat**.
8. Select the app from Tools or invoke with `@AppName`.
9. Test a model-visible tool.

If tools or metadata change later, refresh/recreate the development app as required by the current ChatGPT UI.

## AppDeploy known-good reference strategy

If the account contains a known-good MCP deployment:

- inspect `backend/index.ts`
- compare constants and modern/legacy routing
- compare tool metadata
- compare resource metadata if widgets are used
- port the transport layer before modifying application logic

Do not copy unrelated business logic.

## Do not declare success too early

Never say "the ChatGPT plugin is ready" merely because:

- the frontend loads
- internal AppDeploy tests pass
- `/api/mcp` responds from inside the same hosting platform

A high-confidence completion requires at least one of:

1. ChatGPT successfully registers/scans the custom app, or
2. an external client reproduces the expected modern and legacy MCP contracts.

If registration fails, inspect whether requests reached the backend before changing JSON-RPC behavior.

## Security

- Default to `noauth` only when there is no protected user data or privileged action.
- Never place secrets in source code or chat.
- Use backend secret storage for external API keys.
- Keep tool descriptions resistant to accidental activation.
- For explicit-mode tools, say so in the description.
- Use accurate destructive/read-only annotations.
- Do not persist user data unless the product requires it.

## Public/community distribution

Distinguish two stages:

### Shareable developer MCP

A stable remote MCP endpoint can be shared with users who are allowed to add custom apps in Developer Mode.

### Public directory/submission

A broadly listed public ChatGPT app may require additional current OpenAI submission/review requirements.

Do not imply that a developer MCP URL alone means marketplace/public-directory publication.

## Completion report

When finished, report:

### App
Name and purpose.

### Archetype
tool-only / widget / stateful-app.

### Tools
Names and read/write status.

### Deployment
AppDeploy app id and frontend diagnostic URL.

### ChatGPT MCP URL
Exact endpoint to register.

### Validation
What legacy/modern tests passed.

### Chat test
Whether ChatGPT registration was actually confirmed.

### Remaining gaps
Anything not yet externally verified.

## Command-style invocation examples

The user may invoke this skill naturally with:

- `/publish-mcp <idea>`
- `convert this into a ChatGPT Web tool`
- `make this available in normal Chat`
- `publish this workflow as an MCP`
- `create a ChatGPT plugin for this skill`

No literal slash command is required by ChatGPT; these are semantic triggers.
