# Agenda Sala Faymex

Sistema de reserva de sala de reuniones para Faymex. Permite a los empleados ver disponibilidad y reservar la sala de reuniones de Casa Matriz en bloques de 30 minutos.

**Producción**: https://agenda-sala-faymex-production.up.railway.app/

## Funcionalidades

### Para empleados
- **Vista semanal** del calendario (lunes a viernes, 08:00 a 17:30)
- **Buscar y seleccionarse** por nombre o apellido, agrupados por departamento (se recuerda entre sesiones)
- **Reservar** haciendo click en un slot disponible (bloques de 30 min a 2 horas)
- **Identidad fija**: al reservar, el sistema usa tu identidad seleccionada — no se puede reservar como otra persona
- **Cancelar** sus propias reservas (con doble confirmación)
- **Prioridad jerárquica**: un empleado de mayor nivel puede desplazar la reserva de uno de menor nivel
- **Indicador de hora actual** (línea roja en el día de hoy)
- **Slots pasados** visualmente rayados (no se puede reservar en el pasado)
- **Leyenda de colores**: rojo = mis reservas, gris oscuro = reservas de otros
- **Detalle de reserva**: muestra nombre, cargo, departamento, fecha, horario y asunto
- **Auto-actualización** cada 30 segundos
- **Responsive mobile**: columna de horas sticky, auto-scroll al día de hoy, 3 días visibles

### Niveles de jerarquía (prioridad de reserva)
| Nivel | Descripción | Puede desplazar a |
|-------|-------------|-------------------|
| 1 | Gerente General / Director Ejecutivo | Niveles 2, 3, 4 |
| 2 | Gerentes | Niveles 3, 4 |
| 3 | Jefaturas | Nivel 4 |
| 4 | Empleados | Nadie |

> Si dos personas del mismo nivel quieren el mismo horario, tiene prioridad quien reservó primero.

### Para administradores
Acceder desde el botón **Admin** (arriba a la derecha). Protegido por contraseña via header HTTP.

- **Agregar empleados** uno por uno (con validación de email único)
- **Carga masiva** desde Excel (.xlsx) con columnas: `nombre`, `email`, `cargo`, `departamento`, `nivel_jerarquia`
  - Validación atómica: si alguna fila tiene error, no se crea ningún empleado
  - Validación de formato de email
- **Desactivar/Activar** empleados (soft delete)
- **Eliminar** empleados permanentemente (con confirmación)

### Notificaciones por correo
- **Confirmación** al reservar (via Resend API)
- **Anulación** cuando alguien de mayor jerarquía desplaza tu reserva

## Stack técnico

| Componente | Tecnología |
|------------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 (async), aiosqlite |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| Base de datos | SQLite (con volumen persistente en Railway) |
| Deploy | Railway (Dockerfile multi-stage) |
| Email | Resend API (sala@faymex.cl) |

## Estructura del proyecto

```
Agenda Sala Faymex/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + SPA serving
│   │   ├── config.py            # Variables de entorno
│   │   ├── database.py          # SQLAlchemy async engine
│   │   ├── models.py            # Employee (unique email), Reservation
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── services.py          # Lógica de negocio (reservas, validaciones, prioridad)
│   │   ├── email_service.py     # Envío de correos via Resend API
│   │   ├── seed.py              # Datos iniciales
│   │   └── routers/
│   │       ├── employees.py     # GET /api/employees
│   │       ├── reservations.py  # CRUD reservas + slots
│   │       └── admin.py         # Panel admin (auth por header X-Admin-Password)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Componente principal
│   │   ├── api.ts               # Cliente API (admin auth via header)
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── index.css            # Tailwind + animaciones custom
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── EmployeeSelector.tsx  # Buscador agrupado por departamento
│   │       ├── WeekNavigator.tsx
│   │       ├── DayHeader.tsx         # Headers con mes abreviado
│   │       ├── WeekCalendar.tsx      # Grilla semanal + auto-scroll mobile
│   │       ├── ReservationModal.tsx  # Crear reserva (identidad fija)
│   │       ├── ReservationDetail.tsx # Ver/cancelar/override + departamento
│   │       ├── AdminPanel.tsx
│   │       └── Toast.tsx             # Notificaciones con animación slideIn
│   ├── public/
│   │   ├── logo-faymex.png
│   │   └── favicon.png
│   └── package.json
├── Dockerfile                   # Multi-stage: node build + python serve
├── .env.example
└── README.md
```

## API Endpoints

### Públicos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/employees` | Lista empleados activos |
| GET | `/api/reservations/slots` | Lista de horarios disponibles |
| GET | `/api/reservations/date/{date}` | Reservas de un día |
| GET | `/api/reservations/week?start_date=YYYY-MM-DD` | Reservas de la semana |
| POST | `/api/reservations` | Crear reserva (con lógica de prioridad) |
| DELETE | `/api/reservations/{id}?employee_id=N` | Cancelar reserva propia |

### Admin (requieren header `X-Admin-Password`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/login` | Verificar contraseña |
| GET | `/api/admin/employees` | Todos los empleados |
| POST | `/api/admin/employees` | Crear empleado |
| PUT | `/api/admin/employees/{id}` | Editar empleado |
| PATCH | `/api/admin/employees/{id}/toggle` | Activar/desactivar |
| DELETE | `/api/admin/employees/{id}` | Eliminar permanentemente |
| POST | `/api/admin/employees/bulk` | Carga masiva Excel |

## Desarrollo local

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8050

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
# El proxy de Vite redirige /api → localhost:8050
```

## Configuración en Railway

### Variables de entorno
| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:////data/agenda_sala.db` |
| `ADMIN_PASSWORD` | Contraseña del panel admin |
| `RESEND_API_KEY` | API key de Resend para emails |
| `SMTP_FROM` | Email remitente (sala@faymex.cl) |

### Volumen
- **Nombre**: `agenda-sala-faymex-volume`
- **Mount path**: `/data`
- **Propósito**: Persistir la base de datos SQLite entre deploys

## Deploy

```bash
# Desde el directorio del proyecto
railway up --detach
```

El deploy es automático via Dockerfile multi-stage:
1. Stage 1: Compila el frontend React (node)
2. Stage 2: Sirve backend FastAPI + frontend estático (python)

## Empleados cargados

39 empleados de Casa Matriz:
- 2 Nivel 1 (Gerente General + Director Ejecutivo)
- 3 Nivel 2 (Gerentes)
- 13 Nivel 3 (Jefaturas)
- 21 Nivel 4 (Empleados)

### Formato Excel para carga masiva
| nombre | email | cargo | departamento | nivel_jerarquia |
|--------|-------|-------|-------------|----------------|
| Juan Pérez | jperez@faymex.cl | Jefe de Bodega | Bodega | 3 |
