---
name: chat-mcp-publisher
description: Build and publish reusable MCP-powered capabilities for normal ChatGPT Web Chat. Use when the user wants to turn a prompt, workflow, skill, tool, capability router, or small interactive app into a remote ChatGPT app/plugin, especially through AppDeploy. Covers tool-only apps, widgets, read-only orchestration, provider fallbacks/doctor checks, ChatGPT MCP compatibility, deployment QA, and registration.
---

# Chat MCP Publisher

## Mission

Turn a reusable capability into a remote MCP app that can be selected or @mentioned from normal ChatGPT Web conversations.

This is a **builder/publisher skill**. It creates the MCP app; it is not the runtime replacement for that app.

Typical triggers:

- `/publish-mcp <idea>`
- `convert this skill into a ChatGPT Web tool`
- `make this available in normal Chat`
- `publish this workflow as an MCP`
- `create a ChatGPT plugin/app for this capability`

## Governing principle

Do not confuse Personal Skills, Work/Project instructions, custom GPT behavior, and remote MCP apps.

If the target is **normal ChatGPT Web Chat**, the deliverable is a stable remote HTTPS MCP unless the user explicitly chooses another container.

## Required references

Before implementation read:

- `references/CHATGPT_MCP_CONTRACT.md` for the proven ChatGPT/AppDeploy transport;
- `references/APPDEPLOY_GOLDEN_PATH.md` for deployment and registration;
- `references/PATTERNS_V2.md` whenever the app uses external providers, widgets, host tools, cross-chat state, authentication, or persistence.

Use current official OpenAI Apps/MCP documentation for time-sensitive product, Developer Mode, auth, or submission claims. Prefer observed working deployments over guessed protocol behavior.

## 1. Choose the smallest architecture

Classify the request before writing code.

### `tool-only`

Default for prompts, workflows and behavioral capabilities. One or a few model-visible tools; no embedded UI.

### `widget`

Use only when embedded interaction materially improves the task: visual review, prototype switching, rich selection, an editor, a before/after report, or another UI-native workflow.

### `stateful-app`

Use only when durable server-side state is genuinely necessary **and** per-user identity/auth has been validated end-to-end from ChatGPT to the MCP.

### `capability-router`

Use when one user-facing capability may be served by multiple providers. Tool names should describe the capability, while runtime results report provider provenance and fallback attempts.

Prefer, in order:

```text
tool-only
-> widget when interaction justifies it
-> portable state before server state
-> stateful only after identity is proven
```

## 2. Convert the capability into tools

For each tool determine:

- exact user/job intent;
- inputs;
- output;
- read/write semantics;
- idempotency;
- open-world behavior;
- external providers;
- whether host tools are required;
- whether persistence or a widget is actually necessary.

Define one coherent job per tool.

Descriptions should clearly say when the model should use the tool, for example:

> Use this when the user explicitly asks to...

Every model-visible tool should have:

- `name`
- `title`
- `description`
- `inputSchema`
- `outputSchema` whenever `structuredContent` is returned
- `securitySchemes`
- truthful `annotations`
- `_meta.securitySchemes`
- `_meta.ui.visibility`

Typical noauth read-only metadata:

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

Set `openWorldHint` truthfully. A read-only web/search tool normally has open-world behavior even though it does not mutate anything.

## 3. Design robust tool results

Prefer a small model-facing result plus machine-readable state:

```ts
{
  content: [{ type: 'text', text: 'Useful result or directive' }],
  structuredContent: { ... },
  isError: false
}
```

Normal execution failures should generally become tool-level errors:

```ts
{
  isError: true,
  content: [{ type: 'text', text: '...' }]
}
```

Do not crash the MCP transport for an ordinary provider/tool failure.

For provider-backed capabilities, return provenance when useful:

```json
{
  "backend_used": "provider_a",
  "attempts": [
    { "backend": "provider_a", "ok": true }
  ]
}
```

## 4. External providers: route capabilities, not brands

When a service may fail or change, separate the capability from the implementation:

```text
capability
  -> preferred backend
  -> fallback
```

Rules:

- do not silently pretend a fallback worked;
- sanitize provider errors;
- keep user queries/content out of diagnostic logs by default;
- distinguish MCP transport health from provider health and real capability-call health;
- validate at least one real provider call in deployment QA when practical.

Read `references/PATTERNS_V2.md`.

## 5. Doctor checks must prove something

Do not declare health because an executable, config file, connector, or deployment exists.

A useful health model separates:

```text
transport
providers
capability calls
```

A degraded provider should not automatically make a healthy MCP transport appear broken.

For rate-limited providers, routine doctor checks may use a cheaper live handshake/tool-discovery probe, while deployment QA still executes the real capability at least once.

## 6. Widgets

For an embedded ChatGPT UI, use the known-good MCP Apps resource shape:

```text
ui://widget/<name>/v1.html
text/html;profile=mcp-app
```

The render tool should point to that resource using `ui.resourceUri` and `openai/outputTemplate`.

Test both:

- `resources/list`
- `resources/read`

Use the MCP Apps bridge first (`ui/initialize`, then initialized notification). `ui/message` and display-mode requests can drive feedback/fullscreen. A `window.openai` path may be used as a compatibility fallback.

If rendering generated/user HTML, sanitize and sandbox it according to the threat model. Static reports should normally run with no scripts. Executable prototypes should avoid `allow-same-origin`, block network access, and use a restrictive CSP.

Do not persist widget state server-side unless the product needs it and identity is safe.

## 7. Cross-chat state: portable before persistent

For a workflow that spans chats, first consider:

```text
conversation state
+
portable Markdown/JSON export/import
```

This is often enough for V1 and avoids a shared multi-user state store.

Never claim progress is saved server-side when it is not.

Before private per-user persistence, prove the full ChatGPT authentication path. A hosting platform's own frontend login/user IDs do **not** automatically prove that its MCP endpoint is a ChatGPT-compatible OAuth/OIDC resource server.

## 8. Host tools are separate capabilities

A behavioral MCP can tell the model to use GitHub, Linear, web research or other tools available to the conversation. It does not magically own those tools.

Therefore:

- keep planning/orchestration MCPs read-only when appropriate;
- distinguish proposed state from materialized external state;
- say an issue/file/event was changed only after the actual host tool confirms the mutation.

## 9. Implement ChatGPT compatibility

Use `references/CHATGPT_MCP_CONTRACT.md`.

Critical rules:

- modern `server/discover` and legacy `initialize` are separate paths;
- modern protocol: `2026-07-28`;
- enforce modern header/body metadata consistency;
- `Mcp-Method` must match the JSON-RPC method;
- `Mcp-Name` must match tool/resource name where required;
- known-good GET `/api/mcp` behavior is intentional `405` + `Allow: POST`;
- always expose POST `/api/mcp`;
- `notifications/initialized` returns HTTP 202 with an empty body;
- modern complete results include serverInfo metadata.

Do not replace the proven transport with a generic implementation merely because it looks more standard.

## 10. Deploy through AppDeploy

Before **every** deployment or redeployment:

1. call current AppDeploy deployment instructions;
2. inspect the remote snapshot when state may have drifted;
3. load the relevant SDK reference before using AppDeploy SDK/client APIs;
4. state implementation and preflight checklists;
5. for new ChatGPT MCP apps, normally use `frontend+backend` with a minimal diagnostic frontend;
6. keep backend route surface small;
7. deploy;
8. poll through `deploying` and `deployed_and_testing` until terminal;
9. inspect QA/errors even if the app reaches READY;
10. if E2E fails, inspect the exact QA run before changing code;
11. fix automatically when safe.

Do not stop at `deployment ready` if the requested proof is stronger than hosting readiness.

## 11. QA like a real ChatGPT app

At minimum verify legacy compatibility:

- GET `/api/mcp` intentional behavior;
- initialize `2025-11-25`;
- tools/list;
- tools/call;
- schemas/metadata;
- error handling.

For widgets also verify:

- resources/list;
- resources/read;
- MIME `text/html;profile=mcp-app`;
- render-tool resource metadata.

For provider-backed tools:

- doctor/live health where useful;
- one real capability call;
- fallback/provenance semantics;
- visible degradation rather than false readiness.

Keep exactly one fastest high-signal QA path as the sanity test and maintain mobile coverage when interaction/layout differs.

## 12. Return the correct registration endpoint

Do not confuse the AppDeploy diagnostic frontend with the endpoint registered in ChatGPT.

```text
Frontend/diagnostic:
https://<APP>.v2.appdeploy.ai/

Validated AppDeploy MCP registration pattern:
https://api-v2.appdeploy.ai/app/<APP_ID>/api/mcp
```

Label them separately.

## 13. ChatGPT registration gate

Give current, concise registration instructions based on official OpenAI UI/docs.

Typical flow:

1. enable Developer Mode where required;
2. create a custom app/plugin using Server URL;
3. choose authentication that matches the server;
4. paste the MCP registration endpoint;
5. scan/create;
6. open a **new normal Chat**;
7. select the app or invoke it by @mention;
8. execute a model-visible tool.

Do not say a new ChatGPT app is confirmed merely because AppDeploy QA passed.

High-confidence completion requires either:

- actual ChatGPT registration/tool invocation; or
- explicitly-labeled transport/provider QA when the ChatGPT registration gate has not yet been performed.

## 14. Differential debugging

When registration fails and a known-good MCP exists in the same environment, compare transport first:

- server/discover;
- initialize;
- modern headers and body metadata;
- metaResult/serverInfo;
- tool schemas/metadata;
- resources metadata for widgets.

If backend logs show no registration request, investigate endpoint/gateway/product restrictions before rewriting JSON-RPC.

## 15. Security

- no secrets in source/chat/logs;
- `noauth` only for capabilities that truly require no protected identity/data;
- accurate read/write annotations;
- private/local URL guardrails for server-side readers;
- no shared cookie jar for multiple users;
- no private server persistence without validated identity isolation;
- generated HTML should be sandboxed/sanitized according to its capabilities;
- do not reveal private chain-of-thought.

## 16. Distribution wording

Distinguish:

- a shareable remote developer/custom MCP endpoint;
- broader public directory/submission/review.

Do not imply a working Developer Mode URL is automatically a public marketplace listing.

## Completion report

Report:

- App name and purpose
- Archetype
- Tools and read/write status
- Providers/fallbacks if any
- State model/persistence boundary
- AppDeploy app id
- Diagnostic frontend
- exact ChatGPT MCP registration URL
- legacy/modern/widget/provider QA performed
- actual ChatGPT registration status
- remaining gaps
