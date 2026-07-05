"""Esquemas Pydantic del módulo certificados — 1:1 con los interfaces TS de
`src/app/core/models/certificados.models.ts`."""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

EstadoCertificado = Literal["HABILITADO", "NO_HABILITADO", "REVOCADO"]
EstadoColegiatura = Literal["ACTIVO", "INACTIVO"]
RedPolygon = Literal["polygon-mainnet", "polygon-amoy"]
ResultadoIntegridad = Literal["VERIFICADO", "ALTERADO", "NO_ANCLADO"]
EstadoTx = Literal["PENDIENTE", "CONFIRMADA", "FALLIDA"]
EstadoAnexo = Literal["VIGENTE", "NO_VIGENTE", "NO_REQUIERE"]


class TecnicoAdjunto(BaseModel):
    nombre: str
    numero_colegiatura: str
    horario_atencion: str
    estado_colegiatura: EstadoColegiatura


class CertificadoAnexoRead(BaseModel):
    clave: str
    estado: EstadoAnexo
    url: Optional[str] = None


class AnclajeBlockchain(BaseModel):
    red: RedPolygon
    contrato: str
    tx_hash: str
    numero_bloque: int
    data_hash: str
    anclado_en: datetime
    explorer_url: str


class CertificadoPublicoRead(BaseModel):
    """Respuesta del endpoint público. Solo los 8 campos institucionales +
    anclaje + integridad. Sin PII adicional (Ley 29733)."""
    codigo_verificacion: str
    razon_social: str
    nombre_comercial: str
    ruc: str
    direccion: str
    tecnico: TecnicoAdjunto
    estado: EstadoCertificado
    blockchain: AnclajeBlockchain
    integridad: ResultadoIntegridad
    emitido_en: datetime
    vigente_hasta: Optional[datetime] = None
    consultado_en: datetime
    certificado_pdf_url: str
    anexos: list[CertificadoAnexoRead]


class CertificadoAdminRead(BaseModel):
    id: str
    codigo_verificacion: str
    razon_social: str
    nombre_comercial: str
    ruc: str
    estado: EstadoCertificado
    red: RedPolygon
    tx_hash: Optional[str] = None
    emitido_en: Optional[datetime] = None
    emitido_por: str


class CertificadoMetrics(BaseModel):
    total_emitidos: int
    activos: int
    revocados: int
    pendientes_anclaje: int


class TransaccionBlockchainRead(BaseModel):
    tx_hash: str
    tipo: Literal["EMISION", "REVOCACION"]
    estado_tx: EstadoTx
    codigo_verificacion: str
    numero_bloque: Optional[int] = None
    gas_usado: Optional[int] = None
    red: RedPolygon
    registrado_en: datetime
    explorer_url: str


class CertificadoEmitirInput(BaseModel):
    ruc: str = Field(..., min_length=11, max_length=11, pattern=r"^\d{11}$")
    vigencia_meses: int = Field(..., ge=1, le=60)


class RevocarInput(BaseModel):
    motivo: str = Field(..., min_length=5, max_length=500)
