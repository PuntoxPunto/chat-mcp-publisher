---
id: chat-mcp-publisher-current-state
status: canonical
version: 2
updated: 2026-08-17
---

# Chat MCP Publisher — Estado actual

## Canonical baseline

La inicialización completa de Chat MCP Publisher fue incorporada a `main` mediante PR #1.

Estado canónico observado para esta reconciliación:

`aafa7ff5dd3152e073a3dfd1e2989feacce19a8b`

Ese baseline contiene el Project Pack v1, la builder skill, referencias de compatibilidad MCP, golden path AppDeploy, evals y template de backend.

## Estado funcional observado

Chat MCP Publisher codifica el workflow reusable aprendido al publicar GrillMe para ChatGPT Web:

- clasifica tool-only / widget / stateful;
- diseña tools con schemas, annotations y metadata;
- separa `server/discover` moderno de `initialize` legacy;
- conoce el patrón de gateway AppDeploy para registrar MCPs en ChatGPT Web;
- exige validación más allá de que el hosting reporte deployment exitoso;
- documenta differential debugging contra un MCP conocido que ya funcione.

## Integración con Punto por Punto

- `project_id: chat-mcp-publisher` está registrado en `PuntoxPunto/Punto-x-Punto`;
- el alta fue incorporada mediante Registry PR #33;
- Registry merge SHA observado: `5e45bae0f566e1a6f3e869ac94681d7164102fd0`;
- el Registry referencia `.punto/project.yaml`, `canonical_ref: main` e `identity_node_id: chat-mcp-publisher-identity`;
- no se añadió ninguna relación cross-project implícita durante el registro.

## Alcance canónico actual

- `SKILL.md` con workflow de publicación MCP para ChatGPT Web;
- `references/CHATGPT_MCP_CONTRACT.md`;
- `references/APPDEPLOY_GOLDEN_PATH.md`;
- `references/EVALS.md`;
- `templates/backend-index.ts`;
- README de uso y límites de publicación comunitaria.

## Próximo gate

Usar la skill en el próximo MCP real y reconciliar el golden path sólo cuando nuevas pruebas observadas justifiquen cambios. El Project Pack y el Registry ya pueden utilizarse como contexto canónico del proyecto.
