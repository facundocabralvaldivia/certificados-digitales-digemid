import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import {
  CERTIFICADOS_PUBLIC_ROUTES,
  CERTIFICADOS_ADMIN_ROUTES,
} from './modules/certificados/routes.certificados';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  {
    path: 'auth/login',
    loadComponent: () =>
      import('./modules/auth/login/login.component').then((m) => m.LoginComponent),
  },

  // ── Compatibilidad: redirige URLs antiguas al flujo unificado ─────────────
  {
    path: 'verificar-blockchain/:codigo',
    redirectTo: 'verificar/:codigo',
    pathMatch: 'full',
  },

  // ── Verificación pública (sin login) — envuelta en el layout PUBLICO ──────
  {
    path: '',
    loadComponent: () =>
      import('./modules/shell/layouts/publico-layout/publico-layout.component').then(
        (m) => m.PublicoLayoutComponent,
      ),
    children: [...CERTIFICADOS_PUBLIC_ROUTES],
  },

  // ── Zona autenticada (panel interno) ─────────────────────────────────────
  // InternoLayoutComponent es el padre directo: su <router-outlet> renderiza los hijos.
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/shell/layouts/interno-layout/interno-layout.component').then(
        (m) => m.InternoLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'certificados' },
      ...CERTIFICADOS_ADMIN_ROUTES,
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];
