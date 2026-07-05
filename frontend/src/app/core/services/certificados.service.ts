import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  enriquecerCertificado,
  obtenerMockCertificado,
} from '../data/demo-certificados.data';
import {
  CertificadoPublicoRead,
  CertificadoAdminRead,
  CertificadoMetrics,
  CertificadoEmitirInput,
  TransaccionBlockchainRead,
  EstadoCertificado,
} from '../models/certificados.models';

/**
 * Token de contexto para omitir el envío de credenciales en las consultas
 * PÚBLICAS de verificación. El `credentialsInterceptor` debe leerlo y NO añadir
 * `withCredentials: true` cuando esté presente: el endpoint público no usa
 * cookies de sesión y enviarlas relajaría innecesariamente la postura CORS.
 */
export const SKIP_CREDENTIALS = new HttpContextToken<boolean>(() => false);

/**
 * Servicio del dominio CERTIFICADOS.
 * Sigue el patrón de servicio HTTP de AGENTS.md: `inject(HttpClient)`,
 * base derivada de `environment.apiUrl`, tipos desde `core/models`.
 */
@Injectable({ providedIn: 'root' })
export class CertificadosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/certificados`;

  /* ───────────────  PÚBLICO (sin login) ─────────────── */

  /**
   * Verificación pública por código del QR. No envía cookies de sesión.
   * El backend recalcula el hash de integridad contra el anclaje on-chain.
   */
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

  /* ───────────────  INTERNO (requiere login) ─────────────── */

  metricas(): Observable<CertificadoMetrics> {
    return this.http.get<CertificadoMetrics>(`${this.base}/admin/metricas`);
  }

  listar(filtro?: { estado?: EstadoCertificado; q?: string }): Observable<CertificadoAdminRead[]> {
    const params: Record<string, string> = {};
    if (filtro?.estado) { params['estado'] = filtro.estado; }
    if (filtro?.q) { params['q'] = filtro.q; }
    return this.http.get<CertificadoAdminRead[]>(`${this.base}/admin`, { params });
  }

  /** Anclaje on-chain: el backend firma con la clave privada custodiada server-side. */
  emitir(data: CertificadoEmitirInput): Observable<CertificadoAdminRead> {
    return this.http.post<CertificadoAdminRead>(`${this.base}/admin/emitir`, data);
  }

  revocar(id: string, motivo: string): Observable<CertificadoAdminRead> {
    return this.http.post<CertificadoAdminRead>(`${this.base}/admin/${id}/revocar`, { motivo });
  }

  transacciones(): Observable<TransaccionBlockchainRead[]> {
    return this.http.get<TransaccionBlockchainRead[]>(`${this.base}/admin/blockchain/transacciones`);
  }
}
