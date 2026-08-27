# Design: improve-mobile-design

## Context

El scoreboard se ve principalmente en celulares. Estado actual:

- `frontend/index.html` tiene `<title>frontend</title>` (nombre genérico del scaffold).
- `frontend/src/index.css`: `main, .protected` con `max-width: 860px; padding: 28px 16px 56px` (margen horizontal fijo y justo).
- El podio usa `flex-wrap: wrap` con `min-width: 170px` por tarjeta: en pantallas angostas queda 1 tarjeta por fila con tipografía de escritorio (puntos a 2.6rem), y el podio de oro conserva un `translateY(-10px)`.
- La tabla del ranking tiene 4 columnas con `padding: 10px 16px` por celda, pensado para escritorio.
- `body { min-height: 100vh }` (ignora la barra del navegador móvil) y `<html lang="en">` pese a que toda la UI está en español.

## Goals / Non-Goals

**Goals:**
- Título de pestaña descriptivo.
- Ranking (podio + tabla) legible y sin desbordes a ≤ 640 px.
- Margen horizontal fluido y visible en los bordes de la pantalla.

**Non-Goals:**
- No se tocan componentes, rutas, librerías ni API.
- No se ocultan columnas del ranking (la spec exige mostrar puntaje, partidas y victorias).
- No se introduce CSS framework ni nueva dependencia.
- No se rediseña la vista protegida más allá del padding compartido.

## Decisions

1. **Título: `Catan Scoreboard`** en `frontend/index.html` (y `lang="es"`). Alternativa descartada: subtítulo largo ("Catan Scoreboard — Ranking de partidas"), innecesario para una pestaña.
2. **Padding de bordes fluido**: `main, .protected { padding-inline: clamp(16px, 4vw, 32px) }`. Una línea, responsive sin media query, y resuelve la falta de espaciado exterior en todos los tamaños. Alternativa descartada: valor fijo (24px) + media query — más código para menos rango.
3. **Podio en móvil (≤ 640px)**: pasa a `grid` de 3 columnas (`repeat(3, 1fr)`), gap 8px, sin `translateY`, puntos a ~1.7rem (oro ~2rem) y nombre más chico. Mantiene el podio "de un vistazo" en pantalla chica. Alternativa descartada: apilar las tarjetas en vertical (pierde el efecto podio y agrega scroll).
4. **Tabla en móvil**: se conservan las 4 columnas; solo se reduce padding de celda (`8px 10px`) y tamaño de fuente (0.92rem) bajo el breakpoint.
5. **`min-height: 100dvh`** con fallback `100vh`: el fondo a pantalla completa respeta la chrome de navegadores móviles.

## Risks / Trade-offs

- [Puntajes de 3 dígitos desborden el podio en 3 columnas] → tipografía reducida en el breakpoint; si aun así aprieta, `overflow-wrap: anywhere` en `.podium-points`.
- [`4vw` en tablets dé un margen grande] → el tope de `clamp()` (32px) lo acota.
- [Cambio solo de CSS, sin lógica que testeear] → verificación con `npm run build` (frontend) y chequeo visual en viewport de 390px; los escenarios de la spec son visuales.

## Migration Plan

Frontend estático: rebuild del contenedor (`docker compose up --build` o `vite build`) y listo. Rollback: revertir el commit. Sin cambios de datos, API o contratos.

## Open Questions

(ninguna)
