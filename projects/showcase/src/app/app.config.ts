import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withRouterConfig } from '@angular/router';
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
  lucideMousePointerClick,
  // Tema dark/light
  lucideSun,
  lucideMoon,
  // Stats Card trend icons
  lucideTrendingUp,
  lucideTrendingDown,
  lucideMinus,
  // UI component icons
  lucideLayoutList,
  lucideLoader,
  // Templates page
  lucideShoppingCart,
  lucideGithub,
  lucideInbox,
  // Feedback (toast icons)
  lucideCheckCircle,
  lucideXCircle,
  lucideAlertTriangle,
  lucideInfo,
  // Home — hero tech tabs
  lucideShieldCheck,
  lucideLink,
  // Home — component cards
  lucideTag,
  lucidePlaySquare,
  lucideLayout,
  lucideType,
  lucidePanelLeft,
  lucideTable2,
  lucideList,
  // Home — features
  lucideLink2,
  lucideAccessibility,
  lucidePalette,
  // Toggle Button demo
  lucideAlignLeft,
  lucideAlignCenter,
  lucideAlignRight,
  lucideLayoutGrid,
  // Button demo — iconos
  lucidePlus,
  lucideDownload,
  lucideArrowRight,
  lucideTrash2,
  lucideSend,
  // Nav item icons — componentes
  lucideCalendar,
  lucideListChecks,
  lucideToggleLeft,
  lucideSquareCheck,
  lucideCircleDot,
  lucideMaximize2,
  lucideMessageSquare,
  lucideFileText,
  // Nav demo icons
  lucideLayoutDashboard,
  lucideActivity,
  lucideUsers,
  lucideImage,
  lucideSettings,
  lucideHelpCircle,
  lucideExternalLink,
  // Nuevos componentes
  lucideChevronsRight,
  lucideMoreHorizontal,
  lucideStar,
  lucideSlidersHorizontal,
  lucideSparkles,
  // Installation page
  lucidePackage,
  lucideCode2,
  lucideSmile,
  lucideWifi,
  lucideBell,
  lucideLock,
} from '@ng-icons/lucide';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['es', 'en'],
        defaultLang: 'en',
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
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
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
      lucideMousePointerClick,
      // Tema dark/light
      lucideSun,
      lucideMoon,
      // Stats Card trend icons
      lucideTrendingUp,
      lucideTrendingDown,
      lucideMinus,
      // Templates page
      lucideShoppingCart,
      lucideGithub,
      lucideInbox,
      // Feedback (toast icons)
      lucideCheckCircle,
      lucideXCircle,
      lucideAlertTriangle,
      lucideInfo,
      // Home — hero tech tabs
      lucideShieldCheck,
      lucideLink,
      // Home — component cards
      lucideTag,
      lucidePlaySquare,
      lucideLayout,
      lucideType,
      lucidePanelLeft,
      lucideTable2,
      lucideList,
      // Home — features
      lucideLink2,
      lucideAccessibility,
      lucidePalette,
      // Toggle Button demo
      lucideAlignLeft,
      lucideAlignCenter,
      lucideAlignRight,
      lucideLayoutGrid,
      // Button demo — iconos
      lucidePlus,
      lucideDownload,
      lucideArrowRight,
      lucideTrash2,
      lucideSend,
      // Nav item icons — componentes
      lucideCalendar,
      lucideListChecks,
      lucideToggleLeft,
      lucideSquareCheck,
      lucideCircleDot,
      lucideMaximize2,
      lucideMessageSquare,
      lucideFileText,
      // Nav demo icons
      lucideLayoutDashboard,
      lucideActivity,
      lucideUsers,
      lucideImage,
      lucideSettings,
      lucideHelpCircle,
      lucideExternalLink,
      // UI group icons
      lucideLayoutList,
      lucideLoader,
      lucideLock,
      // Nuevos componentes
      lucideChevronsRight,
      lucideMoreHorizontal,
      lucideStar,
      lucideSlidersHorizontal,
      lucideSparkles,
      lucidePackage,
      // Nuevas páginas
      lucideCode2,
      lucideSmile,
      lucideWifi,
      lucideBell,
    }),
    provideNgIconsConfig({ size: '1.25rem', strokeWidth: '2' }),
  ],
};
