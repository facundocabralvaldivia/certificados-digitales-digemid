import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CertificadoAdminRead,
  CertificadoMetrics,
  EstadoCertificado,
  TransaccionBlockchainRead,
} from '../models/certificados.models';

/**
 * Panel interno conectado al backend Web3 (SQL Server + Polygon).
 * Endpoints bajo /api/v1/admin/* (proxy → :8002).
 */
@Injectable({ providedIn: 'root' })
export class CertificadosAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  metricas(): Observable<CertificadoMetrics> {
    return this.http.get<CertificadoMetrics>(`${this.base}/metricas`);
  }

  listar(filtro?: { estado?: EstadoCertificado; q?: string }): Observable<CertificadoAdminRead[]> {
    const params: Record<string, string> = {};
    if (filtro?.estado) params['estado'] = filtro.estado;
    if (filtro?.q) params['q'] = filtro.q;
    return this.http.get<CertificadoAdminRead[]>(`${this.base}/establecimientos`, { params });
  }

  transacciones(): Observable<TransaccionBlockchainRead[]> {
    return this.http.get<TransaccionBlockchainRead[]>(`${this.base}/transacciones`);
  }
}
