# Spec: scoreboard-frontend

## ADDED Requirements

### Requirement: Crear y listar temporadas desde la UI
La pantalla protegida `/nueva-partida` (tras el acceso con la clave de administrador) SHALL incluir una sección de temporadas con un formulario de creación (un solo campo: nombre) y la lista de las temporadas existentes. La UI SHALL cargar las temporadas con `GET /api/seasons` al mostrar la sección y actualizarlas tras cada creación exitosa. Al enviar, la UI SHALL llamar a `POST /api/seasons` incluyendo la clave en el header `X-Admin-Key`. Antes de enviar, la UI SHALL validar client-side que el nombre no esté vacío (sin llamar a la API si lo está). En éxito la UI muestra confirmación, limpia el campo y refresca la lista; en 400 muestra el mensaje de error devuelto por la API; en 401 la UI limpia la clave de la sesión y muestra la pantalla de acceso, igual que las demás operaciones de admin. La pantalla pública (`/`) no incluye esta sección.

#### Scenario: Creación exitosa
- **WHEN** el admin escribe un nombre y envía el formulario
- **THEN** la UI muestra confirmación de éxito, limpia el campo y la lista incluye la nueva temporada

#### Scenario: Nombre vacío
- **WHEN** el admin envía el formulario con el nombre vacío
- **THEN** la UI muestra el error de validación sin llamar a la API

#### Scenario: Error de la API al crear
- **WHEN** la API responde 400 al enviar
- **THEN** la UI muestra el mensaje de error devuelto por la API

#### Scenario: Clave invalidada por la API
- **WHEN** el admin crea una temporada y la API responde 401 (clave cambiada o incorrecta)
- **THEN** la UI limpia la clave de la sesión y muestra la pantalla de acceso
