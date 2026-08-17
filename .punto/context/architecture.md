---
id: chat-mcp-publisher-architecture
status: canonical
version: 1
updated: 2026-08-17
---

# Chat MCP Publisher — Arquitectura

## Flujo funcional

```text
idea / prompt / skill
        ↓
Chat MCP Publisher
        ↓
tool-only | widget | stateful
        ↓
schemas + annotations + MCP transport
        ↓
AppDeploy
        ↓
modern + legacy validation
        ↓
MCP registration URL
        ↓
ChatGPT Web
```

## Componentes

- `SKILL.md` como workflow constructor;
- `references/CHATGPT_MCP_CONTRACT.md` con contrato de compatibilidad observado;
- `references/APPDEPLOY_GOLDEN_PATH.md` con procedimiento de deployment/diagnóstico;
- `references/EVALS.md` para casos de evaluación;
- `templates/backend-index.ts` como template base para tool-only apps.

## Invariantes

- No confundir Personal Skills/Work con apps MCP disponibles en Chat normal.
- Preferir el arquetipo más pequeño que satisfaga el caso de uso.
- No declarar éxito sólo porque el hosting esté `ready`.
- Separar discovery moderno `server/discover` del fallback legacy `initialize`.
- Para AppDeploy, distinguir frontend diagnóstico del gateway MCP registrado en ChatGPT.
- No publicar secretos ni afirmar directory/publication cuando sólo existe un developer MCP compartible.

## Seguridad y publicación

- El repositorio es público y no debe contener secretos.
- Credenciales o API keys de servicios externos deben permanecer fuera del código fuente.
- La memoria de proyecto publicable se limita al Project Pack específico bajo `.punto/`.
- La existencia de información en el repositorio canónico privado de Punto por Punto no la hace publicable por defecto.

## Relación con Punto por Punto

El repositorio madre registra identidad y referencias canónicas; no obtiene autoridad de escritura sobre este proyecto ni duplica su memoria específica.
