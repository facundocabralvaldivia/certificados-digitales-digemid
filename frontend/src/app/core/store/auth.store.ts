import { Injectable, computed, signal } from '@angular/core';

export type TipoUsuario = 'INTERNO' | 'EXTERNO' | 'PUBLICO';
export type ActiveLayout = 'interno' | 'externo' | 'publico';

interface AuthState {
  isAuthenticated: boolean;
  tipoUsuario: TipoUsuario | null;
  nombre: string | null;
}

const INITIAL: AuthState = {
  isAuthenticated: false,
  tipoUsuario: null,
  nombre: null,
};

/**
 * Store de autenticación — versión DEMO standalone.
 * Mantiene el patrón del proyecto real (signal privado + computed públicos) pero
 * sin backend de sesión: el login es un mock que habilita el rol INTERNO para
 * recorrer el panel administrativo.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _state = signal<AuthState>(INITIAL);

  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly tipoUsuario = computed(() => this._state().tipoUsuario);
  readonly nombre = computed(() => this._state().nombre);

  /** Deriva el layout activo, igual que el shell del proyecto real. */
  readonly activeLayout = computed<ActiveLayout>(() => {
    const tipo = this._state().tipoUsuario;
    if (!this._state().isAuthenticated || !tipo) { return 'publico'; }
    return tipo === 'INTERNO' ? 'interno' : tipo === 'EXTERNO' ? 'externo' : 'publico';
  });

  /** Login demo: habilita una sesión INTERNO. */
  loginDemo(nombre = 'Evaluador DIGEMID (demo)'): void {
    this._state.set({ isAuthenticated: true, tipoUsuario: 'INTERNO', nombre });
  }

  logout(): void {
    this._state.set(INITIAL);
  }

  /** RBAC demo: el usuario INTERNO autenticado tiene todos los permisos. */
  hasPermission(_componenteClave: string, _flag: string): boolean {
    return this._state().isAuthenticated && this._state().tipoUsuario === 'INTERNO';
  }
}
