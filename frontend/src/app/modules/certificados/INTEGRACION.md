# Integración del módulo `certificados/` en DICER-FRONT

Pasos para enganchar este dominio al shell, router, navegación y Tailwind
existentes. Todo es **aditivo**: no se modifica ningún patrón de `dicer/`.

---

## 1. Tokens de Tailwind — `tailwind.config.js`

Extender `theme.extend.colors` (junto a `dicer-teal-*` y `dicer-blue-*`):

```js
// tailwind.config.js
module.exports = {
  // ...
  theme: {
    extend: {
      colors: {
        // ...dicer-teal, dicer-blue existentes...
        'dicer-cert': {
          primary:   '#0F4164', // fondos principales, headers
          secondary: '#385C91', // botones secundarios, bordes, acentos
          teal:      '#5AA096', // CTAs principales, badges activos
          mint:      '#AAD2D2', // fondos de cards, hover states
          green:     '#79ab3f', // estado HABILITADO, verificación positiva
          danger:    '#C0392B', // estado NO HABILITADO / alterado (rojo institucional)
        },
      },
    },
  },
};
```

> `danger` se registra dentro de la familia `dicer-cert-*` para cumplir la regla
> «nunca usar rojos genéricos de Tailwind» (AGENTS.md §7). Uso: `bg-dicer-cert-danger`,
> `text-dicer-cert-green`, `border-dicer-cert-teal`, etc.

---

## 2. Shell — soportar el layout `publico`

`AppShellComponent` ya contempla `@case ('interno')` y `@case ('externo')`.
Añadir el caso público y dejar de renderizar un `<router-outlet>` vacío
(tarea pendiente en AGENTS.md §"Estado mocked"):

```typescript
// app-shell.component.ts
import { PublicoLayoutComponent } from './layouts/publico-layout/publico-layout.component';

@switch (authStore.activeLayout()) {
  @case ('interno') { <app-interno-layout /> }
  @case ('externo') { <app-externo-layout /> }
  @case ('publico') { <app-publico-layout /> }
  @default          { <router-outlet />     }
}
```

> La verificación pública NO pasa por `/app` ni por `authGuard`: usa el layout
> público directamente desde una ruta raíz. `activeLayout()` retorna `'publico'`
> cuando no hay sesión iniciada.

---

## 3. Router — `app.routes.ts`

```typescript
import { CERTIFICADOS_PUBLIC_ROUTES, CERTIFICADOS_ADMIN_ROUTES }
  from './modules/certificados/routes.certificados';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: 'auth/login', loadComponent: () => /* ... */ },

  // ── Verificación pública (sin login) ───────────────────────────
  ...CERTIFICADOS_PUBLIC_ROUTES,

  {
    path: 'app',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      // ...rutas dicer existentes...

      // ── MÓDULO CERTIFICADOS (INTERNO) ───────────────────────────
      ...CERTIFICADOS_ADMIN_ROUTES,
    ],
  },
];
```

---

## 4. Navegación interna — `interno-layout.component.ts`

Añadir al array `NAV_INTERNO`:

```typescript
const NAV_INTERNO: NavItem[] = [
  // ...items existentes...
  { label: 'Certificados', path: '/app/certificados', icon: '🪪' },
];
```

---

## 5. Permiso en backend (RBAC)

El `componente_clave` **`CERTIFICADOS.panel`** debe existir en la BD de permisos
y asignarse al rol INTERNO correspondiente. Sin esto, `roleGuard` bloquea
`/app/certificados`. La verificación pública NO requiere permiso alguno.

---

## 6. Modelos

Copiar el contenido de `core/models/certificados.models.ts` dentro de
`core/models/index.ts` (AGENTS.md exige que todos los interfaces vivan ahí).

---

## 7. Interceptor de credenciales

`credentialsInterceptor` debe respetar el token `SKIP_CREDENTIALS`
(definido en `certificados.service.ts`) para NO enviar cookies en la consulta
pública:

```typescript
// credentials.interceptor.ts
import { SKIP_CREDENTIALS } from '../services/certificados.service';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_CREDENTIALS)) {
    return next(req); // verificación pública: sin withCredentials
  }
  return next(req.clone({ withCredentials: true }));
};
```
