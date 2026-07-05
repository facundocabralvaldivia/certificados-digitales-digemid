# AGENTS.md — Guía para agentes IA en DICER-FRONT

Este archivo está dirigido a agentes de IA (Claude Code, Cursor, Copilot, etc.) que continúen el desarrollo de este proyecto. Lee esto antes de tocar cualquier archivo.

---

## Contexto del sistema

**DICER** es el frontend Angular 18 de la plataforma oficial DIGEMID/MINSA Perú para control de calidad de medicamentos importados. Opera sobre un backend FastAPI con PostgreSQL y MinIO.

Hay dos tipos de usuario con flujos completamente diferentes:
- **EXTERNO** (laboratorios): crea solicitudes → sube documentos → registra ensayos
- **INTERNO** (evaluadores DIGEMID): revisa solicitudes → emite dictamen oficial

Lee el `README.md` en la raíz del repo (`../README.md`) para el contexto completo del dominio y la arquitectura. El backend vive en `../backend/`.

---

## Reglas absolutas (no negociables)

### 1. Solo Signals — nunca Observable como estado
El estado se gestiona exclusivamente con Signals nativos de Angular. No introducir NgRx, RxJS Subjects como estado, Akita, ni ninguna librería de estado externa. Los Observables de HttpClient son válidos solo para peticiones HTTP — subscribe en el componente o en el store, nunca como fuente de verdad.

### 2. Todos los componentes son standalone
`standalone: true` en cada componente, directiva y pipe. No crear ni referenciar NgModules. Importar siempre explícitamente en el array `imports` del componente (`SlicePipe`, `DatePipe`, `RouterLink`, `FormsModule`, etc.).

### 3. No usar arrow functions en event bindings de templates
Angular 18 tiene un bug: el `>` de `=>` se interpreta como cierre de tag HTML. Siempre extraer a método de clase:
```typescript
// MAL — rompe el parser de templates:
// (click)="signal.update(v => !v)"

// BIEN:
protected toggle(): void { this.signal.update(v => !v); }
```

### 4. No instalar paquetes Spartan NG inexistentes
Solo existen en npm: `@spartan-ng/ui-core`, `@spartan-ng/ui-button-helm`, `@spartan-ng/ui-icon-helm`. Cualquier otro `@spartan-ng/ui-*-helm` no existe. Los componentes `hlmInput` y `hlmLabel` están implementados localmente en `src/app/shared/ui/`.

### 5. No cambiar UploadService a HttpClient
`upload.service.ts` usa `XMLHttpRequest` deliberadamente. Las presigned URLs de MinIO rechazan las cabeceras extras que Angular añade. No modificar esto.

### 6. Usar sintaxis de control flow nueva
Usar `@if`, `@else`, `@for`, `@switch`, `@case` — nunca `*ngIf`, `*ngFor`, `*ngSwitch`. Esta es la sintaxis de Angular 17+.

### 7. Colores institucionales
Para elementos DIGEMID/MINSA usar exclusivamente `dicer-teal-*` (flujo EXTERNO) y `dicer-blue-*` (flujo INTERNO). No usar `emerald`, `cyan`, `sky`, `indigo` de Tailwind genérico para estas entidades.

---

## Patrones del proyecto

### Patrón de Store

Todo store sigue este patrón sin excepción:

```typescript
interface MiState {
  campo: string;
  isLoading: boolean;
  error: string | null;
}

const INITIAL: MiState = { campo: '', isLoading: false, error: null };

@Injectable({ providedIn: 'root' })
export class MiStore {
  private readonly _state = signal<MiState>(INITIAL);

  // Computed públicos — SOLO LECTURA
  readonly campo     = computed(() => this._state().campo);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error     = computed(() => this._state().error);

  // Mutaciones — siempre mediante métodos nombrados
  setCampo(v: string): void {
    this._state.update(s => ({ ...s, campo: v }));
  }
  reset(): void { this._state.set(INITIAL); }
}
```

Nunca exponer el `_state` WritableSignal directamente. Si un componente necesita acceder a datos internos del state (como un Map), exponer un método helper en el store.

**Excepción conocida:** `MatrizEnsayosComponent` accede directamente a `store['_state']()` para leer el Map de resultados. Esto es un workaround a corregir — la forma correcta es añadir `getResultado(id)` como método público al store.

### Patrón de Servicio HTTP

```typescript
@Injectable({ providedIn: 'root' })
export class MiServicioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/mi-recurso`;

  listar(): Observable<MiRecursoRead[]> {
    return this.http.get<MiRecursoRead[]>(`${this.base}`);
  }

  crear(data: MiRecursoCreate): Observable<MiRecursoRead> {
    return this.http.post<MiRecursoRead>(`${this.base}`, data);
  }
}
```

La URL base siempre usa `environment.apiUrl`. Los tipos siempre referencian interfaces de `src/app/core/models/index.ts`.

### Patrón de Componente de página

```typescript
@Component({
  selector: 'app-mi-pagina',
  standalone: true,
  imports: [
    PageHeaderComponent,
    HlmButtonDirective,
    // pipes explícitos:
    SlicePipe,
    DatePipe,
  ],
  template: `
    <app-page-header title="Mi Página" subtitle="Descripción" />
    <!-- contenido -->
  `,
})
export class MiPaginaComponent implements OnInit {
  private readonly miStore   = inject(MiStore);
  private readonly miServicio = inject(MiServicioService);
  private readonly toastStore = inject(ToastStore);

  ngOnInit(): void {
    this.miServicio.listar().subscribe({
      next:  data => this.miStore.setLista(data),
      error: ()   => this.toastStore.error('Error', 'No se pudo cargar.'),
    });
  }
}
```

### Patrón de Ruta con guard

```typescript
{
  path: 'mi-ruta',
  canActivate: [roleGuard],
  data: {
    roles: ['INTERNO'],          // TipoUsuario[]
    permiso: 'DICER.mi.modulo',  // componente_clave del backend
    flagReq: 'can_view',         // 'can_view' | 'can_create' | 'can_edit' | 'can_delete'
  },
  loadComponent: () =>
    import('./modules/DOMINIO/mi-seccion/mi-pagina.component')
    .then(m => m.MiPaginaComponent),
}
```

---

## Tipos de datos clave

Todos en `src/app/core/models/index.ts`. Los más usados:

```typescript
type EstadoSolicitud = 'PENDIENTE_ANALISIS' | 'EN_ANALISIS' | 'APROBADO' | 'DESAPROBADO' | 'VERIFICADO' | 'OBSERVADO';
type TipoDocumento   = 'DAM' | 'ORDEN_FABRICACION' | 'CERTIFICADO' | 'FOTO';
type PermissionFlag  = 'can_view' | 'can_create' | 'can_edit' | 'can_delete';
type TipoUsuario     = 'INTERNO' | 'EXTERNO' | 'PUBLICO';

// SolicitudDetalle extiende SolicitudRead con:
interface SolicitudDetalle extends SolicitudRead {
  ensayos_requeridos: EnsayoCatalogoRead[];
  documentos:         DocumentoRead[];
  resultados:         ResultadoEnsayoRead[];
}
```

Cuando el backend añade nuevos endpoints, agregar los interfaces correspondientes en `index.ts` — nunca definir tipos localmente en los componentes.

---

## Estructura de módulos — dónde va cada cosa

```
modules/
├── auth/      ← COMPARTIDO — nunca mover, lo usan todos los dominios
├── shell/     ← COMPARTIDO — nunca mover, define cómo se navega
└── dicer/     ← DOMINIO actual
    ├── solicitudes/   (rutas: /app/solicitudes, /app/solicitudes/nueva, /app/solicitudes/:id)
    ├── ensayos/       (rutas: /app/ensayos/:id)
    └── evaluacion/    (rutas: /app/evaluacion, /app/evaluacion/:id)
```

Nuevos dominios de negocio se añaden como carpetas hermanas de `dicer/`:
```
modules/
├── auth/
├── shell/
├── dicer/
├── farmacias/   ← nuevo dominio
└── admin/       ← nuevo dominio
```

**Regla de profundidad:** todos los componentes dentro de un dominio están a 4 niveles de `src/app/`. Los imports siempre usan `../../../../core/...` y `../../../../shared/...`.

## Layouts y navegación

### Cómo funciona el shell

`AppShellComponent` es el único punto de entrada post-login. Lee `authStore.activeLayout()` y renderiza el layout correspondiente:

```typescript
@switch (authStore.activeLayout()) {
  @case ('interno') { <app-interno-layout /> }
  @case ('externo') { <app-externo-layout /> }
  @default          { <router-outlet />       }
}
```

Ambos layouts incluyen su propio `<router-outlet>`. `ToastContainer` y `LoadingOverlay` se colocan una sola vez aquí, encima del layout.

### Agregar items de navegación

- **INTERNO** → `NAV_INTERNO` array en `interno-layout.component.ts` (línea ~14)
- **EXTERNO** → `NAV_EXTERNO` array en `externo-layout.component.ts` (línea ~7)

El layout INTERNO tiene sidebar colapsable (señal `sidebarOpen` local). El EXTERNO no es colapsable.

---

## Toasts

Para mostrar notificaciones desde cualquier servicio o componente:

```typescript
private readonly toastStore = inject(ToastStore);

// Uso:
this.toastStore.success('Título', 'Mensaje', 4000);  // duración en ms (default 4000)
this.toastStore.error('Título', 'Mensaje', 6000);    // default 6000
this.toastStore.warning('Título', 'Mensaje', 5000);  // default 5000
this.toastStore.info('Título', 'Mensaje');
```

Los toasts se auto-eliminan al vencer su duración. `duration: 0` = persistente hasta cerrar manualmente.

---

## Loading overlay

El overlay se activa automáticamente para todas las peticiones HTTP (gestionado por `loadingInterceptor`). Para omitirlo en una petición específica:

```typescript
// Opción 1: header especial
this.http.get('/ruta', { headers: { 'X-Skip-Loader': '1' } });

// Opción 2: automático — los PUT que no van a /api/ se omiten (MinIO uploads)
```

Para activarlo manualmente (raro):
```typescript
private readonly loadingStore = inject(LoadingStore);
this.loadingStore.increment();
// ... trabajo async ...
this.loadingStore.decrement();
```

---

## RBAC en componentes

### En templates (ocultar/mostrar elementos)
```html
<!-- Elimina el elemento del DOM si no tiene el permiso -->
<button *appHasPermission="['DICER.registros.solicitudes', 'can_create']">
  + Nueva Solicitud
</button>
```

Importar `HasPermissionDirective` en el array `imports` del componente.

### En TypeScript (verificación condicional)
```typescript
private readonly authStore = inject(AuthStore);

protected puedeEditar(): boolean {
  return this.authStore.hasPermission('DICER.mi.modulo', 'can_edit');
}
```

---

## Estado mocked — pendiente de implementar

`buscarRS()` en `WizardSolicitudComponent` (`wizard-solicitud.component.ts:335`) usa un `setTimeout` de 1200ms que simula una búsqueda y devuelve datos hardcodeados. En producción debe conectarse al endpoint real de búsqueda de Registros Sanitarios en DIGEMID/SISMED.

---

## Archivos de configuración relevantes

| Archivo | Para qué sirve |
|---|---|
| `src/environments/environment.ts` | URL del backend en desarrollo |
| `src/environments/environment.prod.ts` | URL del backend en producción |
| `proxy.conf.json` | Redirige `/api/*` al backend local en dev |
| `tailwind.config.js` | Paleta de colores institucional + animaciones de semáforo |
| `nginx.conf` | Headers de seguridad, CSP, cache, SPA fallback |
| `Dockerfile` | Build multi-stage (node → nginx) |
| `angular.json` | Configuración de builds (outputPath: `dist/dicer-front/browser`) |

---

## Workarounds conocidos

### Dependencia circular en errorInterceptor
El `errorInterceptor` necesita `AuthService` pero no puede inyectarlo normalmente (se registra en `appConfig` que se evalúa antes de que el inyector esté completo). Solución actual: `require()` dinámico en línea 28 de `error.interceptor.ts`. No cambiar esto sin probar el flujo de refresh completo.

### Acceso privado en MatrizEnsayos
`MatrizEnsayosComponent.getResultado()` y `setObservacion()` acceden a `store['_state']()` directamente para leer el `Map<string, ResultadoEnsayoInput>`. La solución correcta es añadir `getResultado(id: string)` y `getObservacion(id: string)` como métodos públicos en `EnsayosStore`. Está pendiente.

### pnpm + esbuild binarios nativos
En máquinas Windows/WSL a veces los binarios nativos de esbuild no se configuran en la instalación de pnpm. Solución:
```bash
node node_modules/.pnpm/esbuild@0.23.0/node_modules/esbuild/install.js
```

---

## Tareas pendientes de implementación

- **Búsqueda real de RS**: conectar `buscarRS()` al endpoint de DIGEMID/SISMED
- **Módulo Admin/Usuarios**: `NAV_INTERNO` ya tiene el link `/app/admin/usuarios` pero la ruta no existe
- **Módulo Admin/Sedes**: idem — link en nav pero sin ruta ni componente
- **Vista PUBLICO**: `activeLayout() === 'publico'` solo muestra `<router-outlet>` vacío — falta layout para ciudadanos
- **Paginación**: `listar()` en solicitudes no tiene paginación — si crece el volumen de datos, añadir `page` y `pageSize` al query
- **Refresh de token con concurrencia**: si múltiples peticiones fallan con 401 simultáneamente, el `errorInterceptor` lanzará múltiples refresh. Implementar un mecanismo de cola/lock

---

## Checklist para un PR nuevo

- [ ] El componente es `standalone: true` y todos los imports están declarados explícitamente
- [ ] No hay arrow functions en event bindings de template
- [ ] El estado nuevo usa el patrón de store (signal privado + computed públicos)
- [ ] Las interfaces TypeScript nuevas están en `src/app/core/models/index.ts`
- [ ] Las rutas nuevas tienen `canActivate: [roleGuard]` con `data.permiso` correcto
- [ ] Los colores institucionales usan `dicer-teal-*` o `dicer-blue-*`
- [ ] Los errores HTTP se manejan con `toastStore.error()` en el callback `error:`
- [ ] Los textos institucionales están en español
