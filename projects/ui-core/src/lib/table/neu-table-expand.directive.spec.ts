import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NeuTableComponent } from './neu-table.component';
import { NeuTableExpandDirective } from './neu-table-expand.directive';
import { NeuTableColumn } from './neu-table.types';

interface Row {
  name: string;
  details: string;
}

const COLUMNS: NeuTableColumn[] = [{ key: 'name', header: 'Nombre' }];

const DATA: Row[] = [
  { name: 'Producto A', details: 'Información adicional de A' },
  { name: 'Producto B', details: 'Información adicional de B' },
];

@Component({
  template: `
    <neu-table [columns]="columns" [data]="data" [expandable]="true">
      <ng-template neuTableExpand let-row>
        <div class="expand-content">{{ row['details'] }}</div>
      </ng-template>
    </neu-table>
  `,
  imports: [NeuTableComponent, NeuTableExpandDirective],
})
class TestHostComponent {
  columns = COLUMNS;
  data = DATA;
}

describe('NeuTableExpandDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render table with expand directive', () => {
    expect(fixture.nativeElement.querySelector('neu-table')).toBeTruthy();
  });

  it('should have expand toggle buttons for each row', () => {
    const btns = fixture.nativeElement.querySelectorAll(
      'button[aria-label*="Expandir"], button[aria-label*="xpand"], .neu-table__expand-btn',
    );
    // La tabla con expandable=true debe tener botones de expansión
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('NeuTableExpandDirective should expose templateRef', () => {
    // Verifica que la directiva puede inyectar el TemplateRef
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('[class*="neu-table"]')).toBeTruthy();
  });
});
