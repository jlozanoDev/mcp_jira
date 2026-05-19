# MCP Jira + Tempo Server

Servidor MCP que unifica las APIs de **Jira Cloud** (gestión de tareas, sprints, flujos) y **Tempo Timesheets** (control de tiempos) para usar desde cualquier cliente MCP: VS Code, Copilot, Claude Desktop, etc.

## Requisitos

- Node.js 20+ o Docker
- **Jira:** Email + API Token (https://id.atlassian.com/manage/api-tokens)
- **Tempo:** Token Bearer (https://my.tempo.io/app/apimanager)

## Variables de Entorno

Toda la configuración se carga desde variables de entorno. Copia y renombra el archivo de ejemplo:

```bash
cp .env.example .env
# Edita .env con tus credenciales reales
```

| Variable | Obligatoria | Descripción |
|---|---|---|
| `JIRA_BASE_URL` | Sí | URL de instancia Jira (ej: `https://tu-empresa.atlassian.net`) |
| `JIRA_USER_EMAIL` | Sí | Email de la cuenta de Atlassian |
| `JIRA_API_TOKEN` | Sí | Token de API de Atlassian |
| `TEMPO_API_TOKEN` | Sí | Token Bearer de Tempo Cloud v4 |

## Ejecución Local

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Ejecutar con variables de entorno inline
JIRA_BASE_URL=https://tu-empresa.atlassian.net \
JIRA_USER_EMAIL=user@email.com \
JIRA_API_TOKEN=tu-token \
TEMPO_API_TOKEN=tu-tempo-token \
npm start

# O usando .env (requiere dotenv o similar)
export $(grep -v '^#' .env | xargs) && npm start

# Desarrollo con recarga en caliente
npm run dev
```

## Tests

```bash
npm test
```

Ejecuta 13 tests unitarios sobre los casos de uso con repositorios mock.

## Docker

```bash
# Construir imagen
docker build -t mcp-jira-tempo .

# Ejecutar usando .env (recomendado)
docker run -i --rm --env-file .env mcp-jira-tempo
```

### Docker Compose

```bash
# Usando archivo .env
docker compose --env-file .env up
```

## Configuración VS Code / Clientes MCP

Agrega este bloque en `.vscode/mcp.json` o en la configuración global del cliente MCP:

```json
{
  "mcpServers": {
    "jira-tempo": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "--env-file", "/ruta/absoluta/hacia/.env",
        "mcp-jira-tempo"
      ]
    }
  }
}
```

También puedes pasar las variables inline si prefieres no usar archivo:

```json
{
  "mcpServers": {
    "jira-tempo": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "JIRA_BASE_URL=https://tu-empresa.atlassian.net",
        "-e", "JIRA_USER_EMAIL=user@email.com",
        "-e", "JIRA_API_TOKEN=tu-token",
        "-e", "TEMPO_API_TOKEN=tu-tempo-token",
        "mcp-jira-tempo"
      ]
    }
  }
}
```

## Herramientas Disponibles (13 tools)

### Jira — Gestión de Tareas y Flujo

| Tool | Descripción |
|---|---|
| `jira_search_jql` | Búsqueda avanzada JQL con paginación automática |
| `jira_get_assigned_issues` | Issues asignados al usuario actual, ordenados por prioridad |
| `jira_get_issue_details` | Detalle completo: descripción, comentarios, subtareas, enlaces |
| `jira_create_issue` | Crear tarea, bug, story o epic |
| `jira_create_subtask` | Crear subtarea vinculada a un padre |
| `jira_update_issue` | Modificar campos dinámicamente |
| `jira_assign_issue` | Asignar o desasignar usuario |
| `jira_add_comment` | Agregar comentario en texto plano |
| `jira_get_transitions` | Obtener transiciones de estado disponibles |
| `jira_transition_issue` | Cambiar estado (por ID o por nombre) |
| `jira_get_active_sprint_issues` | Issues del sprint activo de un board |

### Tempo — Control de Tiempos

| Tool | Descripción |
|---|---|
| `tempo_log_time` | Registrar horas (en segundos o formato "2h 30m") |
| `tempo_get_user_worklogs` | Consultar registros de tiempo por rango de fechas |

## Arquitectura

```
src/
├── domain/          # Entidades puras + interfaces de repositorio
├── usecases/        # 13 casos de uso atómicos (uno por acción)
└── infrastructure/  # Clientes HTTP (Axios), McpServer (SDK v1.29)
```

Clean Architecture: dominio sin dependencias externas, infraestructura intercambiable.
