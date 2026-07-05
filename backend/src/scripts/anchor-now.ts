import { runAnchorJob } from '../batch/anchor.job';
import { getPool } from '../db/pool';
import { logger } from '../shared/logger';

async function main(): Promise<void> {
  const result = await runAnchorJob();
  if (!result) {
    logger.warn('No se genero ningun lote');
  }
  const pool = await getPool();
  await pool.close();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Anclaje manual fallo', { err: (err as Error).message });
  process.exit(1);
});
