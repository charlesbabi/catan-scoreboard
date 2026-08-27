# Delta: scoreboard-frontend

## ADDED Requirements

### Requirement: Diseño orientado a móviles y título descriptivo
El título del documento (`<title>` de `frontend/index.html`) SHALL ser descriptivo de la aplicación ("Catan Scoreboard") y SHALL no ser un nombre genérico de desarrollo. La UI SHALL estar orientada a pantallas de celular: en anchos pequeños (≤ 640 px) el ranking (podio y tabla del resto) SHALL mostrarse completo sin desborde horizontal de la ventana, y el contenido de la página SHALL mantener un margen horizontal mínimo respecto a los bordes de la pantalla.

#### Scenario: Título descriptivo
- **WHEN** el usuario carga cualquier ruta de la app
- **THEN** la pestaña del navegador muestra un título descriptivo de la app y no el nombre "frontend"

#### Scenario: Ranking sin desborde en celular
- **WHEN** la app se ve en una pantalla de 390 px de ancho y el ranking tiene 5 o más jugadores
- **THEN** el podio y la tabla del resto se muestran completos, sin scroll horizontal de la ventana

#### Scenario: Margen en los bordes de la pantalla
- **WHEN** la app se ve en una pantalla de celular (≤ 640 px de ancho)
- **THEN** el contenido mantiene un margen horizontal visible respecto a los bordes izquierdo y derecho de la pantalla
