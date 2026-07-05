import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProofStep } from '../utils/merkle-verify.util';

export interface EstablecimientoCanonical {
  certificadoId: string;
  ruc: string;
  nombreComercial: string;
  razonSocial: string;
  direccion: string;
  ubicacion: string;
  directorTecnico: string;
  numeroColegiatura: string;
  estadoColegiatura: string;
  horarioDT: string;
  estadoEstablecimiento: 'HABILITADO' | 'NO_HABILITADO';
  emitidoEn: string;
}

export interface VerificacionResponse {
  certificadoId: string;
  batchId: string;
  merkleRoot: string;
  txHash: string | null;
  blockNumber: number | null;
  red: string;
  ancladoEn: string;
  certificadoPdfUrl: string;
  establecimiento: EstablecimientoCanonical;
  merkleProof: ProofStep[];
}

@Injectable({ providedIn: 'root' })
export class VerificacionBlockchainService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  obtenerVerificacion(id: string): Observable<VerificacionResponse> {
    return this.http.get<VerificacionResponse>(`${this.base}/verificacion/${id}`, {
      withCredentials: true,
    });
  }
}
