import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

import { EstadoCertificado } from '../../../core/models/certificados.models';

/**
 * Badge grande de estado de habilitación del establecimiento.
 * Pieza central de la lectura del ciudadano: debe entenderse de un vistazo,
 * sin depender solo del color (ícono + texto explícito), pensado para baja
 * alfabetización digital.
 *
 *  HABILITADO     → verde institucional (dicer-cert-green)
 *  NO_HABILITADO  → rojo institucional  (dicer-cert-danger)
 *  REVOCADO       → rojo institucional  (dicer-cert-danger)
 */
@Component({
  selector: 'app-cert-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex min-h-[5.5rem] flex-col items-center justify-center rounded-2xl border-2
             px-5 py-4 text-center shadow-sm"
      [class]="contenedorClass()"
      role="status"
      [attr.aria-label]="'Estado del establecimiento: ' + etiqueta()"
    >
      <span class="text-[0.7rem] font-semibold uppercase tracking-wider opacity-80">
        Estado del establecimiento
      </span>
      <span class="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">{{ etiqueta() }}</span>
    </div>
  `,
})
export class CertStatusBadgeComponent {
  private readonly _estado = signal<EstadoCertificado>('NO_HABILITADO');

  @Input({ required: true })
  set estado(value: EstadoCertificado) {
    this._estado.set(value);
  }

  protected readonly esHabilitado = computed(() => this._estado() === 'HABILITADO');

  protected readonly etiqueta = computed(() => {
    switch (this._estado()) {
      case 'HABILITADO':    return 'HABILITADO';
      case 'REVOCADO':      return 'REVOCADO';
      default:              return 'NO HABILITADO';
    }
  });

  protected readonly contenedorClass = computed(() =>
    this.esHabilitado()
      ? 'border-dicer-cert-green bg-dicer-cert-green/10 text-dicer-cert-green'
      : 'border-dicer-cert-danger bg-dicer-cert-danger/10 text-dicer-cert-danger',
  );
}
