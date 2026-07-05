import type { Request, Response } from 'express';
import { getLote } from '../batch/batch.repository';
import { leerRootOnChain } from '../blockchain/anchor.service';
import { env } from '../config/env';
import { logger } from '../shared/logger';

/** GET /api/v1/blockchain/lote/:batchId — estado de anclaje + verificacion on-chain. */
export async function loteHandler(req: Request, res: Response): Promise<void> {
  const { batchId } = req.params;
  try {
    const lote = await getLote(batchId);
    if (!lote) {
      res.status(404).json({ error: 'NOT_FOUND', mensaje: 'Lote no encontrado' });
      return;
    }

    let rootOnChain: string | null = null;
    let coincideOnChain: boolean | null = null;
    try {
      rootOnChain = await leerRootOnChain(batchId);
      if (rootOnChain) {
        coincideOnChain = rootOnChain.toLowerCase() === lote.merkleRoot.toLowerCase();
      }
    } catch (err) {
      logger.warn('No se pudo leer root on-chain', { batchId, err: (err as Error).message });
    }

    res.json({
      ...lote,
      rootOnChain,
      coincideOnChain,
      explorerUrl: lote.txHash ? `${env.EXPLORER_TX_BASE}/${lote.txHash}` : null,
    });
  } catch (err) {
    logger.error('Error consultando lote', { batchId, err: (err as Error).message });
    res.status(500).json({ error: 'INTERNAL', mensaje: 'Error al consultar el lote' });
  }
}
