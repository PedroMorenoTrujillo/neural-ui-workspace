import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { provideIcons } from '@ng-icons/core';
import { provideNgIconsConfig } from '@ng-icons/core';
import { TranslocoHttpLoader } from './transloco-loader';
import {
  // Originales
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
  // Sidebar nav categories
  lucideHome,
  lucideFormInput,
  lucideDatabase,
  lucideLayoutTemplate,
  lucideBarChart2,
  lucideLayers,
  lucideGlobe,
  lucideZap,
  // Stats Card trend icons
  lucideTrendingUp,
  lucideTrendingDown,
  lucideMinus,
  // Templates page
  lucideShoppingCart,
  lucideGithub,
  lucideInbox,
} from '@ng-icons/lucide';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['es', 'en'],
        defaultLang: 'es',
        reRenderOnLangChange: true,
        prodMode: false,
      },
      loader: TranslocoHttpLoader,
    }),
    provideRouter(
      routes,
      // Habilita que los inputs() de los componentes de ruta reciban
      // automáticamente queryParams, pathParams y resolvers.
      // Ejemplo: input() 'menu' en un componente ← ?menu=open en la URL
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    provideIcons({
      // Originales
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
      // Sidebar nav categories
      lucideHome,
      lucideFormInput,
      lucideDatabase,
      lucideLayoutTemplate,
      lucideBarChart2,
      lucideLayers,
      lucideGlobe,
      lucideZap,
      // Stats Card trend icons
      lucideTrendingUp,
      lucideTrendingDown,
      lucideMinus,
      // Templates page
      lucideShoppingCart,
      lucideGithub,
      lucideInbox,
    }),
    provideNgIconsConfig({ size: '1.25rem', strokeWidth: '2' }),
  ],
};
