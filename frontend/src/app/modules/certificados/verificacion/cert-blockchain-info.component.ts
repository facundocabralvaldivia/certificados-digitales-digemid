import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

import { AnclajeBlockchain, ResultadoIntegridad } from '../../../core/models/certificados.models';

/**
 * Tarjeta unificada de verificación blockchain: integridad criptográfica +
 * enlace opcional a Polygonscan. Sustituye al indicador duplicado superior.
 */
@Component({
  selector: 'app-cert-blockchain-info',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (resultadoIntegridad() === 'VERIFICADO' && anclaje().explorer_url) {
      <a
        [href]="anclaje().explorer_url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex w-full flex-col items-center rounded-xl border border-dicer-cert-mint
               bg-white px-4 py-4 text-center shadow-sm transition
               hover:bg-dicer-cert-mint/10 focus:outline-none focus:ring-2
               focus:ring-dicer-cert-teal focus:ring-offset-2"
        aria-label="Ver prueba de anclaje en Polygonscan"
      >
        <p class="text-xs leading-snug text-dicer-cert-primary/85 sm:text-sm">
          La autenticidad de este certificado ha sido<br />
          verificada en la Blockchain
        </p>
        <img
          src="/check.png"
          alt=""
          aria-hidden="true"
          class="mt-2 h-12 w-12 object-contain"
        />
        <p class="mt-2 text-xs leading-snug text-dicer-cert-primary/70 sm:text-sm">
          Los datos mostrados coinciden con el registro<br />
          inalterable anclado en la red Polygon.
        </p>
        <p class="mt-2 text-xs text-dicer-cert-primary/85 sm:text-sm">
          Ver prueba en blockchain
        </p>
      </a>
    } @else {
      <div
        class="flex w-full flex-col items-center rounded-xl border px-4 py-4 text-center shadow-sm"
        [class]="claseContenedor()"
        role="status"
      >
        @switch (resultadoIntegridad()) {
          @case ('VERIFICADO') {
            <p class="text-xs leading-snug sm:text-sm">
              La autenticidad de este certificado ha sido<br />
              verificada en la Blockchain
            </p>
            <img
              src="/check.png"
              alt=""
              aria-hidden="true"
              class="mt-2 h-12 w-12 object-contain"
            />
            <p class="mt-2 text-xs leading-snug opacity-90 sm:text-sm">
              Los datos mostrados coinciden con el registro<br />
              inalterable anclado en la red Polygon.
            </p>
          }
          @case ('ALTERADO') {
            <p class="text-xs leading-snug sm:text-sm">
              Advertencia: los datos no coinciden<br />
              con el registro anclado en blockchain
            </p>
            <span class="mt-2 text-4xl leading-none" aria-hidden="true">⚠️</span>
            <p class="mt-2 text-xs opacity-90 sm:text-sm">
              No confíe en este certificado y repórtelo a DIGEMID.
            </p>
          }
          @default {
            <p class="text-xs leading-snug sm:text-sm">
              Certificado emitido; pendiente de<br />
              confirmación en blockchain
            </p>
            <span class="mt-2 text-4xl leading-none" aria-hidden="true">⏳</span>
            <p class="mt-2 text-xs opacity-90 sm:text-sm">
              Vuelva a consultar en unos minutos.
            </p>
          }
        }
      </div>
    }
  `,
})
export class CertBlockchainInfoComponent {
  private readonly _anclaje = signal<AnclajeBlockchain | null>(null);
  private readonly _integridad = signal<ResultadoIntegridad>('NO_ANCLADO');

  @Input({ required: true })
  set data(value: AnclajeBlockchain) {
    this._anclaje.set(value);
  }

  @Input({ required: true })
  set integridad(value: ResultadoIntegridad) {
    this._integridad.set(value);
  }

  protected readonly anclaje = computed<AnclajeBlockchain>(
    () => this._anclaje() ?? ({} as AnclajeBlockchain),
  );

  protected readonly resultadoIntegridad = computed(() => this._integridad());

  protected readonly claseContenedor = computed(() => {
    switch (this._integridad()) {
      case 'VERIFICADO':
        return 'border-dicer-cert-mint bg-white text-dicer-cert-primary';
      case 'ALTERADO':
        return 'border-dicer-cert-danger bg-dicer-cert-danger/5 text-dicer-cert-danger';
      default:
        return 'border-dicer-cert-secondary bg-dicer-cert-secondary/10 text-dicer-cert-secondary';
    }
  });
}
