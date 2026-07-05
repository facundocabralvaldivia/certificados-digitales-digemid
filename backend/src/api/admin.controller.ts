import type { Request, Response } from 'express';
import {
  getMetricasAdmin,
  listEstablecimientosAdmin,
  listLotesTransacciones,
} from '../batch/batch.repository';
import { env } from '../config/env';
import { logger } from '../shared/logger';

type RedPolygon = 'polygon-amoy' | 'polygon-mainnet';
type EstadoCertificado = 'HABILITADO' | 'NO_HABILITADO' | 'REVOCADO';

function mapRed(red: string | null): RedPolygon {
  if (!red) return 'polygon-amoy';
  if (red.includes('pos') || red === 'polygon-mainnet') return 'polygon-mainnet';
  return 'polygon-amoy';
}

function mapEstado(estado: string): EstadoCertificado {
  const u = estado.toUpperCase();
  if (u === 'HABILITADO') return 'HABILITADO';
  if (u === 'REVOCADO') return 'REVOCADO';
  return 'NO_HABILITADO';
}

/** GET /api/v1/admin/establecimientos — listado para panel interno. */
export async function listarEstablecimientosHandler(req: Request, res: Response): Promise<void> {
  const estado = typeof req.query.estado === 'string' ? req.query.estado : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 120) : undefined;

  try {
    const filtroEstado =
      estado && ['HABILITADO', 'NO_HABILITADO', 'REVOCADO'].includes(estado) ? estado : undefined;

    const rows = await listEstablecimientosAdmin({ estado: filtroEstado, q });
    res.json(
      rows.map((r) => ({
        id: r.certificadoId,
        codigo_verificacion: r.certificadoId,
        razon_social: r.razonSocial,
        nombre_comercial: r.nombreComercial,
        ruc: r.ruc,
        ubicacion: r.ubicacion,
        estado: mapEstado(r.estadoEstablecimiento),
        red: mapRed(r.red),
        tx_hash: r.txHash,
        anclado: Boolean(r.txHash && r.loteEstado === 'CONFIRMADO'),
        emitido_en: r.emitidoEn,
        emitido_por: 'DIGEMID',
      })),
    );
  } catch (err) {
    logger.error('Error listando establecimientos admin', { err: (err as Error).message });
    res.status(500).json({ error: 'INTERNAL', mensaje: 'Error al listar establecimientos' });
  }
}

/** GET /api/v1/admin/metricas — contadores del dashboard. */
export async function metricasHandler(_req: Request, res: Response): Promise<void> {
  try {
    const metricas = await getMetricasAdmin();
    res.json(metricas);
  } catch (err) {
    logger.error('Error obteniendo metricas admin', { err: (err as Error).message });
    res.status(500).json({ error: 'INTERNAL', mensaje: 'Error al obtener metricas' });
  }
}

/** GET /api/v1/admin/transacciones — log de lotes anclados en Polygon. */
export async function transaccionesHandler(_req: Request, res: Response): Promise<void> {
  try {
    const lotes = await listLotesTransacciones();
    res.json(
      lotes.map((l) => ({
        tx_hash: l.txHash ?? `pendiente-${l.batchUuid}`,
        tipo: 'EMISION' as const,
        estado_tx: l.txHash && l.estado === 'CONFIRMADO' ? 'CONFIRMADA' : 'PENDIENTE',
        codigo_verificacion: `Lote · ${l.totalRegistros} cert.`,
        numero_bloque: l.blockNumber,
        gas_usado: null,
        red: mapRed(l.red),
        registrado_en: l.ancladoEn,
        explorer_url: l.txHash ? `${env.EXPLORER_TX_BASE}/${l.txHash}` : '',
      })),
    );
  } catch (err) {
    logger.error('Error listando transacciones admin', { err: (err as Error).message });
    res.status(500).json({ error: 'INTERNAL', mensaje: 'Error al listar transacciones' });
  }
}
