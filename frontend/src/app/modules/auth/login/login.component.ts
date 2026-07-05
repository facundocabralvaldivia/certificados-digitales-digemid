import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthStore } from '../../../core/store/auth.store';

const USUARIO_VALIDO = 'demo';
const CLAVE_VALIDA = 'demo123';

/**
 * Login demo del panel interno. Valida credenciales fijas (demo / demo123).
 */
@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-dicer-cert-primary px-4 py-10">
      <div class="w-full max-w-sm">
        <div class="mb-6 text-center text-white">
          <img
            src="/digemid_blanco.png"
            alt="DIGEMID"
            class="mx-auto mb-4 h-14 w-auto max-w-[12rem] object-contain"
          />
          <h1 class="text-xl font-extrabold leading-tight">Plataforma de Certificados Criptográficos</h1>
          <p class="mt-1 text-sm text-dicer-cert-mint">Panel Administrativo V0.0.1</p>
        </div>

        <form
          class="space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          (ngSubmit)="ingresar()"
        >
          <div>
            <label
              for="login-usuario"
              class="mb-1 block text-xs font-bold uppercase tracking-wide text-dicer-cert-secondary"
            >
              Usuario
            </label>
            <input
              id="login-usuario"
              type="text"
              autocomplete="username"
              placeholder="Ingrese su usuario"
              class="w-full rounded-lg border border-dicer-cert-secondary/30 bg-white px-3 py-2 text-sm
                     text-dicer-cert-primary placeholder:text-dicer-cert-secondary/50
                     focus:border-dicer-cert-teal focus:outline-none focus:ring-2 focus:ring-dicer-cert-teal/40"
              [ngModel]="usuario()"
              (ngModelChange)="usuario.set($event)"
              name="usuario"
            />
          </div>
          <div>
            <label
              for="login-clave"
              class="mb-1 block text-xs font-bold uppercase tracking-wide text-dicer-cert-secondary"
            >
              Contraseña
            </label>
            <input
              id="login-clave"
              type="password"
              autocomplete="current-password"
              placeholder="Ingrese su contraseña"
              class="w-full rounded-lg border border-dicer-cert-secondary/30 bg-white px-3 py-2 text-sm
                     text-dicer-cert-primary placeholder:text-dicer-cert-secondary/50
                     focus:border-dicer-cert-teal focus:outline-none focus:ring-2 focus:ring-dicer-cert-teal/40"
              [ngModel]="clave()"
              (ngModelChange)="clave.set($event)"
              name="clave"
            />
          </div>

          @if (error()) {
            <p class="rounded-lg bg-dicer-cert-danger/10 px-3 py-2 text-center text-xs font-medium text-dicer-cert-danger">
              {{ error() }}
            </p>
          }

          <button
            type="submit"
            class="w-full rounded-lg bg-dicer-cert-teal px-4 py-2.5 text-sm font-bold text-white transition
                   hover:bg-dicer-cert-teal/90 focus:outline-none focus:ring-2 focus:ring-dicer-cert-teal
                   focus:ring-offset-2"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly usuario = signal('');
  protected readonly clave = signal('');
  protected readonly error = signal<string | null>(null);

  protected ingresar(): void {
    this.error.set(null);

    if (this.usuario() !== USUARIO_VALIDO || this.clave() !== CLAVE_VALIDA) {
      this.error.set('Usuario o contraseña incorrectos.');
      return;
    }

    this.authStore.loginDemo('Administrador DIGEMID');
    void this.router.navigate(['/app/certificados']);
  }
}
