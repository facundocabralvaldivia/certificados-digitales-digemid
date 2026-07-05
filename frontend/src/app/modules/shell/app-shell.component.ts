import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthStore } from '../../core/store/auth.store';
import { InternoLayoutComponent } from './layouts/interno-layout/interno-layout.component';

/**
 * Shell post-login (demo). Lee `authStore.activeLayout()` y renderiza el layout
 * correspondiente. En este mockup solo se implementa el layout INTERNO; el resto
 * cae a un router-outlet directo.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, InternoLayoutComponent],
  template: `
    @switch (authStore.activeLayout()) {
      @case ('interno') {
        <app-interno-layout />
      }
      @default {
        <router-outlet />
      }
    }
  `,
})
export class AppShellComponent {
  protected readonly authStore = inject(AuthStore);
}
