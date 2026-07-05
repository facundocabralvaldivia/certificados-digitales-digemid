"""Servicio del dominio certificados — MODO DEMO (in-memory, sin DB ni Polygon real).

Mantiene la misma interfaz pública que la implementación real (`verificar_publico`,
`metricas`, `listar`, `emitir`, `revocar`, `transacciones_recientes`) pero usa un
almacén en memoria con datos seed. La implementación real (web3.py + PostgreSQL)
vive como referencia en `blockchain.py` / `repository.py`.
"""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from .schemas import (
    AnclajeBlockchain,
    CertificadoAdminRead,
    CertificadoAnexoRead,
    CertificadoEmitirInput,
    CertificadoMetrics,
    CertificadoPublicoRead,
    TecnicoAdjunto,
    TransaccionBlockchainRead,
)

_RED = "polygon-amoy"
_CONTRATO = "0x9A7c4f2eD3b1A0C5e6F8d9B2a1C3E4F5a6B7c8D9"
_EXPLORER = "https://amoy.polygonscan.com"
_PDF_DEMO_DEFAULT = "/certificado-oficial.pdf"

_TECNICO_DEMO_001 = TecnicoAdjunto(
    nombre="Q.F. María Elena Quispe Rojas",
    numero_colegiatura="CQFP 18452",
    horario_atencion="Lunes a sábado, 8:00 – 20:00",
    estado_colegiatura="ACTIVO",
)


def _anexos_default() -> list[CertificadoAnexoRead]:
    return [
        CertificadoAnexoRead(clave="BPA", estado="VIGENTE", url=_PDF_DEMO_DEFAULT),
        CertificadoAnexoRead(clave="BPF", estado="NO_VIGENTE", url=_PDF_DEMO_DEFAULT),
        CertificadoAnexoRead(clave="BPM", estado="VIGENTE", url=_PDF_DEMO_DEFAULT),
        CertificadoAnexoRead(clave="BPDT", estado="NO_REQUIERE"),
    ]


def _anexos_inkafarma() -> list[CertificadoAnexoRead]:
    return [
        CertificadoAnexoRead(
            clave="BPA",
            estado="NO_VIGENTE",
            url="https://www.digemid.minsa.gob.pe/Certificados/Archivos/BPA/2025/BPA_1374-2025.pdf",
        ),
        CertificadoAnexoRead(clave="BPF", estado="NO_REQUIERE"),
        CertificadoAnexoRead(clave="BPM", estado="NO_REQUIERE"),
        CertificadoAnexoRead(clave="BPDT", estado="NO_REQUIERE"),
    ]


def _hash(*partes: str) -> str:
    return "0x" + hashlib.sha256("|".join(partes).encode("utf-8")).hexdigest()


def _explorer_tx(tx_hash: str) -> str:
    return f"{_EXPLORER}/tx/{tx_hash}"


class _CertEntry:
    """Registro interno de un certificado (combina datos públicos + admin)."""

    def __init__(
        self,
        *,
        codigo: str,
        razon_social: str,
        nombre_comercial: str,
        ruc: str,
        direccion: str,
        tecnico: TecnicoAdjunto,
        estado: str,
        integridad: str,
        emitido_por: str,
        dias_emitido: int,
        vigencia_meses: int = 12,
        anclado: bool = True,
        certificado_pdf_url: str = _PDF_DEMO_DEFAULT,
        anexos: Optional[list[CertificadoAnexoRead]] = None,
    ) -> None:
        self.id = secrets.token_hex(8)
        self.codigo = codigo
        self.razon_social = razon_social
        self.nombre_comercial = nombre_comercial
        self.ruc = ruc
        self.direccion = direccion
        self.tecnico = tecnico
        self.estado = estado
        self.integridad = integridad
        self.emitido_por = emitido_por
        self.emitido_en = datetime.now(timezone.utc) - timedelta(days=dias_emitido)
        self.vigente_hasta = self.emitido_en + timedelta(days=30 * vigencia_meses)
        self.anclado = anclado
        self.tx_hash = _hash(codigo, "emision") if anclado else None
        self.numero_bloque = 12_840_000 + (hash(codigo) % 50_000) if anclado else None
        self.gas_usado = 78_421 if anclado else None
        self.data_hash = _hash(razon_social, ruc, estado, tecnico.estado_colegiatura)
        self.anclado_en = self.emitido_en if anclado else None
        self.certificado_pdf_url = certificado_pdf_url
        self.anexos = anexos if anexos is not None else _anexos_default()

    # ── Proyecciones ──────────────────────────────────────────────
    def to_publico(self) -> CertificadoPublicoRead:
        anclaje = AnclajeBlockchain(
            red=_RED,
            contrato=_CONTRATO,
            tx_hash=self.tx_hash or "0x0",
            numero_bloque=self.numero_bloque or 0,
            data_hash=self.data_hash,
            anclado_en=self.anclado_en or self.emitido_en,
            explorer_url=_explorer_tx(self.tx_hash or "0x0"),
        )
        return CertificadoPublicoRead(
            codigo_verificacion=self.codigo,
            razon_social=self.razon_social,
            nombre_comercial=self.nombre_comercial,
            ruc=self.ruc,
            direccion=self.direccion,
            tecnico=self.tecnico,
            estado=self.estado,  # type: ignore[arg-type]
            blockchain=anclaje,
            integridad=self.integridad,  # type: ignore[arg-type]
            emitido_en=self.emitido_en,
            vigente_hasta=self.vigente_hasta,
            consultado_en=datetime.now(timezone.utc),
            certificado_pdf_url=self.certificado_pdf_url,
            anexos=self.anexos,
        )

    def to_admin(self) -> CertificadoAdminRead:
        return CertificadoAdminRead(
            id=self.id,
            codigo_verificacion=self.codigo,
            razon_social=self.razon_social,
            nombre_comercial=self.nombre_comercial,
            ruc=self.ruc,
            estado=self.estado,  # type: ignore[arg-type]
            red=_RED,
            tx_hash=self.tx_hash,
            emitido_en=self.emitido_en,
            emitido_por=self.emitido_por,
        )

    def to_tx(self, tipo: str) -> TransaccionBlockchainRead:
        return TransaccionBlockchainRead(
            tx_hash=self.tx_hash or "0x0",
            tipo=tipo,  # type: ignore[arg-type]
            estado_tx="CONFIRMADA" if self.anclado else "PENDIENTE",
            codigo_verificacion=self.codigo,
            numero_bloque=self.numero_bloque,
            gas_usado=self.gas_usado,
            red=_RED,
            registrado_en=self.anclado_en or self.emitido_en,
            explorer_url=_explorer_tx(self.tx_hash or "0x0"),
        )


def _seed() -> list[_CertEntry]:
    return [
        _CertEntry(
            codigo="DIGEMID-DEMO-001",
            razon_social="Botica San Rafael S.A.C.",
            nombre_comercial="Botica San Rafael",
            ruc="20512345678",
            direccion="Av. Arequipa 1234, Lince, Lima",
            tecnico=_TECNICO_DEMO_001,
            estado="HABILITADO",
            integridad="VERIFICADO",
            emitido_por="evaluador.demo",
            dias_emitido=40,
        ),
        _CertEntry(
            codigo="DIGEMID-DEMO-002",
            razon_social="Distribuidora Farma Económica E.I.R.L.",
            nombre_comercial="Farmacia La Económica",
            ruc="20587654321",
            direccion="Jr. Puno 567, Cercado, Arequipa",
            tecnico=TecnicoAdjunto(
                nombre="T.F. Juan Carlos Mamani Flores",
                numero_colegiatura="CTFP 7741",
                horario_atencion="Lunes a viernes, 9:00 – 18:00",
                estado_colegiatura="INACTIVO",
            ),
            estado="NO_HABILITADO",
            integridad="ALTERADO",
            emitido_por="evaluador.demo",
            dias_emitido=120,
        ),
        _CertEntry(
            codigo="DIGEMID-DEMO-003",
            razon_social="Cadena Salud Total S.A.",
            nombre_comercial="Botica Salud Total",
            ruc="20498765432",
            direccion="Av. La Marina 2050, San Miguel, Lima",
            tecnico=TecnicoAdjunto(
                nombre="Q.F. Andrea Sofía Torres León",
                numero_colegiatura="CQFP 21098",
                horario_atencion="Todos los días, 7:00 – 23:00",
                estado_colegiatura="ACTIVO",
            ),
            estado="HABILITADO",
            integridad="VERIFICADO",
            emitido_por="evaluador.demo",
            dias_emitido=15,
        ),
        _CertEntry(
            codigo="DIGEMID-DEMO-004",
            razon_social="Inversiones Cruz Verde Centro S.A.C.",
            nombre_comercial="Farmacia Cruz Verde Centro",
            ruc="20533221100",
            direccion="Av. Grau 880, Trujillo, La Libertad",
            tecnico=TecnicoAdjunto(
                nombre="T.F. Rosa Inés Huamán Vega",
                numero_colegiatura="CTFP 5532",
                horario_atencion="Lunes a sábado, 8:30 – 21:00",
                estado_colegiatura="INACTIVO",
            ),
            estado="REVOCADO",
            integridad="ALTERADO",
            emitido_por="evaluador.demo",
            dias_emitido=200,
        ),
        _CertEntry(
            codigo="DIGEMID-DEMO-005",
            razon_social="Boticas IP S.A.C.",
            nombre_comercial="Inkfarma 1503",
            ruc="20100070970",
            direccion=(
                "AV. JAVIER PRADO ESTE 2050, LC. M - 239 - 240, PISO 2 - "
                "CC. LA RAMBLA - SAN BORJA LIMA - LIMA - SAN BORJA"
            ),
            tecnico=_TECNICO_DEMO_001,
            estado="HABILITADO",
            integridad="VERIFICADO",
            emitido_por="evaluador.demo",
            dias_emitido=25,
            certificado_pdf_url="/certificado_inkafarma.pdf",
            anexos=_anexos_inkafarma(),
        ),
    ]


class CertService:
    """Servicio demo con almacén en memoria (singleton por proceso)."""

    def __init__(self) -> None:
        self._certs: list[_CertEntry] = _seed()

    # ── PÚBLICO ───────────────────────────────────────────────────
    def verificar_publico(self, codigo: str) -> Optional[CertificadoPublicoRead]:
        entry = next((c for c in self._certs if c.codigo.upper() == codigo.upper()), None)
        return entry.to_publico() if entry else None

    # ── INTERNO ───────────────────────────────────────────────────
    def metricas(self) -> CertificadoMetrics:
        total = len(self._certs)
        activos = sum(
            1 for c in self._certs
            if c.estado == "HABILITADO" and c.tecnico.estado_colegiatura == "ACTIVO"
        )
        revocados = sum(1 for c in self._certs if c.estado == "REVOCADO")
        pendientes = sum(1 for c in self._certs if not c.anclado)
        return CertificadoMetrics(
            total_emitidos=total,
            activos=activos,
            revocados=revocados,
            pendientes_anclaje=pendientes,
        )

    def listar(self, estado: Optional[str], q: Optional[str]) -> list[CertificadoAdminRead]:
        resultado = self._certs
        if estado:
            resultado = [c for c in resultado if c.estado == estado]
        if q:
            term = q.lower()
            resultado = [
                c for c in resultado
                if term in c.razon_social.lower()
                or term in c.nombre_comercial.lower()
                or term in c.ruc
            ]
        return [c.to_admin() for c in resultado]

    def emitir(self, payload: CertificadoEmitirInput, actor: str) -> CertificadoAdminRead:
        codigo = f"DIGEMID-DEMO-{len(self._certs) + 1:03d}"
        entry = _CertEntry(
            codigo=codigo,
            razon_social=f"Establecimiento RUC {payload.ruc}",
            nombre_comercial="Nuevo establecimiento (demo)",
            ruc=payload.ruc,
            direccion="Dirección pendiente de padrón",
            tecnico=TecnicoAdjunto(
                nombre="Técnico por asignar",
                numero_colegiatura="—",
                horario_atencion="—",
                estado_colegiatura="ACTIVO",
            ),
            estado="HABILITADO",
            integridad="VERIFICADO",
            emitido_por=actor,
            dias_emitido=0,
            vigencia_meses=payload.vigencia_meses,
        )
        self._certs.insert(0, entry)
        return entry.to_admin()

    def revocar(self, cert_id: str, motivo: str, actor: str) -> CertificadoAdminRead:
        entry = next((c for c in self._certs if c.id == cert_id), None)
        if entry is None:
            raise ValueError("Certificado no encontrado")
        entry.estado = "REVOCADO"
        entry.integridad = "ALTERADO"
        return entry.to_admin()

    def transacciones_recientes(self) -> list[TransaccionBlockchainRead]:
        txs: list[TransaccionBlockchainRead] = []
        for c in self._certs:
            if c.tx_hash:
                txs.append(c.to_tx("EMISION"))
            if c.estado == "REVOCADO":
                rev = c.to_tx("REVOCACION")
                txs.append(rev)
        # Más recientes primero
        txs.sort(key=lambda t: t.registrado_en, reverse=True)
        return txs[:10]


# Singleton de proceso para el modo demo (mantiene estado entre requests).
_SERVICE_SINGLETON: Optional[CertService] = None


def get_cert_service() -> CertService:
    """FastAPI dependency: provee el servicio demo (in-memory, compartido)."""
    global _SERVICE_SINGLETON
    if _SERVICE_SINGLETON is None:
        _SERVICE_SINGLETON = CertService()
    return _SERVICE_SINGLETON
