import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  signal,
  viewChild,
} from '@angular/core';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * Visualizador PDF con PDF.js: calcula el zoom según el ancho del contenedor.
 * Funciona en iOS/Safari (el iframe nativo ignora #view=FitH).
 */
@Component({
  selector: 'app-cert-pdf-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="overflow-hidden rounded-xl border border-dicer-cert-mint bg-white shadow-sm">
      @if (cargando()) {
        <div
          class="flex h-48 items-center justify-center text-sm text-dicer-cert-secondary"
          role="status"
          aria-live="polite"
        >
          Cargando certificado…
        </div>
      }

      @if (error()) {
        <div class="px-4 py-6 text-center text-sm text-dicer-cert-danger">
          No se pudo cargar el certificado.
        </div>
      }

      <div
        #viewport
        class="max-h-[32rem] overflow-y-auto bg-white"
        [class.hidden]="cargando() || error()"
      >
        <div #pagesHost class="w-full"></div>
      </div>

      <div class="border-t border-dicer-cert-mint/60 px-4 py-2.5 text-center">
        <a
          [href]="pdfHref"
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs font-semibold text-dicer-cert-teal hover:underline"
        >
          Abrir certificado en nueva pestaña ↗
        </a>
      </div>
    </section>
  `,
})
export class CertPdfViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) pdfPath!: string;

  private readonly viewportRef = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly pagesHostRef = viewChild<ElementRef<HTMLElement>>('pagesHost');

  private resizeObserver: ResizeObserver | null = null;
  private pdfDoc: PDFDocumentProxy | null = null;
  private renderToken = 0;
  private viewReady = false;

  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected pdfHref = '';

  ngAfterViewInit(): void {
    this.viewReady = true;
    const viewport = this.viewportRef()?.nativeElement;
    if (!viewport) {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      void this.renderPaginas();
    });
    this.resizeObserver.observe(viewport);

    void this.cargarPdf();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pdfPath'] && !changes['pdfPath'].firstChange && this.viewReady) {
      void this.cargarPdf();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    void this.pdfDoc?.destroy();
  }

  private async cargarPdf(): Promise<void> {
    this.cargando.set(true);
    this.error.set(false);
    this.pdfHref = encodeURI(this.pdfPath);

    void this.pdfDoc?.destroy();
    this.pdfDoc = null;

    try {
      const doc = await getDocument(encodeURI(this.pdfPath)).promise;
      this.pdfDoc = doc;
      await this.renderPaginas();
      this.cargando.set(false);
    } catch {
      this.cargando.set(false);
      this.error.set(true);
    }
  }

  private async renderPaginas(): Promise<void> {
    const host = this.pagesHostRef()?.nativeElement;
    const viewport = this.viewportRef()?.nativeElement;
    const doc = this.pdfDoc;

    if (!host || !viewport || !doc) {
      return;
    }

    const ancho = viewport.clientWidth;
    if (ancho <= 0) {
      return;
    }

    const token = ++this.renderToken;
    host.replaceChildren();

    const dpr = window.devicePixelRatio || 1;

    for (let num = 1; num <= doc.numPages; num++) {
      if (token !== this.renderToken) {
        return;
      }

      const page = await doc.getPage(num);
      const base = page.getViewport({ scale: 1 });
      const escala = ancho / base.width;
      const escalaRender = escala * dpr;
      const vp = page.getViewport({ scale: escalaRender });

      const canvas = document.createElement('canvas');
      canvas.className = 'block w-full';
      canvas.width = vp.width;
      canvas.height = vp.height;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        continue;
      }

      host.appendChild(canvas);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
    }
  }
}
