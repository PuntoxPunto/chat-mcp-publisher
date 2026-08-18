# Eval Scenarios

Use these to evaluate the Chat MCP Publisher skill.

## Eval 1 — Simple prompt capability

User:

> Turn this decision-stress-test prompt into something I can @mention in normal ChatGPT Web.

Expected:

- classify `tool-only`;
- create one model-visible read-only tool;
- deploy remote MCP;
- return AppDeploy gateway registration URL;
- do not confuse a Personal Skill with the final Chat target.

## Eval 2 — Structured content

User:

> Make an MCP that accepts a topic and returns a score plus explanation.

Expected:

- tool has `inputSchema`;
- tool has `outputSchema`;
- tool result has `structuredContent`;
- normal invalid input becomes a tool error rather than a transport crash.

## Eval 3 — Widget requested

User:

> I want an embedded editor in the chat.

Expected:

- classify `widget`;
- define a `ui://` resource;
- `mimeType = text/html;profile=mcp-app`;
- model-visible render tool points to the resource using `ui.resourceUri` and `openai/outputTemplate`;
- widget-only action tools use app visibility when appropriate;
- bridge-first initialization;
- resources/list and resources/read included in QA.

## Eval 4 — AppDeploy URL confusion

Hosting result:

```text
https://foo.v2.appdeploy.ai/
```

Expected:

- label it frontend/diagnostic;
- produce registration endpoint `https://api-v2.appdeploy.ai/app/<APP_ID>/api/mcp`.

## Eval 5 — AppDeploy tests pass but ChatGPT registration fails

Expected:

- do not claim ChatGPT success;
- inspect backend logs;
- compare to known-good MCP;
- verify modern vs legacy paths;
- avoid blindly adding GET discovery.

## Eval 6 — Modern scan

Expected modern request validation:

- `MCP-Protocol-Version: 2026-07-28`;
- body protocol version meta;
- `Mcp-Method`;
- `Mcp-Name` where applicable.

Expected server/discover result:

- `supportedVersions`;
- `ttlMs`;
- `cacheScope`;
- `resultType: complete`;
- serverInfo meta.

## Eval 7 — Legacy fallback

Expected:

- initialize returns one of the supported legacy versions;
- does not force 2026-07-28 through legacy initialize;
- tools/list works.

## Eval 8 — Public/community wording

User:

> Make this available to everyone.

Expected:

- distinguish shareable custom/developer MCP endpoint from public directory/submission;
- do not claim directory publication without the current submission process.

## Eval 9 — Provider-backed capability

User:

> Make a web research tool. Use Provider A but fall back to Provider B if A is down.

Expected:

- expose a capability-oriented tool name rather than hard-coding the provider into the user-facing contract unless requested;
- ordered preferred/fallback routing;
- return `backend_used` and attempt provenance when useful;
- provider failure is not an MCP transport crash;
- doctor/provider health separated from transport health;
- deployment QA executes at least one real capability call.

## Eval 10 — Doctor false-positive guard

Situation:

> Provider CLI/config/registration exists, but the actual call is failing.

Expected:

- do not report provider healthy from installation/configuration alone;
- perform an appropriate live probe;
- label transport separately from provider/capability health;
- if routine health uses a cheap handshake because of rate limits, require a real capability-call QA path elsewhere.

## Eval 11 — Cross-chat learning state without proven OAuth

User:

> Store each learner's progress forever. AppDeploy has login, so just use that.

Expected:

- do not infer hosting auth equals ChatGPT MCP OAuth identity;
- recommend a portable conversation export/import V1 when it satisfies the workflow;
- do not create private multi-user server storage until ChatGPT -> auth server -> MCP identity is proven end-to-end;
- explicitly state persistence boundaries.

## Eval 12 — Host GitHub tool boundary

User:

> Make a planning MCP that creates GitHub issues as it reasons.

Expected:

- distinguish the behavioral MCP from GitHub tools available to the host conversation;
- MCP can remain read-only and instruct the model when/how to call GitHub;
- never claim an issue was created/updated/closed until a real GitHub tool reports success.

## Eval 13 — Generated HTML widget

User:

> Render three AI-generated UI prototypes inside the ChatGPT app.

Expected:

- widget architecture;
- generated HTML sanitized according to its threat model;
- restrictive CSP;
- executable prototype iframe does not use `allow-same-origin` unless a reviewed requirement makes it necessary;
- network disabled inside prototype HTML unless explicitly required and approved;
- state remains throwaway/stateless by default.
