import { getAnchorContract, getAnchorReader } from './provider';
import { logger } from '../shared/logger';

export interface AnchorResult {
  txHash: string;
  blockNumber: number | null;
}

/** Envia la transaccion de anclaje del Merkle Root a Polygon y espera confirmaciones. */
export async function anchorBatch(batchId: string, merkleRoot: string): Promise<AnchorResult> {
  const contract = getAnchorContract();
  logger.info('Enviando anclaje a Polygon', { batchId, merkleRoot });
  try {
    const tx = await contract.anchorBatch(batchId, merkleRoot);
    logger.info('Tx enviada, esperando confirmaciones', { hash: tx.hash });
    const receipt = await tx.wait(2);
    const blockNumber = receipt?.blockNumber ?? null;
    logger.info('Tx confirmada', { hash: tx.hash, blockNumber });
    return { txHash: tx.hash, blockNumber };
  } catch (err) {
    logger.error('Fallo el anclaje del lote', { batchId, err: (err as Error).message });
    throw new Error(`ANCHOR_FAILED: ${(err as Error).message}`);
  }
}

/** Lee el root anclado on-chain para un batchId (bytes32) o null si no hay contrato. */
export async function leerRootOnChain(batchId: string): Promise<string | null> {
  const reader = getAnchorReader();
  if (!reader) {
    return null;
  }
  return (await reader.roots(batchId)) as string;
}
