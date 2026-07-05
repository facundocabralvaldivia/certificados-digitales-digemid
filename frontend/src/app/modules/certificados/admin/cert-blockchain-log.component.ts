import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { TransaccionBlockchainRead, EstadoTx } from '../../../core/models/certificados.models';

/**
 * Log de transacciones recientes en Polygon (panel INTERNO).
 * Presentacional: recibe las transacciones y las muestra como timeline compacta.
 */
@Component({
  selector: 'app-cert-blockchain-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <section class="rounded-2xl border border-dicer-cert-secondary/20 bg-white">
      <header class="flex items-center gap-2 border-b border-dicer-cert-mint px-5 py-4">
        <span aria-hidden="true">⛓️</span>
        <h3 class="text-sm font-bold text-dicer-cert-primary">Transacciones recientes en Polygon</h3>
      </header>

      @if (transacciones().length === 0) {
        <p class="px-5 py-8 text-center text-sm text-dicer-cert-secondary">Sin transacciones registradas.</p>
      } @else {
        <ul class="divide-y divide-dicer-cert-mint/60">
          @for (tx of transacciones(); track tx.tx_hash) {
            <li class="flex items-center gap-3 px-5 py-3">
              <span
                class="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                [class]="claseEstado(tx.estado_tx)"
              >
                {{ etiquetaEstado(tx.estado_tx) }}
              </span>

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-dicer-cert-primary">
                  {{ tx.tipo === 'EMISION' ? 'Emisión' : 'Revocación' }} ·
                  <span class="font-mono text-xs text-dicer-cert-secondary">{{ tx.codigo_verificacion }}</span>
                </p>
                <p class="truncate font-mono text-xs text-dicer-cert-secondary">{{ tx.tx_hash }}</p>
              </div>

              <div class="shrink-0 text-right">
                <p class="text-xs font-medium text-dicer-cert-primary">
                  {{ tx.registrado_en | date: 'dd/MM HH:mm' }}
                </p>
                @if (tx.explorer_url) {
                  <a
                    [href]="tx.explorer_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs font-semibold text-dicer-cert-teal hover:underline"
                  >Ver ↗</a>
                }
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class CertBlockchainLogComponent {
  private readonly _txs = signal<TransaccionBlockchainRead[]>([]);

  @Input({ required: true })
  set data(value: TransaccionBlockchainRead[]) {
    this._txs.set(value ?? []);
  }

  protected readonly transacciones = computed(() => this._txs());

  protected etiquetaEstado(estado: EstadoTx): string {
    switch (estado) {
      case 'CONFIRMADA': return 'Confirmada';
      case 'FALLIDA':    return 'Fallida';
      default:           return 'Pendiente';
    }
  }

  protected claseEstado(estado: EstadoTx): string {
    switch (estado) {
      case 'CONFIRMADA': return 'bg-dicer-cert-green/15 text-dicer-cert-green';
      case 'FALLIDA':    return 'bg-dicer-cert-danger/10 text-dicer-cert-danger';
      default:           return 'bg-dicer-cert-secondary/10 text-dicer-cert-secondary';
    }
  }
}
