# Datos sensibles a configurar / cambiar

Este archivo lista **todo lo que NO debe quedar con el valor por defecto** y qué es
secreto. Nada de esto debe subirse a git (ya está cubierto por `.gitignore`).

## 1. `backend/.env` (crear a partir de `.env.example`)

| Variable | Sensibilidad | Qué poner |
|---|---|---|
| `DB_PASSWORD` | 🔴 Secreto | Contraseña real del usuario de SQL Server. |
| `DB_USER` / `DB_SERVER` / `DB_NAME` | 🟡 Sensible | Datos reales de tu instancia SQL Server. |
| `WALLET_PRIVATE_KEY` | 🔴 **MÁXIMO SECRETO** | Clave privada (`0x` + 64 hex) de la **wallet institucional**. Solo backend, solo para anclar. **Nunca** en el frontend, logs ni git. En producción: **KMS/HSM o Secret Manager**, jamás texto plano. |
| `ANCHOR_CONTRACT_ADDRESS` | 🟡 Público pero crítico | Dirección del contrato `CertificateAnchor` desplegado. Debe ser la correcta o toda verificación fallará. |
| `POLYGON_RPC_URL` | 🟡 Sensible | En prod usa un RPC con API key propia (Alchemy/Infura), no el público. |

## 2. Wallet institucional (la cuenta)

- **Clave privada** → `WALLET_PRIVATE_KEY` (secreto máximo, arriba).
- **Dirección pública** de esa wallet → debe ser el `owner` del contrato `CertificateAnchor`
  (es quien puede llamar `anchorBatch`). Se fija al desplegar.
- Debe tener **POL** para pagar gas (faucet en Amoy; saldo real en PoS).
- Recomendado en producción: mover el `owner` a un **multisig (Gnosis Safe)**.

## 3. Contrato en blockchain

- `contracts/CertificateAnchor.sol` → desplegar y copiar la dirección a **dos lugares**:
  1. `backend/.env` → `ANCHOR_CONTRACT_ADDRESS`
  2. `frontend/src/environments/environment.ts` → `anchorContractAddress`
  (y `environment.prod.ts` para producción).

## 4. Frontend (`environment.ts` / `environment.prod.ts`)

| Campo | Cambiar por |
|---|---|
| `anchorContractAddress` | Dirección real del contrato (misma que el backend). |
| `polygonRpcUrl` | Dev: Amoy. Prod: RPC de Polygon PoS (idealmente con API key). |
| `polygonChainId` | Dev: `80002` (Amoy). Prod: `137` (PoS). |
| `explorerTxBase` | Dev: `https://amoy.polygonscan.com/tx`. Prod: `https://polygonscan.com/tx`. |

> El frontend **solo lee** de la blockchain (no firma), por eso NO lleva clave privada.

## 5. Sobre los "hash"

- Los **hashes de hoja (SHA-256)** y el **Merkle Root** NO son secretos: se calculan de
  forma determinista desde los datos y se pueden recomputar. No hay que "cambiarlos" a mano.
- El **`batchId`** y el **`txHash`** se generan solos al anclar; se guardan en la tabla `Lotes`.
- Lo único verdaderamente secreto en toda la cadena criptográfica es la **clave privada de la wallet**.

## 6. Migración dev → producción (resumen)

1. Redesplegar `CertificateAnchor` en Polygon PoS (chainId 137).
2. Nueva wallet de producción (con su clave en KMS/HSM) financiada con POL.
3. Actualizar `.env` (backend) y ambos `environment*.ts` (frontend) con: dirección de contrato,
   RPC de PoS, chainId 137 y explorer de PoS.
4. Transferir `owner` del contrato al multisig.
