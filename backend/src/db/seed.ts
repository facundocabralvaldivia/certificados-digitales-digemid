import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPool, connectMaster, sql } from './pool';
import { env } from '../config/env';
import { logger } from '../shared/logger';
import type { EstablecimientoCanonical } from '../batch/types';

const DATA_DIR = join(__dirname, '..', '..', 'data');

async function ensureDatabase(): Promise<void> {
  // En Azure SQL la BD se crea en el portal; CREATE DATABASE en master suele fallar o ser innecesario.
  if (env.DB_SERVER.includes('.database.windows.net')) {
    logger.info('Azure SQL: usando BD existente en portal', { db: env.DB_NAME });
    return;
  }
  const master = await connectMaster();
  try {
    await master
      .request()
      .query(`IF DB_ID('${env.DB_NAME}') IS NULL CREATE DATABASE [${env.DB_NAME}];`);
    logger.info('Base de datos verificada/creada', { db: env.DB_NAME });
  } finally {
    await master.close();
  }
}

async function applySchema(): Promise<void> {
  const pool = await getPool();
  const schema = readFileSync(join(DATA_DIR, 'schema.sql'), 'utf-8');
  await pool.request().batch(schema);
  logger.info('Schema aplicado');
}

async function seedEstablecimientos(): Promise<void> {
  const pool = await getPool();
  const raw = readFileSync(join(DATA_DIR, 'seed.establecimientos.json'), 'utf-8');
  const registros = JSON.parse(raw) as EstablecimientoCanonical[];

  // Reemplaza el seed anterior (sin anclaje activo) para evitar registros duplicados.
  await pool.request().query(`DELETE FROM dbo.Establecimientos WHERE BatchId IS NULL`);

  for (const r of registros) {
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, r.certificadoId)
      .input('ruc', sql.NVarChar, r.ruc)
      .input('nombreComercial', sql.NVarChar, r.nombreComercial)
      .input('razonSocial', sql.NVarChar, r.razonSocial)
      .input('direccion', sql.NVarChar, r.direccion)
      .input('ubicacion', sql.NVarChar, r.ubicacion)
      .input('directorTecnico', sql.NVarChar, r.directorTecnico)
      .input('numeroColegiatura', sql.NVarChar, r.numeroColegiatura)
      .input('estadoColegiatura', sql.NVarChar, r.estadoColegiatura)
      .input('horarioDT', sql.NVarChar, r.horarioDT)
      .input('estadoEstablecimiento', sql.NVarChar, r.estadoEstablecimiento)
      .input('emitidoEn', sql.DateTime2, new Date(r.emitidoEn))
      .query(
        `MERGE dbo.Establecimientos AS t
         USING (SELECT @id AS CertificadoId) AS s ON t.CertificadoId = s.CertificadoId
         WHEN MATCHED THEN UPDATE SET
            Ruc = @ruc, NombreComercial = @nombreComercial, RazonSocial = @razonSocial,
            Direccion = @direccion, Ubicacion = @ubicacion, DirectorTecnico = @directorTecnico,
            NumeroColegiatura = @numeroColegiatura, EstadoColegiatura = @estadoColegiatura,
            HorarioDT = @horarioDT, EstadoEstablecimiento = @estadoEstablecimiento,
            EmitidoEn = @emitidoEn, ActualizadoEn = SYSUTCDATETIME()
         WHEN NOT MATCHED THEN INSERT
            (CertificadoId, Ruc, NombreComercial, RazonSocial, Direccion, Ubicacion, DirectorTecnico,
             NumeroColegiatura, EstadoColegiatura, HorarioDT, EstadoEstablecimiento, EmitidoEn)
         VALUES
            (@id, @ruc, @nombreComercial, @razonSocial, @direccion, @ubicacion, @directorTecnico,
             @numeroColegiatura, @estadoColegiatura, @horarioDT, @estadoEstablecimiento, @emitidoEn);`,
      );
  }
  logger.info('Seed de establecimientos completado', { total: registros.length });
}

async function main(): Promise<void> {
  await ensureDatabase();
  await applySchema();
  await seedEstablecimientos();
  const pool = await getPool();
  await pool.close();
  logger.info('Seed finalizado correctamente');
  process.exit(0);
}

main().catch((err) => {
  logger.error('Seed fallo', { err: (err as Error).message });
  process.exit(1);
});
