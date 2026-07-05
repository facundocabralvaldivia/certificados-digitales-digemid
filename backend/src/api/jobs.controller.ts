import type { Request, Response } from 'express';
import { runAnchorJob } from '../batch/anchor.job';
import { logger } from '../shared/logger';

/** POST /api/v1/jobs/anclar-lote — admin (manual). */
export async function anclarLoteHandler(_req: Request, res: Response): Promise<void> {
  try {
    const result = await runAnchorJob();
    if (!result) {
      res.status(200).json({ estado: 'SIN_REGISTROS', mensaje: 'No hay registros validos' });
      return;
    }
    res.status(202).json({ estado: 'CONFIRMADO', ...result });
  } catch (err) {
    logger.error('Fallo el anclaje manual', { err: (err as Error).message });
    res.status(500).json({ error: 'ANCHOR_FAILED', mensaje: (err as Error).message });
  }
}
