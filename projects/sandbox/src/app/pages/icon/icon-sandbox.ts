import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuIconComponent } from '@neural-ui/core';

@Component({
  selector: 'app-icon-sandbox',
  imports: [NeuIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Icon</h1>
        <p class="sb-page__desc">
          NeuIconComponent — name, size, strokeWidth. Muestra los iconos registrados en la app.
        </p>
      </div>

      <!-- Tamaños -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tamaños</h2>
        <div class="sb-demo" style="align-items: center">
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-icon name="lucideStar" size="12px" />
            <span class="sb-label">12px</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-icon name="lucideStar" size="16px" />
            <span class="sb-label">16px</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-icon name="lucideStar" size="20px" />
            <span class="sb-label">20px (default)</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-icon name="lucideStar" size="24px" />
            <span class="sb-label">24px</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-icon name="lucideStar" size="32px" />
            <span class="sb-label">32px</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-icon name="lucideStar" size="48px" />
            <span class="sb-label">48px</span>
          </div>
        </div>
      </section>

      <!-- Stroke width -->
      <section class="sb-section">
        <h2 class="sb-section__title">Grosor de trazo (strokeWidth)</h2>
        <div class="sb-demo" style="align-items: center">
          @for (w of ['1', '1.5', '2', '2.5', '3']; track w) {
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
              <neu-icon name="lucideHeart" size="28px" [strokeWidth]="w" />
              <span class="sb-label">{{ w }}</span>
            </div>
          }
        </div>
      </section>

      <!-- Galería de iconos registrados -->
      <section class="sb-section">
        <h2 class="sb-section__title">Iconos registrados en la app</h2>
        <div class="sb-demo" style="flex-wrap: wrap; gap: 16px">
          @for (icon of registeredIcons; track icon) {
            <div
              style="display:flex; flex-direction:column; align-items:center; gap:4px; width:80px; text-align:center"
            >
              <neu-icon [name]="icon" size="20px" />
              <span
                style="font-size:10px; color:var(--neu-text-muted); word-break:break-all; line-height:1.2"
              >
                {{ icon.replace('lucide', '') }}
              </span>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class IconSandboxComponent {
  readonly registeredIcons = [
    'lucideActivity',
    'lucideAlignCenter',
    'lucideAlignLeft',
    'lucideAlignRight',
    'lucideArrowRight',
    'lucideBell',
    'lucideBarChart2',
    'lucideCalendar',
    'lucideCheck',
    'lucideChevronDown',
    'lucideChevronRight',
    'lucideChevronsRight',
    'lucideCircleDot',
    'lucideCode2',
    'lucideDatabase',
    'lucideDownload',
    'lucideEdit',
    'lucideExternalLink',
    'lucideFileText',
    'lucideFormInput',
    'lucideGlobe',
    'lucideHelpCircle',
    'lucideHome',
    'lucideImage',
    'lucideInfo',
    'lucideLayout',
    'lucideLayoutDashboard',
    'lucideLayoutGrid',
    'lucideLayoutTemplate',
    'lucideLayers',
    'lucideList',
    'lucideListChecks',
    'lucideLoader',
    'lucideLock',
    'lucideMenu',
    'lucideMessageSquare',
    'lucideMinus',
    'lucideMoon',
    'lucideMoreHorizontal',
    'lucideMousePointerClick',
    'lucidePackage',
    'lucidePanelLeft',
    'lucidePlus',
    'lucideSend',
    'lucideSettings',
    'lucideShieldCheck',
    'lucideShoppingCart',
    'lucideSlidersHorizontal',
    'lucideSmile',
    'lucideSparkles',
    'lucideStar',
    'lucideSun',
    'lucideSquareCheck',
    'lucideTable2',
    'lucideTag',
    'lucideToggleLeft',
    'lucideTrash2',
    'lucideTrendingDown',
    'lucideTrendingUp',
    'lucideType',
    'lucideUser',
    'lucideUsers',
    'lucideMaximize2',
    'lucideX',
    'lucideZap',
  ];
}
