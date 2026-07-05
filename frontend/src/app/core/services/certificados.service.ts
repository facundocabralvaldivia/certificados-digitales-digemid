import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  enriquecerCertificado,
  obtenerMockCertificado,
} from '../data/demo-certificados.data';
import { CertificadoPublicoRead } from '../models/certificados.models';

/**
 * Token de contexto para omitir el envío de credenciales en las consultas
 * PÚBLICAS de verificación. El `credentialsInterceptor` debe leerlo y NO añadir
 * `withCredentials: true` cuando esté presente: el endpoint público no usa
 * cookies de sesión y enviarlas relajaría innecesariamente la postura CORS.
 */
export const SKIP_CREDENTIALS = new HttpContextToken<boolean>(() => false);

/**
 * Verificación pública de códigos legacy DIGEMID-DEMO-* vía demo FastAPI (:8001).
 * Si el demo no está levantado, cae a mock local en `demo-certificados.data.ts`.
 * Códigos UUID usan `VerificacionBlockchainService` (backend Node :8002).
 */
@Injectable({ providedIn: 'root' })
export class CertificadosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/certificados`;

  verificar(codigo: string): Observable<CertificadoPublicoRead> {
    const context = new HttpContext().set(SKIP_CREDENTIALS, true);
    return this.http
      .get<Partial<CertificadoPublicoRead>>(
        `${this.base}/verificar/${encodeURIComponent(codigo)}`,
        { context },
      )
      .pipe(
        map((data) => enriquecerCertificado(codigo, data)),
        catchError((err) => {
          const mock = obtenerMockCertificado(codigo);
          if (mock) {
            return of(mock);
          }
          return throwError(() => err);
        }),
      );
  }
}
