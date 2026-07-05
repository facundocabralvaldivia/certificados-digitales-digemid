import { ChangeDetectionStrategy, Component, Input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { CertificadosService } from '../../../core/services/certificados.service';
import { VerificacionBlockchainService, VerificacionResponse } from '../../../core/services/verificacion-blockchain.service';
import { BlockchainReaderService } from '../../../core/services/blockchain-reader.service';
import { CertificadoPublicoRead } from '../../../core/models/certificados.models';
import { canonicalize, hashLeaf, verifyProof } from '../../../core/utils/merkle-verify.util';
import { toCertificadoPublico, UUID_RE } from './verificacion.mapper';

import { CertStatusBadgeComponent } from './cert-status-badge.component';
import { CertEstablishmentCardComponent } from './cert-establishment-card.component';
import { CertBlockchainInfoComponent } from './cert-blockchain-info.component';
import { CertPdfViewerComponent } from './cert-pdf-viewer.component';

type EstadoVista = 'cargando' | 'ok' | 'invalido' | 'error';

/**
 * Página PÚBLICA de verificación (sin login). Destino del escaneo del QR:
 *   /verificar/:codigo
 *
 * Acepta códigos demo (DIGEMID-DEMO-xxx) vía backend FastAPI o UUIDs del flujo
 * Web3 (SQL Server + Merkle + Polygon Amoy).
 */
@Component({
  selector: 'app-cert-verification-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    CertStatusBadgeComponent,
    CertEstablishmentCardComponent,
    CertBlockchainInfoComponent,
    CertPdfViewerComponent,
  ],
  template: `
    <main class="mx-auto w-full max-w-xl px-4 pb-16 pt-6 sm:pt-10">
      @switch (estado()) {
        @case ('cargando') {
          <div class="flex flex-col items-center gap-4 py-24 text-center" role="status" aria-live="polite">
            <span
              class="h-12 w-12 animate-spin rounded-full border-4 border-dicer-cert-mint border-t-dicer-cert-teal"
              aria-hidden="true"
            ></span>
            <p class="text-sm font-medium text-dicer-cert-primary">Verificando certificado…</p>
          </div>
        }

        @case ('error') {
          <div class="rounded-2xl border-2 border-dicer-cert-danger bg-dicer-cert-danger/5 px-6 py-10 text-center">
            <span class="text-5xl" aria-hidden="true">❌</span>
            <h1 class="mt-4 text-xl font-extrabold text-dicer-cert-danger">Certificado no encontrado</h1>
            <p class="mx-auto mt-2 max-w-sm text-sm text-dicer-cert-primary/80">
              El código escaneado no corresponde a ningún certificado emitido por DIGEMID.
              Desconfíe de este establecimiento y repórtelo.
            </p>
            <p class="mt-4 text-xs text-dicer-cert-secondary">Código: {{ codigo }}</p>
          </div>
        }

        @case ('invalido') {
          <div class="rounded-2xl border-2 border-dicer-cert-danger bg-dicer-cert-danger/5 px-6 py-10 text-center">
            <span class="text-5xl" aria-hidden="true">⚠️</span>
            <h1 class="mt-4 text-xl font-extrabold text-dicer-cert-danger">
              Certificado inválido o modificado
            </h1>
            <p class="mx-auto mt-2 max-w-sm text-sm text-dicer-cert-primary/80">
              Los datos no coinciden con el registro anclado en blockchain. No confíe en este
              certificado y repórtelo a DIGEMID.
            </p>
            <p class="mt-4 text-xs text-dicer-cert-secondary">Código: {{ codigo }}</p>
          </div>
        }

        @case ('ok') {
          @if (cert(); as c) {
            <div class="flex flex-col gap-8">
              <header class="text-center">
                <h1 class="text-2xl font-extrabold leading-tight text-dicer-cert-primary sm:text-3xl">
                  Registro Nacional de Administradores
                </h1>
                <p class="mt-3 text-[0.7rem] text-dicer-cert-secondary">
                  Consulta realizada el {{ c.consultado_en | date: 'dd/MM/yyyy HH:mm' }}
                </p>
              </header>

              <app-cert-status-badge [estado]="c.estado" />

              <app-cert-establishment-card [certificado]="c" />

              <div class="flex flex-col gap-5">
                <app-cert-blockchain-info [data]="c.blockchain" [integridad]="c.integridad" />

                <app-cert-pdf-viewer [pdfPath]="c.certificado_pdf_url" />
              </div>

              <div class="text-center">
                <p class="text-xs font-semibold text-dicer-cert-primary sm:text-sm">
                  Iniciativa Conjunta
                </p>
                <div class="mt-3 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
                  <img
                    src="/digemid_propio_logo.png"
                    alt="DIGEMID"
                    class="h-9 w-auto max-w-[5.5rem] object-contain sm:max-w-[6.5rem]"
                  />
                  <img
                    src="/cqfp_logo.png"
                    alt="CQFP"
                    class="h-9 w-auto max-w-[5.5rem] object-contain sm:max-w-[6.5rem]"
                  />
                  <img
                    src="/ccl_logo.png"
                    alt="CCL"
                    class="h-9 w-auto max-w-[5.5rem] object-contain sm:max-w-[6.5rem]"
                  />
                  <img
                    src="/mef_logo.png"
                    alt="MEF"
                    class="h-9 w-auto max-w-[5.5rem] object-contain sm:max-w-[6.5rem]"
                  />
                </div>
              </div>
            </div>
          }
        }
      }
    </main>
  `,
})
export class CertVerificationPageComponent implements OnInit {
  @Input({ required: true }) codigo!: string;

  protected readonly estado = signal<EstadoVista>('cargando');
  protected readonly cert = signal<CertificadoPublicoRead | null>(null);

  constructor(
    private readonly certificados: CertificadosService,
    private readonly verificacionBlockchain: VerificacionBlockchainService,
    private readonly chain: BlockchainReaderService,
  ) {}

  ngOnInit(): void {
    if (UUID_RE.test(this.codigo)) {
      this.cargarBlockchain(this.codigo);
    } else {
      this.cargarDemo(this.codigo);
    }
  }

  private cargarDemo(codigo: string): void {
    this.certificados.verificar(codigo).subscribe({
      next: (data) => {
        this.cert.set(data);
        this.estado.set('ok');
      },
      error: () => this.estado.set('error'),
    });
  }

  private cargarBlockchain(id: string): void {
    this.verificacionBlockchain.obtenerVerificacion(id).subscribe({
      next: (resp) => {
        void this.procesarBlockchain(resp);
      },
      error: () => this.estado.set('error'),
    });
  }

  private async procesarBlockchain(resp: VerificacionResponse): Promise<void> {
    try {
      const canonical = canonicalize(resp.establecimiento as unknown as Record<string, unknown>);
      const leaf = hashLeaf(canonical);
      const proofOk = verifyProof(leaf, resp.merkleProof, resp.merkleRoot);

      let rootOk = true;
      if (this.chain.contratoConfigurado) {
        const rootOnChain = await this.chain.leerRoot(resp.batchId);
        rootOk = rootOnChain.toLowerCase() === resp.merkleRoot.toLowerCase();
      }

      if (!proofOk || !rootOk) {
        this.estado.set('invalido');
        return;
      }

      this.cert.set(toCertificadoPublico(resp, 'VERIFICADO'));
      this.estado.set('ok');
    } catch {
      this.estado.set('error');
    }
  }
}
