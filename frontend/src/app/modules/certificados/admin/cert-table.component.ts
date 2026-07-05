import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CertificadoAdminRead } from '../../../core/models/certificados.models';

/**
 * Tabla de establecimientos con certificado (panel INTERNO).
 * Presentacional: recibe las filas ya filtradas desde el store del dashboard.
 */
@Component({
  selector: 'app-cert-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden rounded-2xl border border-dicer-cert-secondary/20 bg-white">
      <!-- Vista tabla (>= sm) -->
      <table class="hidden w-full text-left text-sm sm:table">
        <thead class="bg-dicer-cert-primary text-xs uppercase tracking-wide text-white">
          <tr>
            <th scope="col" class="px-4 py-3 font-semibold">Establecimiento</th>
            <th scope="col" class="px-4 py-3 font-semibold">RUC</th>
            <th scope="col" class="px-4 py-3 font-semibold">Estado</th>
            <th scope="col" class="px-4 py-3 font-semibold">Blockchain</th>
            <th scope="col" class="px-4 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dicer-cert-mint/60">
          @for (cert of filas(); track cert.id) {
            <tr class="transition hover:bg-dicer-cert-mint/30">
              <td class="px-4 py-3">
                <p class="font-bold text-dicer-cert-primary">{{ cert.nombre_comercial }}</p>
                <p class="text-xs text-dicer-cert-secondary">{{ cert.razon_social }}</p>
                @if (cert.ubicacion) {
                  <p class="mt-0.5 text-xs text-dicer-cert-secondary/80">{{ cert.ubicacion }}</p>
                }
              </td>
              <td class="px-4 py-3 font-mono text-dicer-cert-primary">{{ cert.ruc }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                  [class]="claseEstado(cert.estado)"
                >{{ etiquetaEstado(cert.estado) }}</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                  [class]="claseAnclaje(cert)"
                >{{ etiquetaAnclaje(cert) }}</span>
                <p class="mt-0.5 text-xs text-dicer-cert-secondary">{{ etiquetaRed(cert.red) }}</p>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-dicer-cert-secondary px-3 py-1.5 text-xs font-bold
                           text-dicer-cert-secondary transition hover:bg-dicer-cert-secondary hover:text-white
                           focus:outline-none focus:ring-2 focus:ring-dicer-cert-secondary"
                    (click)="seleccionar(cert)"
                  >Ver detalle</button>
                  <a
                    [href]="urlPublica(cert)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="rounded-lg border border-dicer-cert-teal px-3 py-1.5 text-xs font-bold
                           text-dicer-cert-teal transition hover:bg-dicer-cert-teal hover:text-white"
                  >Verificar ↗</a>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5" class="px-4 py-10 text-center text-dicer-cert-secondary">
                No hay certificados que coincidan con el filtro.
              </td>
            </tr>
          }
        </tbody>
      </table>

      <!-- Vista tarjetas (móvil) -->
      <ul class="divide-y divide-dicer-cert-mint/60 sm:hidden">
        @for (cert of filas(); track cert.id) {
          <li class="px-4 py-3">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="font-bold text-dicer-cert-primary">{{ cert.nombre_comercial }}</p>
                <p class="truncate text-xs text-dicer-cert-secondary">{{ cert.razon_social }}</p>
                <p class="mt-0.5 font-mono text-xs text-dicer-cert-primary">{{ cert.ruc }}</p>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold"
                [class]="claseEstado(cert.estado)"
              >{{ etiquetaEstado(cert.estado) }}</span>
            </div>
            <p class="mt-2 text-xs">
              <span class="font-semibold text-dicer-cert-secondary">Blockchain:</span>
              <span class="ml-1 font-bold" [class]="claseAnclaje(cert)">{{ etiquetaAnclaje(cert) }}</span>
            </p>
            <div class="mt-2 flex gap-2">
              <button
                type="button"
                class="flex-1 rounded-lg border border-dicer-cert-secondary py-1.5 text-xs font-bold
                       text-dicer-cert-secondary transition hover:bg-dicer-cert-secondary hover:text-white"
                (click)="seleccionar(cert)"
              >Ver detalle</button>
              <a
                [href]="urlPublica(cert)"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 rounded-lg border border-dicer-cert-teal py-1.5 text-center text-xs font-bold
                       text-dicer-cert-teal transition hover:bg-dicer-cert-teal hover:text-white"
              >Verificar ↗</a>
            </div>
          </li>
        } @empty {
          <li class="px-4 py-10 text-center text-sm text-dicer-cert-secondary">
            No hay certificados que coincidan con el filtro.
          </li>
        }
      </ul>
    </div>
  `,
})
export class CertTableComponent {
  private readonly _filas = signal<CertificadoAdminRead[]>([]);

  @Input({ required: true })
  set data(value: CertificadoAdminRead[]) {
    this._filas.set(value ?? []);
  }

  @Output() readonly verCertificado = new EventEmitter<CertificadoAdminRead>();

  protected readonly filas = computed(() => this._filas());

  protected seleccionar(cert: CertificadoAdminRead): void {
    this.verCertificado.emit(cert);
  }

  protected urlPublica(cert: CertificadoAdminRead): string {
    return `/verificar/${encodeURIComponent(cert.codigo_verificacion)}`;
  }

  protected etiquetaEstado(estado: CertificadoAdminRead['estado']): string {
    switch (estado) {
      case 'HABILITADO': return 'Habilitado';
      case 'REVOCADO':   return 'Revocado';
      default:           return 'No habilitado';
    }
  }

  protected claseEstado(estado: CertificadoAdminRead['estado']): string {
    return estado === 'HABILITADO'
      ? 'bg-dicer-cert-green/15 text-dicer-cert-green'
      : 'bg-dicer-cert-danger/10 text-dicer-cert-danger';
  }

  protected etiquetaAnclaje(cert: CertificadoAdminRead): string {
    return cert.anclado || cert.tx_hash ? 'Anclado' : 'Pendiente';
  }

  protected claseAnclaje(cert: CertificadoAdminRead): string {
    return cert.anclado || cert.tx_hash
      ? 'bg-dicer-cert-teal/15 text-dicer-cert-teal'
      : 'bg-dicer-cert-secondary/10 text-dicer-cert-secondary';
  }

  protected etiquetaRed(red: CertificadoAdminRead['red']): string {
    return red === 'polygon-mainnet' ? 'Polygon PoS' : 'Polygon Amoy';
  }
}
