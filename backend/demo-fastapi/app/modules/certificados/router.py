"""Endpoints FastAPI del módulo certificados.

Dos superficies:
  - PÚBLICA  (sin auth): GET /certificados/verificar/{codigo} — rate-limited + CORS estricto.
  - INTERNA  (con auth): /certificados/admin/* — requiere sesión INTERNO + permiso RBAC.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from .schemas import (
    CertificadoAdminRead,
    CertificadoEmitirInput,
    CertificadoMetrics,
    CertificadoPublicoRead,
    RevocarInput,
    TransaccionBlockchainRead,
)
from .service import CertService, get_cert_service
from .security import requiere_interno  # dependency: valida cookie HttpOnly + rol + permiso

limiter = Limiter(key_func=get_remote_address)

# ── Router PÚBLICO (sin auth) ──────────────────────────────────────
public_router = APIRouter(prefix="/certificados", tags=["certificados-publico"])


@public_router.get("/verificar/{codigo}", response_model=CertificadoPublicoRead)
@limiter.limit("30/minute")  # protección anti-scraping / fuerza bruta de códigos
async def verificar(
    request: Request,
    codigo: str,
    service: CertService = Depends(get_cert_service),
) -> CertificadoPublicoRead:
    cert = service.verificar_publico(codigo)
    if cert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado no encontrado")
    return cert


# ── Router INTERNO (auth obligatoria) ─────────────────────────────
admin_router = APIRouter(
    prefix="/certificados/admin",
    tags=["certificados-interno"],
    dependencies=[Depends(requiere_interno)],
)


@admin_router.get("/metricas", response_model=CertificadoMetrics)
async def metricas(service: CertService = Depends(get_cert_service)) -> CertificadoMetrics:
    return service.metricas()


@admin_router.get("", response_model=list[CertificadoAdminRead])
async def listar(
    estado: str | None = Query(None),
    q: str | None = Query(None, max_length=120),
    service: CertService = Depends(get_cert_service),
) -> list[CertificadoAdminRead]:
    return service.listar(estado=estado, q=q)


@admin_router.post("/emitir", response_model=CertificadoAdminRead, status_code=201)
async def emitir(
    payload: CertificadoEmitirInput,
    service: CertService = Depends(get_cert_service),
    actor: str = Depends(requiere_interno),
) -> CertificadoAdminRead:
    return service.emitir(payload, actor=actor)


@admin_router.post("/{cert_id}/revocar", response_model=CertificadoAdminRead)
async def revocar(
    cert_id: str,
    payload: RevocarInput,
    service: CertService = Depends(get_cert_service),
    actor: str = Depends(requiere_interno),
) -> CertificadoAdminRead:
    return service.revocar(cert_id, motivo=payload.motivo, actor=actor)


@admin_router.get("/blockchain/transacciones", response_model=list[TransaccionBlockchainRead])
async def transacciones(
    service: CertService = Depends(get_cert_service),
) -> list[TransaccionBlockchainRead]:
    return service.transacciones_recientes()
