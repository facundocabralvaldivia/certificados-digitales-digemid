# Mockup — Certificados Digitales DIGEMID (standalone)

Aplicación **autónoma y ejecutable** para demostrar el módulo de **certificados digitales verificables** de DIGEMID: verificación pública (vía QR), panel administrativo interno y respaldo blockchain (Polygon, **simulado en modo demo**).

> Este es un **mockup standalone** extraído del diseño del sistema DICER. **No** depende de DICER-FRONT ni de su backend. Reutiliza las convenciones documentadas en `frontend/AGENTS.md`, pero corre por sí solo con datos en memoria (sin PostgreSQL ni Polygon real).

---

## Estructura del proyecto

```
Blockchain Proyect/
├── README.md
├── backend/          ← FastAPI (modo demo in-memory)
└── frontend/         ← Angular 18 (standalone, Signals)
```

---

## ¿Qué se puede ver?

| URL | Descripción |
|-----|-------------|
| `http://localhost:4200/verificar/DIGEMID-DEMO-001` | Verificación **pública** (sin login): establecimiento HABILITADO + integridad VERIFICADO |
| `http://localhost:4200/verificar/DIGEMID-DEMO-002` | Caso negativo: **NO HABILITADO** + integridad **ALTERADO** + colegiatura INACTIVO |
| `http://localhost:4200/auth/login` | Login **demo** (entra como evaluador INTERNO con un clic) |
| `http://localhost:4200/app/certificados` | **Panel admin**: métricas, tabla filtrable, log blockchain y preview |

Códigos de prueba: `DIGEMID-DEMO-001` … `DIGEMID-DEMO-004`.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 18 (standalone components, Signals, control flow nuevo) |
| Estilos | Tailwind CSS 3.4 (tokens `dicer-cert-*`) |
| Backend | FastAPI (modo demo in-memory) + slowapi (rate limiting) |
| Blockchain | Simulada (referencia real en `backend/app/modules/certificados/blockchain.py`) |
| Package manager | **pnpm** (frontend) · Python 3.12 (backend) |

---

## Cómo ejecutar (Windows / PowerShell)

Necesitas **dos terminales**: una para el backend y otra para el frontend.

### 1) Backend (FastAPI) — puerto 8001

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001
```

Verifica: http://localhost:8001/docs · http://localhost:8001/api/v1/certificados/verificar/DIGEMID-DEMO-001

> Si PowerShell bloquea la activación del venv:
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

### 2) Frontend (Angular) — puerto 4200

```powershell
cd frontend
pnpm install
pnpm start
```

Abre: **http://localhost:4200/verificar/DIGEMID-DEMO-001**

> Si pnpm ignora build scripts (`ERR_PNPM_IGNORED_BUILDS`):
> ```powershell
> node node_modules/@angular/cli/bin/ng.js serve --proxy-config proxy.conf.json --host 0.0.0.0 --port 4200
> ```

El dev server proxea `/api/*` → `http://localhost:8001` (ver `frontend/proxy.conf.json`).

---

## Flujo de demo sugerido

1. Abre `http://localhost:4200/verificar/DIGEMID-DEMO-001` → spinner → ficha del establecimiento, **badge HABILITADO ✅**, indicador de integridad **VERIFICADO 🔒**, bloque blockchain expandible.
2. Abre `http://localhost:4200/verificar/DIGEMID-DEMO-002` → **NO HABILITADO ❌** + **ALTERADO ⚠️** + colegiatura **Inactivo**.
3. Ve a `http://localhost:4200/auth/login` → clic en *"Ingresar como evaluador (demo)"* → entra al **panel** (`/app/certificados`).
4. En el panel: 4 tarjetas de métricas, filtros por estado, búsqueda y log de transacciones. Clic en **"Ver / Previsualizar"** → modal con el certificado + QR.

---

## Detalle de carpetas

### `frontend/`

```
frontend/
├── package.json · angular.json · tsconfig*.json
├── tailwind.config.js · postcss.config.js · proxy.conf.json
├── pnpm-workspace.yaml
├── AGENTS.md · CLAUDE.md
└── src/
    ├── main.ts · index.html · styles.css
    ├── environments/
    └── app/
        ├── core/          ← guards, interceptors, models, services, stores
        └── modules/       ← auth, shell, certificados
```

### `backend/`

```
backend/
├── main.py
├── requirements.txt · .env(.example)
└── app/modules/certificados/
    ├── router.py · schemas.py · service.py (demo in-memory)
    ├── security.py
    └── blockchain.py · repository.py · config.py
```

---

## Endpoints del backend (modo demo)

Base: `/api/v1`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/certificados/verificar/{codigo}` | Pública (rate-limited 30/min) | Verificación pública |
| GET | `/certificados/admin/metricas` | Interna | Métricas del dashboard |
| GET | `/certificados/admin?estado=&q=` | Interna | Listado filtrable |
| POST | `/certificados/admin/emitir` | Interna | Emitir (simula anclaje) |
| POST | `/certificados/admin/{id}/revocar` | Interna | Revocar |
| GET | `/certificados/admin/blockchain/transacciones` | Interna | Log de transacciones |
| GET | `/api/v1/health` | — | Healthcheck |

---

## Notas

- **Modo demo:** los datos viven en memoria (`backend/app/modules/certificados/service.py`). Al reiniciar el backend se regeneran los 4 certificados seed.
- **Auth demo:** el login no valida contraseña; habilita el rol INTERNO. En producción se usa cookie HttpOnly + JWT (ver `security.py`).
- **Blockchain demo:** los `tx_hash`, bloques y hashes son deterministas/simulados. La implementación real está documentada en `blockchain.py`.
- **Seguridad:** no se commitea `.env` con claves reales (`backend/.env` solo tiene valores dummy).
