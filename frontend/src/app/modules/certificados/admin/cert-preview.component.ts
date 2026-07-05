import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';

import { CertificadoPublicoRead } from '../../../core/models/certificados.models';

/**
 * Previsualización del certificado físico + QR antes de emitir (panel INTERNO).
 * Reproduce a escala el documento que se imprimirá y se pegará en el local.
 *
 * NOTA QR: el cuadro del QR es un marcador visual. En el repo real se genera con
 * `angularx-qrcode` (instalar con `pnpm add angularx-qrcode`, NUNCA npm) usando
 * como contenido la URL pública `…/verificar/{codigo_verificacion}`.
 */
@Component({
  selector: 'app-cert-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cert(); as c) {
      <div class="space-y-4">
        <!-- Documento (proporción de impresión) -->
        <article class="mx-auto max-w-md overflow-hidden rounded-2xl border-2 border-dicer-cert-primary bg-white shadow-lg">
          <header class="bg-dicer-cert-primary px-6 py-4 text-center text-white">
            <p class="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-dicer-cert-mint">
              DIGEMID · MINSA Perú
            </p>
            <h2 class="mt-1 text-base font-extrabold leading-tight">
              Certificado de establecimiento autorizado
            </h2>
          </header>

          <div class="grid grid-cols-[1fr_auto] gap-4 px-6 py-5">
            <dl class="space-y-2 text-sm">
              <div>
                <dt class="text-[0.6rem] font-semibold uppercase tracking-wide text-dicer-cert-secondary">Razón social</dt>
                <dd class="font-bold text-dicer-cert-primary">{{ c.razon_social }}</dd>
              </div>
              <div>
                <dt class="text-[0.6rem] font-semibold uppercase tracking-wide text-dicer-cert-secondary">Nombre comercial</dt>
                <dd class="font-medium text-dicer-cert-primary">{{ c.nombre_comercial }}</dd>
              </div>
              <div>
                <dt class="text-[0.6rem] font-semibold uppercase tracking-wide text-dicer-cert-secondary">RUC</dt>
                <dd class="font-mono font-bold text-dicer-cert-primary">{{ c.ruc }}</dd>
              </div>
              <div>
                <dt class="text-[0.6rem] font-semibold uppercase tracking-wide text-dicer-cert-secondary">Dirección</dt>
                <dd class="text-dicer-cert-primary">{{ c.direccion }}</dd>
              </div>
            </dl>

            <!-- Marcador QR -->
            <div class="flex flex-col items-center gap-1">
              <div
                class="grid h-28 w-28 place-items-center rounded-lg border-2 border-dicer-cert-primary bg-[repeating-conic-gradient(#0F4164_0_25%,#fff_0_50%)] bg-[length:14px_14px]"
                aria-label="Código QR de verificación"
              >
                <span class="rounded bg-white px-1 text-[0.55rem] font-bold text-dicer-cert-primary">QR</span>
              </div>
              <span class="font-mono text-[0.55rem] text-dicer-cert-secondary">{{ c.codigo_verificacion }}</span>
            </div>
          </div>

          <div class="border-t border-dicer-cert-mint px-6 py-3 text-center">
            <p class="text-[0.6rem] leading-snug text-dicer-cert-secondary">
              Escanee el código QR para verificar este certificado en tiempo real.
              Respaldado por blockchain (Polygon).
            </p>
          </div>
        </article>

        <!-- Acción de emisión o enlace público -->
        @if (!soloLectura) {
          <div class="mx-auto flex max-w-md items-center gap-3">
            <button
              type="button"
              class="flex-1 rounded-xl bg-dicer-cert-teal px-4 py-3 text-sm font-bold text-white transition
                     hover:bg-dicer-cert-teal/90 focus:outline-none focus:ring-2 focus:ring-dicer-cert-teal
                     focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              [disabled]="emitiendoFlag()"
              (click)="confirmarEmision()"
            >
              {{ emitiendoFlag() ? 'Anclando en Polygon…' : 'Emitir y anclar en blockchain' }}
            </button>
          </div>
        } @else {
          <div class="mx-auto max-w-md text-center">
            <a
              [href]="urlPublica()"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex w-full items-center justify-center rounded-xl border-2 border-dicer-cert-teal
                     px-4 py-3 text-sm font-bold text-dicer-cert-teal transition hover:bg-dicer-cert-teal/10"
            >
              Abrir verificación pública ↗
            </a>
          </div>
        }
      </div>
    }
  `,
})
export class CertPreviewComponent {
  private readonly _cert = signal<CertificadoPublicoRead | null>(null);
  private readonly _emitiendo = signal<boolean>(false);

  @Input({ required: true })
  set certificado(value: CertificadoPublicoRead) {
    this._cert.set(value);
  }

  @Input()
  set emitiendo(value: boolean) {
    this._emitiendo.set(value);
  }

  /** Si true, oculta el botón de emisión (certificado ya registrado). */
  @Input() soloLectura = false;

  @Output() readonly emitir = new EventEmitter<string>();

  protected readonly cert = computed(() => this._cert());
  protected readonly emitiendoFlag = computed(() => this._emitiendo());

  protected confirmarEmision(): void {
    const c = this._cert();
    if (c) { this.emitir.emit(c.codigo_verificacion); }
  }

  protected urlPublica(): string {
    const c = this._cert();
    return c ? `/verificar/${encodeURIComponent(c.codigo_verificacion)}` : '#';
  }
}
