import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuMenuItemDirective as MenuItemAlias } from '@neural-ui/core/menu';
import { NeuMenuItemDirective } from '@neural-ui/core/menu-shared';

@Component({
  imports: [NeuMenuItemDirective],
  template: '<ng-template neuMenuItem let-item><strong>{{ item.label }}</strong></ng-template>',
})
class MenuTemplateHost {
  readonly item = viewChild.required(NeuMenuItemDirective);
}

describe('Menu shared template contract', () => {
  it('preserves the public menu alias identity', () => {
    expect(MenuItemAlias).toBe(NeuMenuItemDirective);
  });

  it('renders the supplied item through its public TemplateRef', async () => {
    const fixture = TestBed.createComponent(MenuTemplateHost);
    await fixture.whenStable();
    const view = fixture.componentInstance.item().templateRef.createEmbeddedView({
      $implicit: { key: 'edit', label: 'Edit document' },
    });
    view.detectChanges();
    expect(view.rootNodes[0].textContent).toBe('Edit document');
    view.destroy();
    expect(view.destroyed).toBe(true);
    fixture.destroy();
  });
});
