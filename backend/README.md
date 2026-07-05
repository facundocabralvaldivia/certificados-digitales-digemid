# Backend — Certificados DIGEMID (modo demo)

API FastAPI con datos en memoria para el mockup de certificados digitales verificables.

## Ejecutar

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001
```

- Swagger: http://localhost:8001/docs
- Health: http://localhost:8001/api/v1/health

El frontend en `../frontend/` proxea `/api/*` hacia este puerto.
