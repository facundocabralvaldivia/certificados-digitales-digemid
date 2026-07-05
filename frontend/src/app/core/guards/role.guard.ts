import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AuthStore, TipoUsuario } from '../store/auth.store';

interface RoleData {
  roles?: TipoUsuario[];
  permiso?: string;
  flagReq?: string;
}

/**
 * Guard de rol — versión DEMO. Lee `route.data` con la misma forma que el
 * proyecto real (`{ roles, permiso, flagReq }`) y valida tipo de usuario + permiso.
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const data = (route.data ?? {}) as RoleData;

  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  const tipo = authStore.tipoUsuario();
  if (data.roles && data.roles.length > 0 && (!tipo || !data.roles.includes(tipo))) {
    return router.createUrlTree(['/auth/login']);
  }

  if (data.permiso && !authStore.hasPermission(data.permiso, data.flagReq ?? 'can_view')) {
    return router.createUrlTree(['/auth/login']);
  }

  return true;
};
