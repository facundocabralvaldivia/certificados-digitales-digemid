import type { Request, Response } from 'express';
import { getVerificacion } from '../batch/batch.repository';
import { logger } from '../shared/logger';

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** GET /api/v1/verificacion/:id — publico. Datos + metadata de lote + Merkle Proof. */
export async function verificacionHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: 'BAD_REQUEST', mensaje: 'Identificador invalido' });
    return;
  }

  try {
    const payload = await getVerificacion(id);
    if (!payload) {
      res
        .status(404)
        .json({ error: 'NOT_FOUND', mensaje: 'Certificado no encontrado o pendiente de anclaje' });
      return;
    }
    res.json(payload);
  } catch (err) {
    logger.error('Error en verificacion', { id, err: (err as Error).message });
    res.status(500).json({ error: 'INTERNAL', mensaje: 'Error al procesar la verificacion' });
  }
}
