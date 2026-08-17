---
id: chat-mcp-publisher-current-state
status: canonical
version: 1
updated: 2026-08-17
---

# Chat MCP Publisher — Estado actual

## Canonical baseline

El repositorio fue bootstrappeado en `main` con un README mínimo en:

`4b0d0ff5125648c2fd2265e21e941d61cd839333`

Ese commit existe únicamente para crear una revisión canónica desde la cual pueda seguirse el flujo branch → PR.

## Propuesta activa

La inicialización completa del proyecto se prepara en:

`agent/init-chat-mcp-publisher`

Mientras esa branch no sea mergeada a `main`, el Project Pack y la implementación publicados allí tienen provenance `change_proposal` y no habilitan el alta canónica en el Project Registry.

## Alcance de la propuesta

- builder skill `chat-mcp-publisher`;
- contrato MCP moderno + legacy utilizado para ChatGPT Web;
- golden path AppDeploy;
- template TypeScript para backend MCP;
- evals para tool-only, widgets, fallos de registro y publicación comunitaria.

## Registro Punto por Punto

El proyecto todavía no debe considerarse registrado en `PuntoxPunto/Punto-x-Punto` hasta que este Project Pack exista en `main` y pase `pp:project-health` con scope `pack`.

## Próximo gate

Revisión humana y merge de la PR de inicialización. Después del merge, ejecutar `pp:project-register` desde el SHA canónico y proponer el alta en `projects/registry.json`.
