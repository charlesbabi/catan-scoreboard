# Proposal: improve-mobile-design

## Why

El scoreboard se consulta principalmente desde el celular durante las partidas, pero hoy el título de la pestaña es solo "frontend" (inútil para identificarla) y el layout es pensado para escritorio: el ranking en tabla desborda en pantallas angostas y el contenido queda pegado a los bordes de la pantalla.

## What Changes

- El título del documento (`<title>` en `frontend/index.html`) pasa de "frontend" a un título descriptivo de la app.
- Diseño orientado a móviles: el ranking (podio y tabla) se adapta a anchos pequeños sin desbordes ni scroll horizontal, y los controles conservan tamaño táctil adecuado.
- Mayor espaciado en los bordes exteriores de la pantalla: padding horizontal responsive (más generoso en móvil) en las vistas pública y protegida.
- Cambios solo de CSS y del `index.html`; no se tocan rutas, componentes ni API.

## Capabilities

### New Capabilities

(ninguna)

### Modified Capabilities

- `scoreboard-frontend`: nuevo requirement de diseño orientado a móviles (layout responsive sin desbordes, espaciado de bordes) y título descriptivo del documento.

## Impact

- Frontend: `frontend/index.html` (título), `frontend/src/index.css` (media queries / espaciado), sin nuevas dependencias.
- Backend, API y Docker: sin cambios.
