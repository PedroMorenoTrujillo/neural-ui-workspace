import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideBell,
  lucideCheck,
  lucideCheckCircle,
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
  lucideEye,
  lucideInfo,
  lucideLayoutDashboard,
  lucideLogOut,
  lucideMenu,
  lucideMinus,
  lucidePencil,
  lucideSearch,
  lucideSettings,
  lucideShoppingBag,
  lucideTrash2,
  lucideTrendingDown,
  lucideTrendingUp,
  lucideUser,
  lucideUsers,
  lucideX,
  lucideXCircle,
} from '@ng-icons/lucide';
import { TranslocoHttpLoader } from './transloco-loader';
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
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),
    provideIcons({
      lucideAlertTriangle,
      lucideBell,
      lucideCheck,
      lucideCheckCircle,
      lucideChevronDown,
      lucideChevronLeft,
      lucideChevronRight,
      lucideEye,
      lucideInfo,
      lucideLayoutDashboard,
      lucideLogOut,
      lucideMenu,
      lucideMinus,
      lucidePencil,
      lucideSearch,
      lucideSettings,
      lucideShoppingBag,
      lucideTrash2,
      lucideTrendingDown,
      lucideTrendingUp,
      lucideUser,
      lucideUsers,
      lucideX,
      lucideXCircle,
    }),
    provideNgIconsConfig({ size: '1.25rem', strokeWidth: '2' }),
  ],
};
