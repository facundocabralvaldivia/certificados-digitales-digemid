import { HttpInterceptorFn } from '@angular/common/http';

import { SKIP_CREDENTIALS } from '../services/certificados.service';

/**
 * Añade `withCredentials: true` a todas las peticiones, EXCEPTO las marcadas con
 * el token de contexto `SKIP_CREDENTIALS` (la verificación pública del certificado,
 * que no usa cookies de sesión).
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_CREDENTIALS)) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};
