import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { CertificadosAdminService } from '../../../core/services/certificados-admin.service';
import { TransaccionBlockchainRead } from '../../../core/models/certificados.models';
import { CertBlockchainLogComponent } from './cert-blockchain-log.component';

/**
 * Panel de transacciones blockchain ancladas en Polygon (panel INTERNO).
 */
@Component({
  selector: 'app-cert-transacciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CertBlockchainLogComponent],
  template: `
    <div class="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <header>
        <h1 class="text-2xl font-extrabold text-dicer-cert-primary">Transacciones</h1>
      </header>

      @if (error()) {
        <div class="rounded-xl border border-dicer-cert-danger bg-dicer-cert-danger/5 px-4 py-3 text-sm text-dicer-cert-danger">
          <p>{{ error() }}</p>
          <button
            type="button"
            class="mt-2 rounded-lg bg-dicer-cert-danger px-3 py-1.5 text-xs font-bold text-white"
            (click)="cargarTransacciones()"
          >
            Reintentar
          </button>
        </div>
      }

      @if (cargando()) {
        <div class="flex items-center justify-center gap-3 py-16 text-sm text-dicer-cert-secondary">
          <span
            class="h-8 w-8 animate-spin rounded-full border-4 border-dicer-cert-mint border-t-dicer-cert-teal"
            aria-hidden="true"
          ></span>
          Cargando transacciones…
        </div>
      } @else {
        <div class="mt-6">
          <app-cert-blockchain-log [data]="transacciones()" />
        </div>
      }
    </div>
  `,
})
export class CertTransaccionesComponent implements OnInit {
  private readonly admin = inject(CertificadosAdminService);

  protected readonly transacciones = signal<TransaccionBlockchainRead[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarTransacciones();
  }

  protected cargarTransacciones(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.admin.transacciones().pipe(catchError(() => of(null))).subscribe((txs) => {
      if (txs) {
        this.transacciones.set(txs);
      } else {
        this.error.set('No se pudieron cargar las transacciones. Verifique npm run dev (:8002).');
      }
      this.cargando.set(false);
    });
  }
}
