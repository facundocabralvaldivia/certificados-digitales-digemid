# Carpeta `data/`

Datos **estáticos** de la base (aún sin ingesta por API).

| Archivo | Contenido |
|---|---|
| `schema.sql` | DDL de las tablas `Establecimientos` y `Lotes` (SQL Server). |
| `seed.establecimientos.json` | Registros de prueba que se cargan en la tabla `Establecimientos`. |

## Cargar los datos

```powershell
cd backend
docker start cert-sql   # si usas Docker
npm run db:seed         # crea la BD si no existe, aplica schema.sql e inserta el JSON
```

`db:seed` es **idempotente** (usa MERGE): puedes correrlo varias veces sin duplicar.

## UUID de prueba (para los QR / URL de verificación)

| certificadoId | Establecimiento |
|---|---|
| `7433ea89-1872-4ba2-97aa-55492f7f7c34` | BOTICA INKAFARMA 0292 |
| `e8dd2102-006b-4d33-8e8a-834ca8cf6312` | BOTICA INKAFARMA 0301 |
| `0e770904-c91d-4d1f-a51f-845bbed272c2` | BOTICA INKAFARMA 0215 |
| `2ed54eac-674e-4013-a55e-01a5cff93026` | BOTICA SANTA BEATRIZ |
| `7c1e0fa3-dcd2-405a-9991-8b5e092f3bde` | BOTICA BOTICAS Y SALUD |

URL de verificación: `http://localhost:4200/verificar/<certificadoId>`
