"""Integración con Polygon vía web3.py.

Responsabilidades:
  - Calcular el hash canónico (keccak256) de los datos del certificado.
  - Anclar ese hash en el smart contract (emisión).
  - Recuperar el hash anclado y compararlo (verificación de integridad).

La clave privada del emisor NUNCA se loguea ni se expone. Se carga desde
configuración (idealmente respaldada por un KMS/Vault en producción).
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from eth_account import Account
from web3 import Web3
from web3.middleware import geth_poa_middleware

from .config import CertSettings
from .schemas import AnclajeBlockchain, ResultadoIntegridad


# Campos canónicos que entran al hash, en orden fijo. Cambiar este orden o el
# conjunto de campos invalida todos los certificados previos: NO modificar sin
# una migración de versionado de esquema.
CAMPOS_CANONICOS = (
    "razon_social",
    "nombre_comercial",
    "ruc",
    "direccion",
    "tecnico_nombre",
    "tecnico_colegiatura",
    "tecnico_horario",
    "tecnico_estado_colegiatura",
    "estado",
)


def calcular_data_hash(datos: dict[str, Any]) -> str:
    """keccak256 sobre la serialización canónica (claves ordenadas, sin espacios)
    de los campos institucionales. Determinista e independiente del orden de
    inserción del dict."""
    canonico = {k: str(datos[k]) for k in CAMPOS_CANONICOS}
    payload = json.dumps(canonico, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return Web3.keccak(text=payload).hex()


class PolygonClient:
    def __init__(self, settings: CertSettings, abi: list[dict]) -> None:
        self._settings = settings
        self._w3 = Web3(Web3.HTTPProvider(settings.polygon_rpc_url))
        # Polygon usa PoA: middleware necesario para parsear los bloques.
        self._w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        self._account = Account.from_key(settings.issuer_private_key)
        self._contract = self._w3.eth.contract(
            address=Web3.to_checksum_address(settings.contract_address),
            abi=abi,
        )

    # ── Emisión (escritura on-chain) ──────────────────────────────
    def anclar_certificado(self, codigo: str, data_hash: str) -> AnclajeBlockchain:
        """Firma y envía la transacción que registra (codigo -> data_hash)."""
        nonce = self._w3.eth.get_transaction_count(self._account.address)
        fn = self._contract.functions.emitir(codigo, data_hash)
        tx = fn.build_transaction(
            {
                "chainId": self._settings.polygon_chain_id,
                "from": self._account.address,
                "nonce": nonce,
                "maxFeePerGas": self._w3.eth.gas_price * 2,
                "maxPriorityFeePerGas": self._w3.to_wei(30, "gwei"),
            }
        )
        signed = self._account.sign_transaction(tx)
        tx_hash = self._w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt = self._w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

        return AnclajeBlockchain(
            red=self._settings.polygon_network_label,  # type: ignore[arg-type]
            contrato=self._settings.contract_address,
            tx_hash=tx_hash.hex(),
            numero_bloque=receipt["blockNumber"],
            data_hash=data_hash,
            anclado_en=datetime.now(timezone.utc),
            explorer_url=f"{self._settings.explorer_base_url}/tx/{tx_hash.hex()}",
        )

    # ── Verificación (lectura on-chain) ───────────────────────────
    def verificar_integridad(self, codigo: str, data_hash_actual: str) -> ResultadoIntegridad:
        """Compara el hash recalculado de los datos vigentes contra el anclado."""
        anclado: str = self._contract.functions.hashDe(codigo).call()
        if not anclado or int(anclado, 16) == 0:
            return "NO_ANCLADO"
        return "VERIFICADO" if anclado.lower() == data_hash_actual.lower() else "ALTERADO"
