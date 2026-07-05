import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

import { CertificadoPublicoRead } from '../../../core/models/certificados.models';

/**
 * Ficha minimalista del establecimiento y director técnico.
 * Nombres fuera del bloque blanco; el resto de campos en lista vertical.
 */
@Component({
  selector: 'app-cert-establishment-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="flex flex-col gap-4">
      <!-- Nombres (fuera del bloque de datos) -->
      <div class="text-center">
        <h2 class="text-xl font-extrabold leading-tight text-dicer-cert-primary sm:text-2xl">
          {{ cert().nombre_comercial }}
        </h2>
        <p class="mt-1 text-sm text-dicer-cert-primary/75">
          {{ cert().razon_social }}
        </p>
      </div>

      <!-- Datos en un solo bloque blanco -->
      <div class="rounded-2xl border border-dicer-cert-mint/60 bg-white px-5 py-5 shadow-sm">
        <ul class="space-y-3.5 text-sm text-dicer-cert-primary">
          <li>
            <span class="font-bold">RUC:</span>
            {{ cert().ruc }}
          </li>
          <li>
            <span class="font-bold">Dirección:</span>
            {{ cert().direccion }}
          </li>
          @if (cert().ubicacion) {
            <li>
              <span class="font-bold">Ubicación:</span>
              {{ cert().ubicacion }}
            </li>
          }
          <li>
            <span class="font-bold">Director Técnico:</span>
            {{ cert().tecnico.nombre }}
          </li>
          <li>
            <span class="font-bold">N° de Colegiatura:</span>
            {{ cert().tecnico.numero_colegiatura }}
          </li>
          <li class="flex flex-wrap items-center gap-2">
            <span class="font-bold">Estado de colegiatura:</span>
            <span
              class="inline-flex items-center justify-center rounded-full px-3 py-0.5 text-xs font-bold"
              [class]="claseColegiatura()"
            >
              {{ colegiaturaActiva() ? 'Activo' : 'Inactivo' }}
            </span>
          </li>
          <li>
            <span class="font-bold">Horario del DT:</span>
            {{ cert().tecnico.horario_atencion }}
          </li>
        </ul>
      </div>
    </article>
  `,
})
export class CertEstablishmentCardComponent {
  private readonly _cert = signal<CertificadoPublicoRead | null>(null);

  @Input({ required: true })
  set certificado(value: CertificadoPublicoRead) {
    this._cert.set(value);
  }

  protected readonly cert = computed<CertificadoPublicoRead>(
    () => this._cert() ?? ({ tecnico: {} } as CertificadoPublicoRead),
  );

  protected readonly colegiaturaActiva = computed(
    () => this.cert().tecnico?.estado_colegiatura === 'ACTIVO',
  );

  protected readonly claseColegiatura = computed(() =>
    this.colegiaturaActiva()
      ? 'bg-dicer-cert-green/15 text-dicer-cert-green'
      : 'bg-dicer-cert-danger/10 text-dicer-cert-danger',
  );
}
