# Backend de producción — Certificados DIGEMID (Web3)

API **Node.js / Express / TypeScript** con SQL Server, Merkle Tree y anclaje en Polygon (Amoy / PoS).

> **No confundir** con el demo FastAPI en [`demo-fastapi/`](demo-fastapi/README.md) (puerto 8001, datos en memoria, solo QA).

## Requisitos

- Node.js 20+
- SQL Server (local o Docker `cert-sql`)
- `.env` a partir de [`.env.example`](.env.example) — ver [`DATOS_SENSIBLES.md`](DATOS_SENSIBLES.md)

## Ejecutar

```powershell
cd backend
npm install
npm run db:seed      # primera vez: crea BD, aplica schema.sql e inserta seed
npm run dev          # API en http://localhost:8002
```

- Health: http://localhost:8002/api/v1/health
- Verificación pública: `GET /api/v1/verificacion/{uuid}`
- Panel admin: `GET /api/v1/admin/metricas`, `/admin/establecimientos`, `/admin/transacciones`

El frontend en `../frontend/` proxea `/api/v1/admin`, `/api/v1/verificacion`, `/api/v1/jobs` y `/api/v1/blockchain` hacia este puerto.

## Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor con recarga (tsx watch) |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm run start` | Ejecuta `dist/main.js` |
| `npm run db:seed` | Aplica `data/schema.sql` + seed JSON |
| `npm run deploy:contract` | Despliega `CertificateAnchor` en Polygon |
| `npm run anchor` | Ancla manualmente el lote pendiente |
| `npm run typecheck` | Verificación de tipos sin emitir |

## Estructura

```
backend/
├── src/              ← API Express (producción)
├── contracts/        ← Solidity CertificateAnchor
├── data/             ← schema.sql + seed JSON (SQL Server)
├── demo-fastapi/     ← Demo Python in-memory (puerto 8001, no producción)
├── package.json
└── .env.example
```
