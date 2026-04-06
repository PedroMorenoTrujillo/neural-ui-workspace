import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { NeuBadgeComponent, NeuButtonComponent, NeuIconComponent } from '@neural-ui/core';

interface TemplateProduct {
  id: string;
  title: { es: string; en: string };
  description: { es: string; en: string };
  image: string;
  tag: 'free' | 'premium' | 'new';
  price?: string;
  previewUrl?: string;
  category: { es: string; en: string };
}

@Component({
  selector: 'app-templates',
  imports: [NeuBadgeComponent, NeuButtonComponent, NeuIconComponent, TranslocoPipe],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesComponent {
  private readonly transloco = inject(TranslocoService);

  readonly products: TemplateProduct[] = [
    {
      id: 'admin-dashboard',
      title: { es: 'Admin Dashboard Pro', en: 'Admin Dashboard Pro' },
      description: {
        es: 'Panel de administración completo con tablas, gráficas y gestión de usuarios.',
        en: 'Full admin panel with tables, charts and user management.',
      },
      image: 'https://placehold.co/480x280/007aff/ffffff?text=Admin+Dashboard',
      tag: 'premium',
      price: '$49',
      category: { es: 'Dashboard', en: 'Dashboard' },
    },
    {
      id: 'saas-landing',
      title: { es: 'SaaS Landing Page', en: 'SaaS Landing Page' },
      description: {
        es: 'Landing page de alta conversión para productos SaaS con sección de precios.',
        en: 'High-conversion landing page for SaaS products with pricing section.',
      },
      image: 'https://placehold.co/480x280/5856d6/ffffff?text=SaaS+Landing',
      tag: 'premium',
      price: '$39',
      category: { es: 'Marketing', en: 'Marketing' },
    },
    {
      id: 'analytics-ui',
      title: { es: 'Analytics UI Kit', en: 'Analytics UI Kit' },
      description: {
        es: 'Kit de componentes para visualización de datos con 12 tipos de gráficas.',
        en: 'Component kit for data visualization with 12 chart types.',
      },
      image: 'https://placehold.co/480x280/34c759/ffffff?text=Analytics+UI',
      tag: 'new',
      price: '$59',
      category: { es: 'Analítica', en: 'Analytics' },
    },
    {
      id: 'starter-kit',
      title: { es: 'Starter Kit', en: 'Starter Kit' },
      description: {
        es: 'Plantilla base con autenticación, layout y rutas configuradas para empezar.',
        en: 'Base template with auth, layout and routes configured to get started.',
      },
      image: 'https://placehold.co/480x280/ff9f0a/ffffff?text=Starter+Kit',
      tag: 'free',
      category: { es: 'Base', en: 'Base' },
    },
    {
      id: 'ecommerce-dashboard',
      title: { es: 'E-commerce Dashboard', en: 'E-commerce Dashboard' },
      description: {
        es: 'Dashboard para tiendas online: pedidos, inventario y métricas de ventas.',
        en: 'Dashboard for online stores: orders, inventory and sales metrics.',
      },
      image: 'https://placehold.co/480x280/ff3b30/ffffff?text=E-commerce',
      tag: 'premium',
      price: '$69',
      category: { es: 'E-commerce', en: 'E-commerce' },
    },
    {
      id: 'crm-pro',
      title: { es: 'CRM Pro', en: 'CRM Pro' },
      description: {
        es: 'Template de CRM con gestión de contactos, pipeline y actividad.',
        en: 'CRM template with contact management, pipeline and activity.',
      },
      image: 'https://placehold.co/480x280/64748b/ffffff?text=CRM+Pro',
      tag: 'new',
      price: '$79',
      category: { es: 'CRM', en: 'CRM' },
    },
  ];

  getTagVariant(tag: TemplateProduct['tag']): 'success' | 'info' | 'warning' {
    const map = { free: 'success' as const, new: 'info' as const, premium: 'warning' as const };
    return map[tag];
  }

  getTagLabel(tag: TemplateProduct['tag']): string {
    if (tag === 'free')    return this.transloco.translate('templates.free');
    if (tag === 'new')     return 'New';
    return 'Premium';
  }

  getLocalText(obj: { es: string; en: string }): string {
    const lang = this.transloco.getActiveLang() as 'es' | 'en';
    return obj[lang] ?? obj['es'];
  }
}
