import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Layout para el tipo de usuario PUBLICO (ciudadano, sin login).
 * Completa el caso pendiente descrito en AGENTS.md §"Estado mocked":
 * `activeLayout() === 'publico'` ya no renderiza un <router-outlet> vacío.
 *
 * Es deliberadamente mínimo: barra institucional superior + outlet + pie.
 * No tiene sidebar ni navegación de sesión (el ciudadano no inicia sesión).
 */
@Component({
  selector: 'app-publico-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <div class="font-lato flex min-h-screen flex-col bg-dicer-cert-mint/20">
      <!-- Logo DIGEMID — tamaño: ajustar h-* y max-w-* en la etiqueta <img> de abajo -->
      <header class="sticky top-0 z-50 border-b border-dicer-cert-mint bg-white shadow-sm">
        <div class="mx-auto flex w-full max-w-xl justify-center px-4 py-3">
          <img
            src="/digemid_logo.png"
            alt="DIGEMID"
            class="h-12 w-auto max-w-[20rem] object-contain"
          />
        </div>
      </header>

      <div class="flex-1">
        <router-outlet />
      </div>

      <footer class="border-t border-dicer-cert-mint bg-white">
        <div class="mx-auto w-full max-w-xl px-4 py-4 text-center text-xs text-dicer-cert-secondary">
          <span aria-hidden="true">&copy;</span> DIGEMID 2026
        </div>
      </footer>
    </div>
  `,
})
export class PublicoLayoutComponent {}
