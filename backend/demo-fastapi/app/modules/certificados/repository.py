# REFERENCIA OBSOLETA: no importado por el demo in-memory. Producción usa SQL Server vía Node (../src/db/).
"""Acceso READ-ONLY a la base de datos institucional de DIGEMID.

Este módulo SOLO lee del padrón institucional (establecimientos, técnicos,
estado de colegiatura). La emisión escribe únicamente en la tabla propia de
certificados; nunca modifica el padrón fuente.

Para garantizar el read-only, la sesión usada aquí debe provenir de un usuario
de BD con privilegios SELECT sobre las vistas del padrón (ver guía de seguridad).
"""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


class CertRepository:
    def __init__(self, db_readonly: Session, db_certificados: Session) -> None:
        self._ro = db_readonly          # conexión SELECT-only al padrón DIGEMID
        self._cert = db_certificados    # conexión a la tabla propia de certificados

    def obtener_establecimiento_por_ruc(self, ruc: str) -> Optional[dict[str, Any]]:
        """Lee datos vigentes del establecimiento y su técnico desde el padrón."""
        row = self._ro.execute(
            text(
                """
                SELECT razon_social, nombre_comercial, ruc, direccion,
                       tecnico_nombre, tecnico_colegiatura, tecnico_horario,
                       tecnico_estado_colegiatura, estado_habilitacion
                FROM padron.v_establecimientos_autorizados
                WHERE ruc = :ruc
                """
            ),
            {"ruc": ruc},
        ).mappings().first()
        return dict(row) if row else None

    def obtener_certificado_por_codigo(self, codigo: str) -> Optional[dict[str, Any]]:
        row = self._cert.execute(
            text(
                """
                SELECT * FROM certificados.certificado
                WHERE codigo_verificacion = :codigo
                """
            ),
            {"codigo": codigo},
        ).mappings().first()
        return dict(row) if row else None

    def listar(self, estado: Optional[str], q: Optional[str]) -> list[dict[str, Any]]:
        # Parametrizado — sin concatenación de SQL (anti-inyección).
        sql = "SELECT * FROM certificados.certificado WHERE 1=1"
        params: dict[str, Any] = {}
        if estado:
            sql += " AND estado = :estado"
            params["estado"] = estado
        if q:
            sql += " AND (razon_social ILIKE :q OR nombre_comercial ILIKE :q OR ruc LIKE :q)"
            params["q"] = f"%{q}%"
        sql += " ORDER BY emitido_en DESC NULLS LAST LIMIT 200"
        rows = self._cert.execute(text(sql), params).mappings().all()
        return [dict(r) for r in rows]
