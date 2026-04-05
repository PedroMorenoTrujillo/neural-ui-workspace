import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { provideNgIconsConfig } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideCheck,
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
  lucideEye,
  lucideEyeOff,
  lucideMail,
  lucideMenu,
  lucideSearch,
  lucideUser,
  lucideX,
} from '@ng-icons/lucide';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Habilita que los inputs() de los componentes de ruta reciban
      // automáticamente queryParams, pathParams y resolvers.
      // Ejemplo: input() 'menu' en un componente ← ?menu=open en la URL
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    provideIcons({
      lucideAlertCircle,
      lucideCheck,
      lucideChevronDown,
      lucideChevronLeft,
      lucideChevronRight,
      lucideEye,
      lucideEyeOff,
      lucideMail,
      lucideMenu,
      lucideSearch,
      lucideUser,
      lucideX,
    }),
    provideNgIconsConfig({ size: '1.25rem', strokeWidth: '2' }),
  ],
};
