"""Dependencias de seguridad — MODO DEMO.

En el proyecto real, `requiere_interno` valida la cookie HttpOnly + JWT y el
permiso RBAC contra `app.core.security`. Aquí, para el mockup standalone, se
reemplaza por un stub permisivo que registra auditoría. El gating real de la UI
lo hace el `roleGuard` del frontend (login demo → rol INTERNO).
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import Request

audit_log = logging.getLogger("certificados.audit")


def requiere_interno(request: Request) -> str:
    """Stub de auth para el demo. Devuelve el identificador del actor y registra
    el acceso para auditoría forense (mismo espíritu que en producción)."""
    actor = "evaluador.demo"
    audit_log.info(
        "acceso_panel_certificados actor=%s ruta=%s metodo=%s ip=%s client_info=%s ts=%s",
        actor,
        request.url.path,
        request.method,
        request.client.host if request.client else None,
        request.headers.get("X-Client-Info"),
        datetime.now(timezone.utc).isoformat(),
    )
    return actor
