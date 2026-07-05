import { JsonRpcProvider, Wallet, Contract } from 'ethers';
import { env, ZERO_ADDRESS } from '../config/env';
import abi from './abi/CertificateAnchor.json';

export const provider = new JsonRpcProvider(env.POLYGON_RPC_URL, env.POLYGON_CHAIN_ID);

function assertContractConfigurado(): void {
  if (env.ANCHOR_CONTRACT_ADDRESS.toLowerCase() === ZERO_ADDRESS) {
    throw new Error(
      'ANCHOR_CONTRACT_ADDRESS no configurada. Despliega contracts/CertificateAnchor.sol y ' +
        'coloca la direccion en .env (ver contracts/README.md).',
    );
  }
}

/** Contrato con firma (para ESCRIBIR: anclar lotes). Requiere WALLET_PRIVATE_KEY. */
export function getAnchorContract(): Contract {
  assertContractConfigurado();
  if (!env.WALLET_PRIVATE_KEY) {
    throw new Error('WALLET_PRIVATE_KEY no configurada: no es posible firmar el anclaje.');
  }
  const wallet = new Wallet(env.WALLET_PRIVATE_KEY, provider);
  return new Contract(env.ANCHOR_CONTRACT_ADDRESS, abi, wallet);
}

/** Contrato de solo lectura (no requiere clave privada). */
export function getAnchorReader(): Contract | null {
  if (env.ANCHOR_CONTRACT_ADDRESS.toLowerCase() === ZERO_ADDRESS) {
    return null;
  }
  return new Contract(env.ANCHOR_CONTRACT_ADDRESS, abi, provider);
}
