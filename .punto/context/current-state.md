---
id: chat-mcp-publisher-current-state
status: canonical
version: 3
updated: 2026-08-18
---

# Chat MCP Publisher — Estado actual

## Canonical baseline

Chat MCP Publisher continúa registrado como `project_id: chat-mcp-publisher` en `PuntoxPunto/Punto-x-Punto`, con `canonical_ref: main` e `identity_node_id: chat-mcp-publisher-identity`.

La inicialización fue incorporada mediante PR #1; el registro madre mediante PR #33.

## Evolución V2 observada

Después de GrillMe, el publisher fue usado como base conceptual para una serie de MCPs reales desplegados en AppDeploy:

- `handoff-yocioi` — tool-only/read-only;
- `loopme-xkc1dm` — estado de workflow portable, sin persistencia server-side;
- `punto-reach-r9sm6m` — capability router, fallbacks, provenance y health probes reales;
- `teach-028aih` — aprendizaje multi-chat mediante `conversation+portable-export`;
- `wayfinder-cvsc3n` — mapa portable + frontera explícita entre MCP y herramientas GitHub/Linear del host;
- `prototype-noa6ix` — primer widget de prototipos, HTML generado aislado/sandboxed;
- `architecture-review-e4xem3` — reporte estático sanitizado en widget + exploración posterior.

Todos esos deployments alcanzaron estado READY con los QA diseñados para su superficie y 100% de cobertura de endpoints backend declarados. En Punto Reach, el QA final ejecutó además una búsqueda real mediante `tools/call` sobre el MCP remoto de Exa, no sólo `initialize/tools/list`.

## Nuevos patrones canónicos

La skill ahora codifica adicionalmente:

1. **Capability routing** — herramientas orientadas a capacidades, providers preferidos + fallbacks y provenance de `backend_used/attempts`.
2. **Doctor semántico** — transporte MCP, provider health y capability-call health son estados distintos; instalación/configuración no cuenta como prueba suficiente.
3. **Widgets MCP** — recursos `ui://`, `text/html;profile=mcp-app`, render tool con `ui.resourceUri`/`openai/outputTemplate`, MCP Apps bridge y aislamiento de HTML generado según el threat model.
4. **Portable before persistent** — conversación + export/import antes de almacenamiento server-side.
5. **Auth boundary** — el auth propio del hosting no se considera automáticamente OAuth/OIDC compatible con ChatGPT MCP; no se habilita persistencia privada multiusuario hasta probar identidad de punta a punta.
6. **Host-tool boundary** — un MCP de comportamiento puede orquestar GitHub/Linear/web tools disponibles en el host, pero no debe fingir que posee o ejecutó esas herramientas.

La referencia detallada vive en `references/PATTERNS_V2.md`.

## Contrato ChatGPT/AppDeploy

El golden transport original sigue vigente y no se reemplazó:

- `server/discover` moderno `2026-07-28`;
- `initialize` legacy separado;
- metadata y headers modernos consistentes;
- `GET /api/mcp` 405 intencional;
- `POST /api/mcp` como superficie principal;
- gateway AppDeploy validado: `https://api-v2.appdeploy.ai/app/<APP_ID>/api/mcp`.

## Integración con Punto por Punto

No se modifica el Registry ni se agrega ninguna relación cross-project implícita con esta actualización. El proyecto continúa canónico bajo su entrada existente.

## Próximo gate

Usar estos patrones V2 para las próximas publicaciones y sólo promover a V3 cuando nuevas pruebas observadas justifiquen cambios de arquitectura o transporte. La confirmación de registro/invocación dentro de ChatGPT continúa siendo un gate separado del QA de hosting.
