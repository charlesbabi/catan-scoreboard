# Delta: scoreboard-frontend

## MODIFIED Requirements

### Requirement: Levantamiento con Docker Compose
El sistema SHALL incluir un `docker-compose.yml` en la raíz que levanta el backend (puerto 3001) y el frontend (puerto 8090) en una misma red, donde el frontend sirve la UI en el mismo origen y revierte el tráfico de `/api` hacia el servicio backend (reverse proxy), de modo que la UI funciona desde cualquier host. Los datos del backend SHALL persistir en un volumen named de Docker montado en el directorio de datos, independiente del directorio del repositorio, de modo que el JSON persista entre ejecuciones de los contenedores y entre redesplegues del código (rebuild de la imagen o reemplazo del repositorio con un clone nuevo). El archivo de datos no se incluye en el repositorio: se genera al primer arranque con el seed de ejemplo.

#### Scenario: docker compose up
- **WHEN** se ejecuta `docker compose up --build`
- **THEN** la UI es accesible en el puerto 8090 y muestra el scoreboard servido por el backend en el puerto 3001

#### Scenario: Persistencia de datos
- **WHEN** se registra una partida y luego se reinician los contenedores
- **THEN** la partida sigue presente al recargar la UI

#### Scenario: Redeploy no pierde datos
- **WHEN** el código se redespliega en el servidor (rebuild de la imagen o reemplazo del repositorio con un clone nuevo) y se levantan los contenedores
- **THEN** las partidas y temporadas registradas previamente siguen presentes en la UI
