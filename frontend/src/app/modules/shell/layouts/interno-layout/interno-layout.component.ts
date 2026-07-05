import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthStore } from '../../../../core/store/auth.store';

interface NavItem {
  label: string;
  path: string;
}

const NAV_INTERNO: NavItem[] = [
  { label: 'Certificados', path: '/app/certificados' },
  { label: 'Transacciones', path: '/app/transacciones' },
];

/**
 * Layout INTERNO (demo): sidebar simple colapsable + router-outlet.
 */
@Component({
  selector: 'app-interno-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen bg-dicer-cert-mint/20">
      <!-- Sidebar -->
      <aside
        class="flex shrink-0 flex-col bg-dicer-cert-primary text-white transition-all duration-200"
        [class]="sidebarOpen() ? 'w-60' : 'w-16'"
      >
        <div class="flex items-center gap-2 px-3 py-4">
          <button
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-lg"
            (click)="toggleSidebar()"
            aria-label="Alternar menú"
          >
            ☰
          </button>
          @if (sidebarOpen()) {
            <img
              src="/digemid_blanco.png"
              alt="DIGEMID"
              class="h-8 w-auto max-w-[9rem] object-contain"
            />
          }
        </div>

        <nav class="mt-2 flex flex-1 flex-col gap-1 px-2">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-white/15"
              class="rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-white/10"
              [class.text-center]="!sidebarOpen()"
            >
              @if (sidebarOpen()) {
                {{ item.label }}
              } @else {
                {{ item.label.charAt(0) }}
              }
            </a>
          }
        </nav>

        <div class="border-t border-white/10 p-2">
          <button
            type="button"
            class="w-full rounded-lg px-3 py-2.5 text-sm font-medium text-dicer-cert-mint transition hover:bg-white/10"
            [class.text-center]="!sidebarOpen()"
            (click)="cerrarSesion()"
          >
            @if (sidebarOpen()) {
              Cerrar sesión
            } @else {
              Salir
            }
          </button>
        </div>
      </aside>

      <!-- Contenido -->
      <div class="flex min-w-0 flex-1 flex-col">
        <header class="flex items-center justify-between border-b border-dicer-cert-mint bg-white px-6 py-3">
          <h2 class="text-sm font-bold text-dicer-cert-primary">Plataforma de Certificados Criptográficos</h2>
          <span class="text-xs font-medium text-dicer-cert-secondary">Panel Administrado V0.0.1</span>
        </header>
        <main class="flex-1 overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class InternoLayoutComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly nav = NAV_INTERNO;
  protected readonly sidebarOpen = signal(true);

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  protected cerrarSesion(): void {
    this.authStore.logout();
    void this.router.navigate(['/auth/login']);
  }
}
