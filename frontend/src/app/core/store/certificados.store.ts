import { Injectable, computed, signal } from '@angular/core';

import {
  CertificadoAdminRead,
  CertificadoMetrics,
  EstadoCertificado,
} from '../models/certificados.models';

/**
 * Estado del panel administrativo de certificados.
 * Sigue el patrón de store de AGENTS.md: un único WritableSignal privado +
 * computed públicos de SOLO LECTURA. Sin NgRx, sin RxJS como estado.
 */
interface CertificadosState {
  lista: CertificadoAdminRead[];
  metricas: CertificadoMetrics | null;
  filtroEstado: EstadoCertificado | 'TODOS';
  busqueda: string;
  isLoading: boolean;
  error: string | null;
}

const INITIAL: CertificadosState = {
  lista: [],
  metricas: null,
  filtroEstado: 'TODOS',
  busqueda: '',
  isLoading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class CertificadosStore {
  private readonly _state = signal<CertificadosState>(INITIAL);

  // ── Computed públicos (read-only) ──────────────────────────────
  readonly metricas     = computed(() => this._state().metricas);
  readonly filtroEstado = computed(() => this._state().filtroEstado);
  readonly busqueda      = computed(() => this._state().busqueda);
  readonly isLoading    = computed(() => this._state().isLoading);
  readonly error        = computed(() => this._state().error);

  /** Lista derivada: aplica filtro de estado + búsqueda de texto en cliente. */
  readonly listaFiltrada = computed(() => {
    const { lista, filtroEstado, busqueda } = this._state();
    const q = busqueda.trim().toLowerCase();
    return lista.filter((c) => {
      const okEstado = filtroEstado === 'TODOS' || c.estado === filtroEstado;
      const okBusqueda =
        q === '' ||
        c.razon_social.toLowerCase().includes(q) ||
        c.nombre_comercial.toLowerCase().includes(q) ||
        c.ruc.includes(q) ||
        c.codigo_verificacion.toLowerCase().includes(q) ||
        (c.ubicacion?.toLowerCase().includes(q) ?? false);
      return okEstado && okBusqueda;
    });
  });

  // ── Mutaciones (siempre por método nombrado) ───────────────────
  setLoading(v: boolean): void {
    this._state.update((s) => ({ ...s, isLoading: v }));
  }

  setLista(lista: CertificadoAdminRead[]): void {
    this._state.update((s) => ({ ...s, lista, error: null }));
  }

  setMetricas(metricas: CertificadoMetrics): void {
    this._state.update((s) => ({ ...s, metricas }));
  }

  setFiltroEstado(filtroEstado: EstadoCertificado | 'TODOS'): void {
    this._state.update((s) => ({ ...s, filtroEstado }));
  }

  setBusqueda(busqueda: string): void {
    this._state.update((s) => ({ ...s, busqueda }));
  }

  setError(error: string): void {
    this._state.update((s) => ({ ...s, error }));
  }

  clearError(): void {
    this._state.update((s) => ({ ...s, error: null }));
  }

  reset(): void {
    this._state.set(INITIAL);
  }
}
