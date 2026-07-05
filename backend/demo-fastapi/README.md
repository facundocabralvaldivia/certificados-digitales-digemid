# Demo FastAPI — Certificados DIGEMID (solo QA / presentaciones)

API **FastAPI** con datos **en memoria** para demostrar códigos legacy `DIGEMID-DEMO-*` sin SQL Server ni Polygon real.

> **No es el backend de producción.** El stack productivo vive en [`../`](../README.md) (Node/Express, puerto 8002).

## Cuándo usarlo

- Presentaciones con códigos QR `DIGEMID-DEMO-001` … `005` documentados en el README raíz.
- Desarrollo frontend cuando el backend Node no está levantado (el frontend también tiene fallback local para esos códigos).

## Ejecutar

```powershell
cd backend/demo-fastapi
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001
```

- Swagger: http://localhost:8001/docs
- Health: http://localhost:8001/api/v1/health
- Ejemplo: http://localhost:8001/api/v1/certificados/verificar/DIGEMID-DEMO-001

El frontend proxea `/api/v1/certificados` → `:8001`.

## Notas

- Los datos se regeneran al reiniciar el proceso (seed in-memory).
- Auth interna es un stub permisivo (`evaluador.demo`); no usar en producción.
- `blockchain.py`, `repository.py` y `config.py` son **referencia obsoleta** no conectada al demo activo.
