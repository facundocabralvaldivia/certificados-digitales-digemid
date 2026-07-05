# Contrato `CertificateAnchor`

Contrato mínimo que almacena, de forma inmutable, el **Merkle Root** de cada lote diario.

## Desplegar en Polygon Amoy (opción rápida: Remix)

1. Abre https://remix.ethereum.org y pega `CertificateAnchor.sol`.
2. Compila con Solidity `0.8.24`.
3. En **Deploy & Run**:
   - Environment: `Injected Provider - MetaMask` (con MetaMask en red **Polygon Amoy**, chainId 80002).
   - Usa la **wallet institucional** (la misma cuya clave privada irá en `.env`).
   - Consigue POL de prueba en el faucet de Amoy: https://faucet.polygon.technology
4. Deploy → copia la **dirección del contrato**.
5. Pega esa dirección en `backend/.env` → `ANCHOR_CONTRACT_ADDRESS=0x...`
6. En `frontend/src/environments/environment.ts` → `anchorContractAddress: '0x...'` (la misma).

## Producción (Polygon PoS, chainId 137)

- Redespliega el mismo contrato en Polygon PoS.
- Transfiere `owner` a un **multisig (Gnosis Safe)** con `transferOwnership`.
- Verifica el código fuente en PolygonScan.
