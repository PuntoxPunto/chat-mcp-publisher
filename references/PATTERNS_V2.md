# Publisher V2 Patterns

These patterns were added after publishing and QA-testing multiple ChatGPT Web MCP apps through AppDeploy. They complement, not replace, `CHATGPT_MCP_CONTRACT.md`.

## 1. Capability routing instead of provider coupling

When a capability depends on external services, model the user-facing capability separately from its providers.

Example:

```text
search_web
  -> preferred backend
  -> fallback backend
```

Return provider provenance when useful:

```json
{
  "backend_used": "provider_name",
  "attempts": [
    { "backend": "provider_name", "ok": true }
  ]
}
```

Rules:

- tool names describe capabilities, not vendor brands, unless the vendor itself is the product;
- prefer a stable provider and explicit fallback chain;
- never silently claim a fallback succeeded when it did not;
- sanitize provider errors before returning or logging them;
- an external-provider failure should normally be a tool-level error or degraded capability, not an MCP transport crash.

### Proven example: Punto Reach

The deployed Reach capability layer separated:

- public web search -> Exa remote MCP;
- URL/RSS reading -> Jina Reader with Exa `web_fetch_exa` fallback;
- public GitHub search -> GitHub REST with Exa search fallback;
- provider health -> `reach_doctor`.

The final deployment passed a real Exa `tools/call` search in QA rather than validating only configuration or tool discovery.

## 2. Doctor means real probes

Do not treat these as proof of health:

- executable exists;
- configuration file exists;
- MCP is registered;
- hosting deployment says READY;
- `tools/list` alone when the actual capability can still fail.

Separate three states:

```text
MCP transport health
provider health
capability-call health
```

A provider can be degraded while the MCP transport remains healthy.

Recommended `doctor` output:

```json
{
  "transport": { "ok": true },
  "providers": {
    "provider_a": {
      "ok": true,
      "detail": "live probe succeeded"
    }
  }
}
```

For rate-limited providers, a cheap initialize/list probe may be appropriate for routine doctor checks, but at least one deployment QA path should execute the real capability call.

Log health booleans and transport metadata; do not log user queries, fetched content, cookies, tokens or secret-bearing URLs by default.

## 3. Widget MCP pattern

Use a widget only when interaction materially improves the task.

Known-good ChatGPT/AppDeploy shape:

```text
ui://widget/<name>/v1.html
mimeType: text/html;profile=mcp-app
```

The model-visible render tool includes:

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

`resources/list` advertises the URI and MIME type.

`resources/read` returns the HTML resource and widget metadata.

Bridge initialization used successfully in this environment:

```text
ui/initialize
ui/notifications/initialized
```

Useful bridge actions:

```text
ui/message
ui/request-display-mode
```

Use `window.openai` only as a compatibility fallback when the MCP Apps bridge path is unavailable.

### Widget action visibility

Model-facing render/read tools:

```ts
ui: { visibility: ['model'] }
```

Widget-only actions when needed:

```ts
ui: { visibility: ['app'] }
'openai/widgetAccessible': true
'openai/visibility': 'private'
```

### Sandbox generated/untrusted HTML

If the app displays model-generated or user-provided HTML, sanitize it before rendering.

At minimum consider:

- removing nested iframes/object/embed;
- removing external script sources;
- removing inline HTML event attributes when not required;
- rejecting `javascript:` URLs;
- injecting a restrictive CSP;
- rendering in an iframe without `allow-same-origin` when executable prototype JavaScript is needed;
- omitting `allow-scripts` entirely for a static report.

Do not describe sanitized HTML as fully safe against every possible browser attack. Keep the resource isolated and capability-limited.

## 4. Stateless before stateful

Do not introduce persistence merely because a workflow spans conversations.

Use this progression:

```text
conversation state
-> portable export/import
-> authenticated per-user persistence only when identity is proven end-to-end
```

Portable state is often enough for a V1:

```text
conversation+portable-export
```

This worked for Teach and Wayfinder V1 while avoiding shared multi-user state.

## 5. Hosting auth is not automatically ChatGPT MCP OAuth

A hosting platform may provide login, user IDs and protected backend routes for its own frontend without automatically exposing the OAuth/OIDC discovery and token lifecycle required by ChatGPT for an authenticated MCP.

Therefore:

- never infer that hosting-platform auth makes the MCP ChatGPT-authenticated;
- before storing private per-user state, validate ChatGPT -> authorization server -> MCP identity end-to-end;
- verify authorization metadata, scopes, access-token validation and refresh behavior against current OpenAI requirements;
- do not share a server-side cookie jar or credentials across users.

Until that is proven, prefer noauth + no private server-side persistence.

## 6. Host tools vs MCP tools

A behavioral MCP may instruct the model to use GitHub, Linear, web research or other tools already available to the host conversation.

It does not magically own those tools.

Rules:

- distinguish proposed state from externally materialized state;
- only say an issue/event/file was created or changed after the real host tool reports success;
- keep the MCP itself read-only when its role is planning/orchestration;
- this pattern was used for Wayfinder and Architecture Review.

## 7. Evidence from deployed apps

Patterns were exercised in the following AppDeploy apps:

```text
grill-chat-sby65b         tool-only behavioral MCP; ChatGPT registration confirmed
handoff-yocioi            read-only handoff protocol
loopme-xkc1dm             portable workflow-design state
punto-reach-r9sm6m        capability router + real provider probes/fallbacks
teach-028aih              portable learning state; no false persistence claims
wayfinder-cvsc3n          portable map + host tracker boundary
prototype-noa6ix          widget + sandboxed generated prototype HTML
architecture-review-e4xem3 widget + static sanitized report
```

Passing AppDeploy QA is evidence of the tested hosting behavior. It is not by itself proof that a new custom app has been successfully registered in ChatGPT; preserve the separate ChatGPT registration gate.
