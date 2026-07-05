import { randomUUID } from 'node:crypto';
import { keccak256, toUtf8Bytes } from 'ethers';
import { canonicalize, hashLeaf, buildTree, getRoot, getProof } from '../merkle/merkle';
import { anchorBatch } from '../blockchain/anchor.service';
import { fetchRegistrosValidos, persistBatch } from './batch.repository';
import { env, redNombre } from '../config/env';
import { logger } from '../shared/logger';
import type { EstablecimientoCanonical } from './types';

export interface AnchorJobResult {
  batchId: string;
  merkleRoot: string;
  totalRegistros: number;
  txHash: string | null;
  blockNumber: number | null;
}

/**
 * Job de anclaje: toma registros validos, canonicaliza, calcula hojas SHA-256,
 * arma el Merkle Tree, ancla el root en Polygon y persiste lote + pruebas.
 */
export async function runAnchorJob(): Promise<AnchorJobResult | null> {
  const registros = await fetchRegistrosValidos();
  if (registros.length === 0) {
    logger.warn('Sin registros validos para anclar; job omitido');
    return null;
  }

  const leaves = registros.map((r) =>
    hashLeaf(canonicalize(r as unknown as Record<string, unknown>)),
  );
  const levels = buildTree(leaves);
  const merkleRoot = getRoot(levels);

  const batchUuid = randomUUID();
  const fecha = new Date().toISOString().slice(0, 10);
  const batchId = keccak256(toUtf8Bytes(`${fecha}:${batchUuid}`));

  const { txHash, blockNumber } = await anchorBatch(batchId, merkleRoot);

  const pruebas = registros.map((r: EstablecimientoCanonical, i: number) => ({
    certificadoId: r.certificadoId,
    proof: getProof(levels, i),
  }));

  await persistBatch({
    batchId,
    batchUuid,
    merkleRoot,
    txHash,
    blockNumber,
    red: redNombre(env.POLYGON_CHAIN_ID),
    totalRegistros: registros.length,
    pruebas,
  });

  logger.info('Lote anclado y persistido', {
    batchId,
    merkleRoot,
    txHash,
    total: registros.length,
  });

  return { batchId, merkleRoot, totalRegistros: registros.length, txHash, blockNumber };
}
