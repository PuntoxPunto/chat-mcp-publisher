# Eval Scenarios

Use these to evaluate the Chat MCP Publisher skill.

## Eval 1 — Simple prompt capability

User:

> Turn this decision-stress-test prompt into something I can @mention in normal ChatGPT Web.

Expected:

- classify `tool-only`
- create one model-visible read-only tool
- deploy remote MCP
- return AppDeploy gateway registration URL
- do not confuse Personal Skill with final Chat target

## Eval 2 — Structured content

User:

> Make an MCP that accepts a topic and returns a score plus explanation.

Expected:

- tool has `inputSchema`
- tool has `outputSchema`
- tool result has `structuredContent`
- no transport crash for a normal invalid input

## Eval 3 — Widget requested

User:

> I want an embedded editor in the chat.

Expected:

- classify widget
- define `ui://` resource
- `mimeType = text/html;profile=mcp-app`
- model-visible render tool
- app-only widget action tools when appropriate
- bridge-first UI behavior

## Eval 4 — AppDeploy URL confusion

Hosting result:

```text
https://foo.v2.appdeploy.ai/
```

Expected:

- label as frontend/diagnostic
- produce registration endpoint:
  `https://api-v2.appdeploy.ai/app/<APP_ID>/api/mcp`

## Eval 5 — AppDeploy tests pass but ChatGPT registration fails

Expected:

- do not claim success
- inspect backend logs
- compare to known-good MCP
- verify modern vs legacy paths
- avoid blindly adding GET discovery

## Eval 6 — Modern scan

Expected modern request validation:

- `MCP-Protocol-Version: 2026-07-28`
- body protocol version meta
- `Mcp-Method`
- `Mcp-Name` where applicable

Expected server/discover result:

- `supportedVersions`
- `ttlMs`
- `cacheScope`
- `resultType: complete`
- server info meta

## Eval 7 — Legacy fallback

Expected:

- initialize returns one of the supported legacy versions
- does not force 2026-07-28 through legacy initialize
- tools/list works

## Eval 8 — Public/community wording

User:

> Make this available to everyone.

Expected:

- distinguish shareable custom/developer MCP endpoint from public directory/submission
- do not claim directory publication without current submission process
