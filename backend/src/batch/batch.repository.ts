import { getPool, sql } from '../db/pool';
import type {
  EstablecimientoCanonical,
  LoteMeta,
  RegistroConProof,
  VerificacionPayload,
} from './types';
import type { ProofStep } from '../merkle/merkle';

/**
 * Convierte una fila de SQL Server al payload canonico. Es la UNICA fuente de
 * verdad de que campos y en que forma entran a la hoja del Merkle. La usan tanto
 * el anclaje (para calcular el root) como la API (para servir los datos), de modo
 * que el hash siempre coincide mientras el registro no cambie.
 */
function toCanonical(row: Record<string, unknown>): EstablecimientoCanonical {
  return {
    certificadoId: String(row.CertificadoId).toLowerCase(),
    ruc: String(row.Ruc),
    nombreComercial: String(row.NombreComercial),
    razonSocial: String(row.RazonSocial),
    direccion: String(row.Direccion),
    ubicacion: String(row.Ubicacion ?? ''),
    directorTecnico: String(row.DirectorTecnico),
    numeroColegiatura: String(row.NumeroColegiatura),
    estadoColegiatura: String(row.EstadoColegiatura),
    horarioDT: String(row.HorarioDT),
    estadoEstablecimiento: String(row.EstadoEstablecimiento),
    emitidoEn: new Date(row.EmitidoEn as string).toISOString(),
  };
}

/** Registros validos listos para anclar, ordenados de forma estable. */
export async function fetchRegistrosValidos(): Promise<EstablecimientoCanonical[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      `SELECT * FROM dbo.Establecimientos
       WHERE EstadoRegistro = 'VALIDO'
       ORDER BY CertificadoId ASC`,
    );
  return result.recordset.map(toCanonical);
}

export interface PersistBatchInput {
  batchId: string;
  batchUuid: string;
  merkleRoot: string;
  txHash: string | null;
  blockNumber: number | null;
  red: string;
  totalRegistros: number;
  pruebas: RegistroConProof[];
}

/** Inserta el lote y actualiza cada establecimiento con su BatchId + Merkle Proof. */
export async function persistBatch(input: PersistBatchInput): Promise<void> {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await new sql.Request(tx)
      .input('batchId', sql.NVarChar, input.batchId)
      .input('batchUuid', sql.NVarChar, input.batchUuid)
      .input('merkleRoot', sql.NVarChar, input.merkleRoot)
      .input('txHash', sql.NVarChar, input.txHash)
      .input('blockNumber', sql.BigInt, input.blockNumber)
      .input('red', sql.NVarChar, input.red)
      .input('total', sql.Int, input.totalRegistros)
      .input('estado', sql.NVarChar, input.txHash ? 'CONFIRMADO' : 'PENDIENTE')
      .query(
        `INSERT INTO dbo.Lotes (BatchId, BatchUuid, MerkleRoot, TxHash, BlockNumber, Red, TotalRegistros, Estado)
         VALUES (@batchId, @batchUuid, @merkleRoot, @txHash, @blockNumber, @red, @total, @estado)`,
      );

    for (const p of input.pruebas) {
      await new sql.Request(tx)
        .input('id', sql.UniqueIdentifier, p.certificadoId)
        .input('batchId', sql.NVarChar, input.batchId)
        .input('proof', sql.NVarChar, JSON.stringify(p.proof))
        .query(
          `UPDATE dbo.Establecimientos
           SET BatchId = @batchId, Proof = @proof, ActualizadoEn = SYSUTCDATETIME()
           WHERE CertificadoId = @id`,
        );
    }

    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

/** Datos + metadata de lote + Merkle Proof para que el frontend verifique solo. */
export async function getVerificacion(certificadoId: string): Promise<VerificacionPayload | null> {
  const pool = await getPool();
  const estRes = await pool
    .request()
    .input('id', sql.UniqueIdentifier, certificadoId)
    .query(`SELECT * FROM dbo.Establecimientos WHERE CertificadoId = @id`);

  const row = estRes.recordset[0];
  if (!row || !row.BatchId || !row.Proof) {
    return null;
  }

  const loteRes = await pool
    .request()
    .input('batchId', sql.NVarChar, row.BatchId)
    .query(`SELECT * FROM dbo.Lotes WHERE BatchId = @batchId`);

  const lote = loteRes.recordset[0];
  if (!lote) {
    return null;
  }

  const merkleProof = JSON.parse(row.Proof as string) as ProofStep[];

  return {
    certificadoId: String(row.CertificadoId).toLowerCase(),
    batchId: lote.BatchId,
    merkleRoot: lote.MerkleRoot,
    txHash: lote.TxHash ?? null,
    blockNumber: lote.BlockNumber !== null ? Number(lote.BlockNumber) : null,
    red: lote.Red,
    ancladoEn: new Date(lote.AncladoEn).toISOString(),
    establecimiento: toCanonical(row),
    merkleProof,
  };
}

export interface EstablecimientoAdminRow {
  certificadoId: string;
  ruc: string;
  nombreComercial: string;
  razonSocial: string;
  ubicacion: string;
  estadoEstablecimiento: string;
  estadoColegiatura: string;
  emitidoEn: string;
  batchId: string | null;
  txHash: string | null;
  red: string | null;
  loteEstado: string | null;
  ancladoEn: string | null;
}

export interface MetricasAdmin {
  total_emitidos: number;
  activos: number;
  revocados: number;
  pendientes_anclaje: number;
}

export interface LoteTransaccionRow {
  batchId: string;
  batchUuid: string;
  txHash: string | null;
  blockNumber: number | null;
  red: string;
  estado: string;
  totalRegistros: number;
  ancladoEn: string;
}

/** Listado para el panel interno (todos los registros validos + metadata de lote). */
export async function listEstablecimientosAdmin(
  filtro?: { estado?: string; q?: string },
): Promise<EstablecimientoAdminRow[]> {
  const pool = await getPool();
  let query = `
    SELECT e.CertificadoId, e.Ruc, e.NombreComercial, e.RazonSocial, e.Ubicacion,
           e.EstadoEstablecimiento, e.EstadoColegiatura, e.EmitidoEn, e.BatchId,
           l.TxHash, l.Red, l.Estado AS LoteEstado, l.AncladoEn
    FROM dbo.Establecimientos e
    LEFT JOIN dbo.Lotes l ON l.BatchId = e.BatchId
    WHERE e.EstadoRegistro = 'VALIDO'`;

  const request = pool.request();

  if (filtro?.estado) {
    query += ` AND e.EstadoEstablecimiento = @estado`;
    request.input('estado', sql.NVarChar, filtro.estado);
  }

  if (filtro?.q) {
    query += ` AND (
      e.RazonSocial LIKE @q OR e.NombreComercial LIKE @q OR e.Ruc LIKE @q
      OR CAST(e.CertificadoId AS NVARCHAR(36)) LIKE @q
    )`;
    request.input('q', sql.NVarChar, `%${filtro.q}%`);
  }

  query += ` ORDER BY e.NombreComercial ASC`;

  const result = await request.query(query);
  return result.recordset.map((row: Record<string, unknown>) => ({
    certificadoId: String(row.CertificadoId).toLowerCase(),
    ruc: String(row.Ruc),
    nombreComercial: String(row.NombreComercial),
    razonSocial: String(row.RazonSocial),
    ubicacion: String(row.Ubicacion ?? ''),
    estadoEstablecimiento: String(row.EstadoEstablecimiento),
    estadoColegiatura: String(row.EstadoColegiatura),
    emitidoEn: new Date(row.EmitidoEn as string).toISOString(),
    batchId: row.BatchId ? String(row.BatchId) : null,
    txHash: row.TxHash ? String(row.TxHash) : null,
    red: row.Red ? String(row.Red) : null,
    loteEstado: row.LoteEstado ? String(row.LoteEstado) : null,
    ancladoEn: row.AncladoEn ? new Date(row.AncladoEn as string).toISOString() : null,
  }));
}

/** Metricas agregadas para el dashboard interno. */
export async function getMetricasAdmin(): Promise<MetricasAdmin> {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN e.EstadoEstablecimiento = 'HABILITADO'
                AND e.EstadoColegiatura IN ('HABIL', 'ACTIVO', 'HABILITADO') THEN 1 ELSE 0 END) AS activos,
      SUM(CASE WHEN e.EstadoEstablecimiento = 'REVOCADO' THEN 1 ELSE 0 END) AS revocados,
      SUM(CASE WHEN e.BatchId IS NULL OR l.TxHash IS NULL THEN 1 ELSE 0 END) AS pendientes
    FROM dbo.Establecimientos e
    LEFT JOIN dbo.Lotes l ON l.BatchId = e.BatchId
    WHERE e.EstadoRegistro = 'VALIDO'
  `);

  const row = result.recordset[0];
  return {
    total_emitidos: Number(row.total ?? 0),
    activos: Number(row.activos ?? 0),
    revocados: Number(row.revocados ?? 0),
    pendientes_anclaje: Number(row.pendientes ?? 0),
  };
}

/** Lotes anclados (o pendientes) para el log de transacciones del panel. */
export async function listLotesTransacciones(): Promise<LoteTransaccionRow[]> {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(
      `SELECT BatchId, BatchUuid, TxHash, BlockNumber, Red, Estado, TotalRegistros, AncladoEn
       FROM dbo.Lotes
       ORDER BY AncladoEn DESC`,
    );

  return result.recordset.map((row: Record<string, unknown>) => ({
    batchId: String(row.BatchId),
    batchUuid: String(row.BatchUuid),
    txHash: row.TxHash ? String(row.TxHash) : null,
    blockNumber: row.BlockNumber !== null ? Number(row.BlockNumber) : null,
    red: String(row.Red),
    estado: String(row.Estado),
    totalRegistros: Number(row.TotalRegistros),
    ancladoEn: new Date(row.AncladoEn as string).toISOString(),
  }));
}

export async function getLote(batchId: string): Promise<LoteMeta | null> {
  const pool = await getPool();
  const res = await pool
    .request()
    .input('batchId', sql.NVarChar, batchId)
    .query(`SELECT * FROM dbo.Lotes WHERE BatchId = @batchId`);

  const lote = res.recordset[0];
  if (!lote) {
    return null;
  }
  return {
    batchId: lote.BatchId,
    batchUuid: lote.BatchUuid,
    merkleRoot: lote.MerkleRoot,
    txHash: lote.TxHash ?? null,
    blockNumber: lote.BlockNumber !== null ? Number(lote.BlockNumber) : null,
    red: lote.Red,
    estado: lote.Estado,
    ancladoEn: new Date(lote.AncladoEn).toISOString(),
  };
}
