import { Routes } from '@angular/router';

import { roleGuard } from '../../core/guards/role.guard';

/**
 * Rutas del dominio CERTIFICADOS.
 *
 * INTEGRACIÓN (AGENTS.md §"Patrón de Ruta con guard" y README §17):
 *  - La ruta PÚBLICA `verificar/:codigo` va FUERA del bloque `/app` (sin authGuard).
 *    Debe registrarse en `app.routes.ts` a nivel raíz, junto a `/auth/login`.
 *  - Las rutas administrativas van DENTRO del bloque `path: 'app'`, con roleGuard.
 *
 * Se exponen como dos arrays para copiarlos al lugar correcto de `app.routes.ts`.
 */

/** Rutas públicas (sin login) — registrar a nivel raíz del router. */
export const CERTIFICADOS_PUBLIC_ROUTES: Routes = [
  {
    // Destino del escaneo del QR. Resuelve a layout 'publico'.
    path: 'verificar/:codigo',
    loadComponent: () =>
      import('./verificacion/cert-verification-page.component')
        .then((m) => m.CertVerificationPageComponent),
  },
];

/** Rutas internas (requieren login) — anidar dentro de `path: 'app'`. */
export const CERTIFICADOS_ADMIN_ROUTES: Routes = [
  {
    path: 'certificados',
    canActivate: [roleGuard],
    data: {
      roles: ['INTERNO'],
      permiso: 'CERTIFICADOS.panel',
      flagReq: 'can_view',
    },
    loadComponent: () =>
      import('./admin/cert-dashboard.component').then((m) => m.CertDashboardComponent),
  },
  {
    path: 'transacciones',
    canActivate: [roleGuard],
    data: {
      roles: ['INTERNO'],
      permiso: 'CERTIFICADOS.panel',
      flagReq: 'can_view',
    },
    loadComponent: () =>
      import('./admin/cert-transacciones.component').then((m) => m.CertTransaccionesComponent),
  },
];
