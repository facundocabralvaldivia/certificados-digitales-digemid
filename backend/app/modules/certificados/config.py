"""Configuración del módulo de certificados (credenciales Polygon, contrato).

Toda la configuración se lee de variables de entorno. NUNCA hardcodear la clave
privada ni el RPC. Ver `.env.example`.
"""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class CertSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CERT_", env_file=".env", extra="ignore")

    # ── Red Polygon ────────────────────────────────────────────────
    # Mainnet en producción, Amoy en desarrollo.
    polygon_rpc_url: str = Field(..., description="Endpoint RPC del proveedor contratado")
    polygon_chain_id: int = Field(137, description="137 = mainnet, 80002 = amoy")
    polygon_network_label: str = Field("polygon-mainnet")

    # ── Smart contract de anclaje ──────────────────────────────────
    contract_address: str = Field(..., description="Dirección 0x… del contrato de certificados")

    # ── Clave privada del emisor (custodia server-side) ────────────
    # En producción debe venir de un KMS/Vault, NO de un .env plano.
    issuer_private_key: str = Field(..., description="Clave privada del wallet emisor (sensible)")

    # ── Explorer ───────────────────────────────────────────────────
    explorer_base_url: str = Field("https://polygonscan.com")

    # ── Seguridad de la API pública ────────────────────────────────
    public_rate_limit: str = Field("30/minute", description="Límite por IP en /verificar")
    cors_public_origins: str = Field("https://certificados.digemid.gob.pe")


@lru_cache
def get_cert_settings() -> CertSettings:
    return CertSettings()
