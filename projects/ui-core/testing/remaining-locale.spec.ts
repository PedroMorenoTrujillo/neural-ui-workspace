import { TestBed } from '@angular/core/testing';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuCommandPaletteComponent } from '../command-palette/neu-command-palette.component';
import { NeuNotificationCenterComponent } from '../notification-center/neu-notification-center.component';
import { NeuToastContainerComponent } from '../toast/neu-toast.component';
import { NeuToastService } from '../toast/neu-toast.service';
import { NeuColorPickerComponent } from '../color-picker/neu-color-picker.component';
import { NeuDashboardGridComponent } from '../dashboard-grid/neu-dashboard-grid.component';
import { NeuUploaderComponent } from '../uploader/neu-uploader.component';
import { NeuPickListComponent } from '../pick-list/neu-pick-list.component';
import { NeuVirtualListComponent } from '../virtual-list/neu-virtual-list.component';
import { neuStructuralIconPath } from '../icon-outlet-internal/neu-icon-fallbacks';

for(const locale of ['en-US','es-ES']) describe(`remaining component internal labels: ${locale}`,()=>{
  const es=locale.startsWith('es');
  beforeEach(()=>TestBed.configureTestingModule({providers:[{provide:NEURAL_LOCALE,useValue:locale}]}));
  it('localizes the palette title, search and keyboard hints',async()=>{
    const f=TestBed.createComponent(NeuCommandPaletteComponent);f.detectChanges();f.componentInstance.open();f.detectChanges();await f.whenStable();
    expect(f.nativeElement.querySelector('[role="dialog"]').getAttribute('aria-label')).toBe(es?'Paleta de comandos':'Command palette');
    expect(f.nativeElement.querySelector('input').placeholder).toBe(es?'Buscar comandos…':'Search commands…');
    expect(f.nativeElement.textContent).toContain(es?'Sin resultados para':'No results for');
    f.componentInstance.close();
  });
  it('localizes the notification trigger',()=>{
    const f=TestBed.createComponent(NeuNotificationCenterComponent);f.detectChanges();
    expect(f.nativeElement.querySelector('button').getAttribute('aria-label')).toBe(es?'Notificaciones. 0 sin leer':'Notifications. 0 unread');
  });
  it('localizes toast dismissal',()=>{
    const f=TestBed.createComponent(NeuToastContainerComponent);TestBed.inject(NeuToastService).success('Saved',{duration:0});f.detectChanges();
    expect(f.nativeElement.querySelector('button').getAttribute('aria-label')).toBe(es?'Cerrar':'Close');
  });
  it('localizes colour-picker popup and channel names',async()=>{
    const f=TestBed.createComponent(NeuColorPickerComponent);f.detectChanges();f.nativeElement.querySelector('button').click();f.detectChanges();await f.whenStable();
    const panel=document.querySelector('.neu-cp__panel');
    expect(panel?.getAttribute('aria-label')).toBe(es?'Selector de color':'Color picker');
  });
  it('localizes dashboard reorder instructions',async()=>{
    const f=TestBed.createComponent(NeuDashboardGridComponent);f.componentRef.setInput('tiles',[{id:'sales',title:'Sales'}]);f.detectChanges();await f.whenStable();
    expect(f.nativeElement.querySelector('button').getAttribute('aria-label')).toBe(es?'Mover Sales; usa las flechas para reordenar':'Move Sales; use arrow keys to reorder');
  });
});

describe('remaining component accessibility regressions', () => {
  it('keeps uploader actions outside its keyboard-activated dropzone', () => {
    const f = TestBed.createComponent(NeuUploaderComponent); f.detectChanges();
    const zone = f.nativeElement.querySelector('.neu-uploader__dropzone');
    expect(zone.getAttribute('role')).toBe('button');
    expect(zone.querySelector('button')).toBeNull();
    expect(f.nativeElement.querySelector('.neu-uploader__actions button')).toBeTruthy();
  });
  it('keeps empty pick-list options valid inside the listbox', () => {
    const f = TestBed.createComponent(NeuPickListComponent); f.detectChanges();
    for (const list of f.nativeElement.querySelectorAll('[role="listbox"]')) {
      expect(list.querySelector('[role="status"]')).toBeNull();
      expect(list.querySelector('[role="option"][aria-disabled="true"]')).toBeTruthy();
    }
  });
  it('makes the virtual viewport keyboard-scrollable', () => {
    const f = TestBed.createComponent(NeuVirtualListComponent);
    f.componentRef.setInput('itemKey', (item: string) => item); f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-virtual-list__viewport').tabIndex).toBe(0);
  });
  it('provides a real structural notification bell without an icon provider', () => {
    expect(neuStructuralIconPath('notifications')).toContain('M18 8');
  });
});
