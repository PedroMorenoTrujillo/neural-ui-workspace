import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Declarative slot for custom NeuTable toolbar content.
 *
 * Use it for actions owned by the application, such as PDF export,
 * bulk workflows, sync buttons or custom filters.
 */
@Directive({
  selector: 'ng-template[neuTableToolbar]',
  standalone: true,
})
export class NeuTableToolbarDirective {
  readonly templateRef = inject(TemplateRef) as TemplateRef<unknown>;
}
