# Tasks: improve-mobile-design

## 1. Título del documento

- [x] 1.1 En `frontend/index.html`: cambiar `<title>frontend</title>` por `<title>Catan Scoreboard</title>` y `<html lang="en">` por `<html lang="es">`

## 2. CSS orientado a móviles (`frontend/src/index.css`)

- [x] 2.1 En `main, .protected`, reemplazar el padding horizontal fijo por `padding-inline: clamp(16px, 4vw, 32px)` (mantener vertical)
- [x] 2.2 En `body`, usar `min-height: 100dvh` con `min-height: 100vh` como fallback previo
- [x] 2.3 Breakpoint `@media (max-width: 640px)`: podio como grid de 3 columnas (`repeat(3, 1fr)`), gap 8px, sin `translateY`, y tipografía reducida (puntos ~1.7rem, oro ~2rem, nombre más chico)
- [x] 2.4 Breakpoint `@media (max-width: 640px)`: tabla del ranking con padding de celda `8px 10px` y fuente 0.92rem (conservar las 4 columnas)

## 3. Verificación

- [x] 3.1 En `frontend/`: `npm test`, `npm run lint` y `npm run build` pasan
- [x] 3.2 Chequeo visual en viewport de 390px: título descriptivo en la pestaña, sin scroll horizontal, podio en 3 columnas legibles, y margen visible en los bordes de la pantalla
