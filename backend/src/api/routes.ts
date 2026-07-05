import { Router } from 'express';
import { verificacionHandler } from './verificacion.controller';
import { anclarLoteHandler } from './jobs.controller';
import { loteHandler } from './blockchain.controller';
import {
  listarEstablecimientosHandler,
  metricasHandler,
  transaccionesHandler,
} from './admin.controller';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', servicio: 'cert-backend-web3' });
});

// Publico (verificacion por UUID).
apiRouter.get('/verificacion/:id', verificacionHandler);

// Panel interno (listado desde SQL Server).
apiRouter.get('/admin/establecimientos', listarEstablecimientosHandler);
apiRouter.get('/admin/metricas', metricasHandler);
apiRouter.get('/admin/transacciones', transaccionesHandler);

// Admin / operacion.
apiRouter.post('/jobs/anclar-lote', anclarLoteHandler);
apiRouter.get('/blockchain/lote/:batchId', loteHandler);
