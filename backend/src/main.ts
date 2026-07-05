import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { env } from './config/env';
import { apiRouter } from './api/routes';
import { runAnchorJob } from './batch/anchor.job';
import { logger } from './shared/logger';

const app = express();

const corsOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'https://witty-sea-0ecb8120f.7.azurestaticapps.net',
];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', apiRouter);

// Cron diario de anclaje (desactivado por defecto; activar con RUN_CRON=true).
if (env.RUN_CRON) {
  cron.schedule(env.ANCHOR_CRON, () => {
    runAnchorJob().catch((err) => logger.error('Job de anclaje fallo', { err: err.message }));
  });
  logger.info('Cron de anclaje activado', { expresion: env.ANCHOR_CRON });
}

app.listen(env.PORT, () => {
  logger.info('Backend Web3 escuchando', { puerto: env.PORT, entorno: env.NODE_ENV });
});
