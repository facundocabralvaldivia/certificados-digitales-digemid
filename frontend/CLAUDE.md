# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este proyecto

Frontend Angular 18 del **Sistema DICER** (Control de Calidad de Medicamentos), plataforma oficial de DIGEMID/MINSA Perú para la vigilancia de lotes farmacéuticos importados. Dos tipos de usuario: **EXTERNO** (laboratorios/titulares que registran solicitudes) e **INTERNO** (evaluadores DIGEMID que emiten dictámenes).

## Comandos clave

Usar siempre **pnpm** — nunca `npm` ni `npx`.

```bash
pnpm install          # instalar dependencias
pnpm start            # dev server en :4200 con proxy hacia :8001 (ejecutar desde frontend/)
pnpm run build        # build producción
pnpm run build:prod   # build con configuración production
```

**pnpm 11 — build scripts bloqueados:** `pnpm run build` y `pnpm start` fallan con `ERR_PNPM_IGNORED_BUILDS`. Usar siempre el CLI de Angular directamente:
```bash
# Dev server:
node node_modules/.pnpm/@angular+cli@18.2.21_chokidar@3.6.0/node_modules/@angular/cli/bin/ng.js serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json

# Build desarrollo:
node node_modules/.pnpm/@angular+cli@18.2.21_chokidar@3.6.0/node_modules/@angular/cli/bin/ng.js build --configuration development

# Build producción:
node node_modules/.pnpm/@angular+cli@18.2.21_chokidar@3.6.0/node_modules/@angular/cli/bin/ng.js build --configuration production

# Fix de esbuild si hace falta (una sola vez):
node node_modules/.pnpm/esbuild@0.23.0/node_modules/esbuild/install.js
```

No hay suite de tests configurada actualmente (`ng test` existe pero sin specs).

## Arquitectura de la aplicación

### Módulos funcionales (`src/app/modules/`)

```
auth/           → compartido — login (público, sin guard)
shell/          → compartido — AppShellComponent + layouts por tipo de usuario
  layouts/
    externo-layout/   → sidebar teal para usuarios EXTERNO
    interno-layout/   → sidebar azul colapsable para usuarios INTERNO
dicer/          → dominio DICER (Control de Calidad de Medicamentos)
  solicitudes/
    lista-solicitudes/  → listado de solicitudes con filtros por estado
    wizard/             → WizardSolicitudComponent (3 pasos: buscar RS → confirmar → lote + upload)
  ensayos/
    matriz/             → MatrizEnsayosComponent (tabla de ensayos con semáforo reactivo)
  evaluacion/
    panel/              → PanelEvaluadorComponent (KPIs + lista filtrable INTERNO)
    dictamen/           → DictamenDetalleComponent (side-by-side + formulario dictamen)
```

**Principio de escalabilidad:** `auth/` y `shell/` son infraestructura compartida por todos los módulos de negocio futuros. Cada nuevo dominio (ej: `farmacias/`, `alertas/`, `admin/`) se añade como carpeta hermana de `dicer/` dentro de `modules/`.

### Shell y layouts

`AppShellComponent` lee el computed signal `authStore.activeLayout()` (derivado de `tipoUsuario`) y renderiza `<app-interno-layout>` o `<app-externo-layout>` con `@switch`. Ambos layouts incluyen `<router-outlet>` internamente. El `ToastContainer` y `LoadingOverlay` viven en el shell, encima de los layouts.

### State management — patrón de stores

Todos los stores usan el mismo patrón: un único `WritableSignal<State>` privado + computed signals públicos de solo lectura. No hay NgRx ni stores externos. Los cuatro stores son:

- `AuthStore` — sesión, usuario, mapa de permisos indexado por `componente_clave`
- `WizardStore` — estado de los 3 pasos del wizard de solicitud (incluye archivos FileEntry y progreso de subida)
- `EnsayosStore` — resultados de ensayos (Map<ensayo_id, ResultadoEnsayoInput>), dictamen preview calculado en cliente
- `ToastStore` — cola de notificaciones; usar `toastStore.success/error/warning/info(title, msg)`
- `LoadingStore` — señal del overlay de carga global (manejada por `loadingInterceptor`)

### Cadena de interceptores (orden importante)

```
credentialsInterceptor  → añade withCredentials: true a todas las peticiones
telemetryInterceptor    → añade header X-Client-Info
loadingInterceptor      → activa/desactiva el overlay global de carga
errorInterceptor        → 401 refresh automático, 403/422/429/5xx → ToastStore
```

El `errorInterceptor` maneja el refresh de token en 401: importa `AuthService` dinámicamente con `require()` para evitar dependencia circular.

### Modelos TypeScript

Todos los interfaces están en `src/app/core/models/index.ts`, son 1:1 con los esquemas Pydantic del backend. Tipos clave:
- `EstadoSolicitud` — `PENDIENTE_ANALISIS | EN_ANALISIS | APROBADO | DESAPROBADO | VERIFICADO | OBSERVADO`
- `TipoDocumento` — `DAM | ORDEN_FABRICACION | CERTIFICADO | FOTO`
- `PermissionFlag` — `can_view | can_create | can_edit | can_delete`
- `SolicitudDetalle` extiende `SolicitudRead` con `ensayos_requeridos`, `documentos` y `resultados`

## Decisiones de arquitectura importantes

### pnpm y paquetes de Spartan NG
La mayoría de `@spartan-ng/ui-*-helm` **no existen en npm**. Solo existen:
- `@spartan-ng/ui-core`
- `@spartan-ng/ui-button-helm`
- `@spartan-ng/ui-icon-helm`

Los paquetes `hlm-input` y `hlm-label` están implementados localmente en `src/app/shared/ui/`. No agregar los demás paquetes de spartan-ng a `package.json`.

### Standalone components
Todos los componentes son `standalone: true`. Siempre importar explícitamente pipes (`SlicePipe`, `DatePipe`, etc.) y directivas en el array `imports` del componente.

### Sintaxis de templates
Usar la nueva sintaxis de control flow de Angular 17+: `@if`, `@else`, `@for`, `@switch`, `@case`. No usar `*ngIf`, `*ngFor` ni directivas estructurales antiguas.

### Arrow functions en templates
Angular 18 tiene un bug con `=>` en event bindings inline (el `>` se interpreta como cierre de tag). Siempre mover a un método del componente:
```typescript
// MAL en template: (click)="signal.update(v => !v)"
// BIEN: método en clase
protected toggle(): void { this.signal.update(v => !v); }
```

### Upload a MinIO
El `upload.service.ts` usa **XMLHttpRequest** (no HttpClient) porque las presigned URLs de MinIO no admiten las cabeceras que Angular añade. No cambiar esto a HttpClient.

### Autenticación
Cookies HttpOnly — no hay token en localStorage. El `credentialsInterceptor` añade `withCredentials: true`. El `errorInterceptor` hace refresh automático en 401.

### Parámetros de ruta como inputs
`withComponentInputBinding()` está activo en el router. Los parámetros de ruta (`:id`) se pueden recibir como `@Input() id!: string` en el componente.

### Estado mocked en desarrollo
`buscarRS()` en `WizardSolicitudComponent` (`modules/dicer/solicitudes/wizard/`) usa un `setTimeout` simulando una búsqueda institucional (DIGEMID/SISMED). En producción deberá conectarse al endpoint real.

## Convenciones de naming

- Stores: `*Store` (ej. `AuthStore`, `WizardStore`)
- Services: `*Service`
- Guards: `*Guard` (funciones, no clases)
- Interceptors: `*Interceptor` (funciones funcionales)
- Shared UI: `Hlm*Directive` para directivas de estilo headless

## RBAC en templates

La directiva estructural `*appHasPermission` elimina el elemento del DOM si el usuario no tiene el permiso:
```html
<button *appHasPermission="['DICER.registros.solicitudes', 'can_create']">
  Nueva Solicitud
</button>
```

En guards, usar `data: { roles: ['EXTERNO'], permiso: 'DICER.registros.solicitudes', flagReq: 'can_create' }`.

## Colores Tailwind personalizados

- `dicer-teal-*` — color primario (verde institucional DIGEMID, flujo EXTERNO)
- `dicer-blue-*` — color secundario (azul MINSA/INTERNO, flujo evaluación)

No usar colores genéricos de Tailwind para elementos institucionales.

## Proxy de desarrollo

`proxy.conf.json` redirige `/api/*` → `http://localhost:8000`. El backend debe estar corriendo en ese puerto. `environment.apiUrl` es `/api/v1` en dev (el proxy resuelve el host).

## Rutas protegidas

`authGuard` bloquea todo `/app`. `roleGuard` verifica tipo de usuario + permiso del backend. Los permisos vienen como `componente_clave` + flags `can_view/create/edit/delete`. La verificación reactiva de permisos se hace vía `authStore.permisosMap()` (computed signal indexado).
