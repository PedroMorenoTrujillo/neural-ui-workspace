import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { isMentionValue, mentionToken } from './neu-mention-token';

export interface NeuMentionSuggestion {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'neu-mention',
  templateUrl: './neu-mention.component.html',
  styleUrl: './neu-mention.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeuMentionComponent implements FormValueControl<string> {
  readonly value = model<string>('');
  readonly label = input.required<string>();
  readonly suggestions = input<readonly NeuMentionSuggestion[]>([]);
  readonly suggestionsLabel = input(inject(NEURAL_LOCALE).toLowerCase().startsWith('es')
    ? 'Sugerencias de menciones' : 'Mention suggestions');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly required = input(false);
  readonly invalid = input(false);
  /** Emits null when the query is cleared or cancelled. */
  readonly queryChange = output<string | null>();
  readonly suggestionSelected = output<NeuMentionSuggestion>();
  readonly touch = output<void>();

  private readonly field = viewChild.required<ElementRef<HTMLTextAreaElement>>('field');
  private readonly token = signal<ReturnType<typeof mentionToken>>(null);
  private readonly activeIndex = signal(0);
  private composing = false;

  protected readonly inputId = inject(NeuIdGenerator).getId('neu-mention-');
  protected readonly listId = this.inputId + '-suggestions';
  protected readonly matching = computed(() => {
    const token = this.token();
    if (!token || this.disabled() || this.readonly()) return [];
    const normalized = token.query.toLowerCase();
    const unique = new Set<string>();
    return this.suggestions().filter(item => {
      if (!isMentionValue(item.value) || !item.label.trim() || unique.has(item.value)) return false;
      if (!item.value.toLowerCase().startsWith(normalized) && !item.label.toLowerCase().startsWith(normalized)) return false;
      unique.add(item.value);
      return true;
    });
  });
  protected readonly activeOption = computed(() => Math.min(this.activeIndex(), this.matching().length - 1));

  constructor() {
    effect(() => {
      const blocked = this.disabled() || this.readonly();
      if (blocked && this.token()) this.dismiss();
    });
  }

  focus(options?: FocusOptions): void {
    this.field().nativeElement.focus(options);
  }

  reset(): void {
    this.composing = false;
    this.dismiss();
  }

  protected handleInput(event: Event): void {
    if (this.composing || (event as InputEvent).isComposing || this.disabled() || this.readonly()) return;
    const field = this.field().nativeElement;
    this.value.set(field.value);
    this.readCaret();
  }

  protected readCaret(): void {
    if (this.composing || this.disabled() || this.readonly()) return;
    const field = this.field().nativeElement;
    const next = mentionToken(field.value, field.selectionStart, field.selectionEnd);
    const previous = this.token();
    if (next?.start === previous?.start && next?.end === previous?.end && next?.query === previous?.query) return;
    this.token.set(next);
    if (previous?.query !== next?.query || previous?.start !== next?.start) {
      this.activeIndex.set(0);
      this.queryChange.emit(next?.query ?? null);
    }
  }

  protected startComposition(): void {
    this.composing = true;
    this.dismiss();
  }

  protected endComposition(event: Event): void {
    if (!this.composing) return;
    this.composing = false;
    this.handleInput(event);
  }

  protected blur(): void {
    this.composing = false;
    this.dismiss();
    this.touch.emit();
  }

  protected dismiss(): void {
    if (!this.token()) return;
    this.token.set(null);
    this.activeIndex.set(0);
    this.queryChange.emit(null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.composing || event.isComposing) return;
    if (event.key === 'Escape' && this.token()) {
      event.preventDefault();
      event.stopPropagation();
      this.dismiss();
      return;
    }

    const items = this.matching();
    if (!items.length || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const active = this.activeOption();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const index = (active + step + items.length) % items.length;
      this.activeIndex.set(index);
      this.field().nativeElement.ownerDocument.getElementById(this.listId + '-' + index)?.scrollIntoView?.({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.choose(items[active]);
    }
  }

  protected onKeyup(event: KeyboardEvent): void {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key) ||
      ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && (!this.matching().length || event.shiftKey))) this.readCaret();
  }

  protected choose(item: NeuMentionSuggestion): void {
    const field = this.field().nativeElement;
    const active = this.token();
    const current = mentionToken(field.value, field.selectionStart, field.selectionEnd);
    if (!active || !current || current.start !== active.start || current.query !== active.query || !this.matching().includes(item)) return;
    const remaining = field.value.slice(current.end);
    const suffix = remaining && /^[\s.,!?;:)\]}]/.test(remaining) ? '' : ' ';
    const insertion = '@' + item.value + suffix;
    field.setRangeText(insertion, current.start, current.end, 'end');
    this.value.set(field.value);
    this.dismiss();
    this.suggestionSelected.emit(item);
  }
}
