import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CertificadosAdminService } from '../../../core/services/certificados-admin.service';
import { VerificacionBlockchainService } from '../../../core/services/verificacion-blockchain.service';
import { CertificadosStore } from '../../../core/store/certificados.store';
import {
  CertificadoAdminRead,
  CertificadoPublicoRead,
  EstadoCertificado,
} from '../../../core/models/certificados.models';
import { toCertificadoPublico } from '../verificacion/verificacion.mapper';
import { environment } from '../../../../environments/environment';

import { CertTableComponent } from './cert-table.component';
import { CertPreviewComponent } from './cert-preview.component';

type FiltroEstado = EstadoCertificado | 'TODOS';

/**
 * Panel administrativo de certificados (tipo de usuario INTERNO).
 * Conectado al backend Web3 (SQL Server + Polygon Amoy).
 */
@Component({
  selector: 'app-cert-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CertTableComponent, CertPreviewComponent],
  template: `
    <div class="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <header>
        <h1 class="text-2xl font-extrabold text-dicer-cert-primary">Certificados Criptográficos</h1>
      </header>

      @if (store.error(); as err) {
        <div class="rounded-xl border border-dicer-cert-danger bg-dicer-cert-danger/5 px-4 py-3 text-sm text-dicer-cert-danger">
          <p>{{ err }}</p>
          <button
            type="button"
            class="mt-2 rounded-lg bg-dicer-cert-danger px-3 py-1.5 text-xs font-bold text-white"
            (click)="cargarDatos()"
          >
            Reintentar
          </button>
        </div>
      }

      @if (store.isLoading()) {
        <div class="flex items-center justify-center gap-3 py-16 text-sm text-dicer-cert-secondary">
          <span
            class="h-8 w-8 animate-spin rounded-full border-4 border-dicer-cert-mint border-t-dicer-cert-teal"
            aria-hidden="true"
          ></span>
          Cargando registros…
        </div>
      } @else {
        <section class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          @for (m of tarjetasMetricas(); track m.clave) {
            <div class="rounded-2xl border border-dicer-cert-mint bg-white px-4 py-4">
              <p class="text-[0.7rem] font-semibold uppercase tracking-wide text-dicer-cert-secondary">{{ m.etiqueta }}</p>
              <p class="mt-1 text-3xl font-extrabold" [class]="m.color">{{ m.valor }}</p>
            </div>
          }
        </section>

        <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap gap-2">
            @for (f of filtros; track f.valor) {
              <button
                type="button"
                class="rounded-full px-3 py-1.5 text-xs font-bold transition focus:outline-none
                       focus:ring-2 focus:ring-dicer-cert-secondary"
                [class]="store.filtroEstado() === f.valor
                  ? 'bg-dicer-cert-primary text-white'
                  : 'bg-white text-dicer-cert-secondary border border-dicer-cert-secondary/30'"
                (click)="aplicarFiltro(f.valor)"
              >{{ f.etiqueta }}</button>
            }
          </div>

          <input
            type="search"
            placeholder="Buscar por nombre, RUC, UUID o ubicación…"
            class="w-full rounded-xl border border-dicer-cert-secondary/30 px-4 py-2 text-sm text-dicer-cert-primary
                   placeholder:text-dicer-cert-secondary/60 focus:border-dicer-cert-teal focus:outline-none
                   focus:ring-2 focus:ring-dicer-cert-teal/40 sm:max-w-xs"
            [ngModel]="store.busqueda()"
            (ngModelChange)="buscar($event)"
          />
        </section>

        <div class="mt-6">
          <app-cert-table [data]="store.listaFiltrada()" (verCertificado)="onVer($event)" />
        </div>
      }
    </div>

    @if (previewOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-dicer-cert-primary/60 px-4 py-8"
        (click)="cerrarPreview()"
      >
        <div class="w-full max-w-lg" (click)="detener($event)">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-bold text-white">Detalle del certificado digital</h2>
            <button
              type="button"
              class="rounded-lg bg-white/15 px-3 py-1 text-sm font-bold text-white hover:bg-white/25"
              (click)="cerrarPreview()"
            >
              Cerrar ✕
            </button>
          </div>
          @if (previewCert(); as pc) {
            <div class="rounded-2xl bg-white p-4">
              <app-cert-preview [certificado]="pc" [soloLectura]="true" />
            </div>
          } @else {
            <div class="rounded-2xl bg-white p-10 text-center text-sm text-dicer-cert-secondary">
              Cargando certificado…
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class CertDashboardComponent implements OnInit {
  protected readonly store = inject(CertificadosStore);
  private readonly admin = inject(CertificadosAdminService);
  private readonly verificacion = inject(VerificacionBlockchainService);

  protected readonly previewOpen = signal(false);
  protected readonly previewCert = signal<CertificadoPublicoRead | null>(null);

  protected readonly filtros: { valor: FiltroEstado; etiqueta: string }[] = [
    { valor: 'TODOS', etiqueta: 'Todos' },
    { valor: 'HABILITADO', etiqueta: 'Habilitados' },
    { valor: 'NO_HABILITADO', etiqueta: 'No habilitados' },
    { valor: 'REVOCADO', etiqueta: 'Revocados' },
  ];

  ngOnInit(): void {
    this.cargarDatos();
  }

  protected cargarDatos(): void {
    this.store.setLoading(true);
    this.store.clearError();

    forkJoin({
      metricas: this.admin.metricas().pipe(catchError(() => of(null))),
      lista: this.admin.listar().pipe(catchError(() => of(null))),
    }).subscribe(({ metricas, lista }) => {
      if (metricas) {
        this.store.setMetricas(metricas);
      }
      if (lista) {
        this.store.setLista(lista);
      }

      if (!lista) {
        this.store.setError(
          'No se pudo cargar el listado. Reinicie pnpm start (proxy) y verifique npm run dev (:8002) + docker start cert-sql.',
        );
      } else if (!metricas) {
        this.store.setError('No se pudieron cargar las métricas.');
      }

      this.store.setLoading(false);
    });
  }

  protected tarjetasMetricas(): { clave: string; etiqueta: string; valor: number; color: string }[] {
    const m = this.store.metricas();
    return [
      { clave: 'emitidos', etiqueta: 'Registrados', valor: m?.total_emitidos ?? 0, color: 'text-dicer-cert-primary' },
      { clave: 'activos', etiqueta: 'Activos', valor: m?.activos ?? 0, color: 'text-dicer-cert-green' },
      { clave: 'revocados', etiqueta: 'Revocados', valor: m?.revocados ?? 0, color: 'text-dicer-cert-danger' },
      { clave: 'pendientes', etiqueta: 'Pend. anclaje', valor: m?.pendientes_anclaje ?? 0, color: 'text-dicer-cert-secondary' },
    ];
  }

  protected aplicarFiltro(valor: FiltroEstado): void {
    this.store.setFiltroEstado(valor);
  }

  protected buscar(texto: string): void {
    this.store.setBusqueda(texto);
  }

  protected onVer(cert: CertificadoAdminRead): void {
    this.previewCert.set(null);
    this.previewOpen.set(true);

    if (cert.anclado && cert.tx_hash) {
      this.verificacion.obtenerVerificacion(cert.codigo_verificacion).subscribe({
        next: (resp) => this.previewCert.set(toCertificadoPublico(resp, 'VERIFICADO')),
        error: () => this.previewCert.set(this.desdeAdmin(cert)),
      });
    } else {
      this.previewCert.set(this.desdeAdmin(cert));
    }
  }

  private desdeAdmin(cert: CertificadoAdminRead): CertificadoPublicoRead {
    return {
      codigo_verificacion: cert.codigo_verificacion,
      razon_social: cert.razon_social,
      nombre_comercial: cert.nombre_comercial,
      ruc: cert.ruc,
      direccion: '—',
      ubicacion: cert.ubicacion,
      tecnico: {
        nombre: '—',
        numero_colegiatura: '—',
        horario_atencion: '—',
        estado_colegiatura: 'ACTIVO',
      },
      estado: cert.estado,
      blockchain: {
        red: cert.red,
        contrato: environment.anchorContractAddress,
        tx_hash: cert.tx_hash ?? '',
        numero_bloque: 0,
        data_hash: '',
        anclado_en: cert.emitido_en ?? new Date().toISOString(),
        explorer_url: cert.tx_hash ? `${environment.explorerTxBase}/${cert.tx_hash}` : '',
      },
      integridad: cert.anclado ? 'VERIFICADO' : 'NO_ANCLADO',
      emitido_en: cert.emitido_en ?? new Date().toISOString(),
      vigente_hasta: null,
      consultado_en: new Date().toISOString(),
      certificado_pdf_url: '/certificado-oficial.pdf',
      anexos: [],
    };
  }

  protected cerrarPreview(): void {
    this.previewOpen.set(false);
    this.previewCert.set(null);
  }

  protected detener(event: Event): void {
    event.stopPropagation();
  }
}
