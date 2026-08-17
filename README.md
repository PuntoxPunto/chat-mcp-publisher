# Chat MCP Publisher

A builder skill for turning prompts, workflows and lightweight tools into remote MCP apps that can be used from normal ChatGPT Web conversations.

The skill captures the production workflow learned while publishing working ChatGPT MCP apps through AppDeploy: classify the capability, design the tool surface, generate the MCP transport, deploy it, validate modern + legacy ChatGPT compatibility, and return the exact endpoint to register in Developer Mode.

## Install/use

Install this repository as a builder/personal skill in an environment where the required development tools are available.

Example:

```text
/publish-mcp

Convert this workflow into a tool-only MCP for ChatGPT Web,
deploy it through AppDeploy, validate it, and give me the
registration URL.
```

Natural-language invocation also works:

```text
Convert this skill into a ChatGPT Web capability.
```

## Repository layout

- `SKILL.md` — the builder workflow.
- `references/CHATGPT_MCP_CONTRACT.md` — known-good modern + legacy ChatGPT MCP compatibility contract for AppDeploy.
- `references/APPDEPLOY_GOLDEN_PATH.md` — deployment/validation workflow.
- `references/EVALS.md` — behavior/evaluation scenarios.
- `templates/backend-index.ts` — starter transport template.
- `.punto/` — Punto por Punto Project Pack.

## Important boundary

A Personal Skill is the **builder**. The artifact it creates for normal ChatGPT Web Chat is a **remote MCP app/plugin** with a stable HTTPS endpoint.

A successful AppDeploy build is not, by itself, proof that ChatGPT can register the app. The workflow requires MCP-specific validation and should not declare the plugin ready until the ChatGPT scan succeeds or an external client reproduces the expected contract.

## AppDeploy registration pattern

For the AppDeploy flow validated by this project:

```text
Diagnostic frontend:
https://<app>.v2.appdeploy.ai/

ChatGPT MCP registration:
https://api-v2.appdeploy.ai/app/<APP_ID>/api/mcp
```

## Governance

`main` is canonical. Changes should land through branch → pull request → human review/merge. Project-specific canonical context lives under `.punto/`; the Punto por Punto mother repository registers the project without duplicating its project memory.
