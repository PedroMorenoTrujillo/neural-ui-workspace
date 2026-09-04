import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

export interface NeuTerminalLine {
  text: string;
  kind?: 'output' | 'error' | 'info';
}

export interface NeuTerminalCommand {
  command: string;
}

/**
 * A terminal UI surface. It never evaluates a command: consumers receive a
 * command event and decide whether and how to append safe, plain-text output.
 */
@Component({
  selector: 'neu-terminal',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-terminal-host' },
  template: `
    <section #terminal class="neu-terminal" [attr.aria-label]="ariaLabel()" (click)="focusInput()">
      @if (welcomeMessage()) {
        <p class="neu-terminal__welcome">{{ welcomeMessage() }}</p>
      }
      <div class="neu-terminal__transcript" role="log" aria-live="polite" aria-relevant="additions text">
        @for (entry of entries(); track entry.id) {
          @if (entry.type === 'command') {
            <div class="neu-terminal__command"><span class="neu-terminal__prompt">{{ prompt() }}</span><span>{{ entry.text }}</span></div>
          } @else {
            <div class="neu-terminal__output" [class]="'neu-terminal__output neu-terminal__output--' + entry.kind">{{ entry.text }}</div>
          }
        }
      </div>
      <div class="neu-terminal__input-row">
        <span class="neu-terminal__prompt" aria-hidden="true">{{ prompt() }}</span>
        <input
          #commandInput
          class="neu-terminal__input"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          [disabled]="disabled()"
          [readOnly]="readonly()"
          [attr.aria-label]="inputAriaLabel()"
          [value]="draft()"
          (input)="draft.set($any($event.target).value)"
          (keydown)="onKeydown($event)"
        />
      </div>
    </section>
  `,
  styleUrl: './neu-terminal.component.scss',
})
export class NeuTerminalComponent implements OnChanges {
  readonly commandInput = viewChild.required<ElementRef<HTMLInputElement>>('commandInput');
  private readonly terminal = viewChild.required<ElementRef<HTMLElement>>('terminal');
  private readonly destroyRef = inject(DestroyRef);
  readonly welcomeMessage = input('');
  readonly prompt = input('$');
  /** Adds a safe response after the latest command. */
  readonly response = input<string | undefined>(undefined);
  readonly ariaLabel = input('Terminal');
  readonly inputAriaLabel = input('Terminal command');
  readonly disabled = input(false);
  readonly readonly = input(false);
  /** Replaces the externally-controlled transcript without creating command events. */
  readonly output = input<readonly NeuTerminalLine[]>([]);
  readonly commandSubmit = output<NeuTerminalCommand>();
  readonly entries = signal<TerminalEntry[]>([]);
  readonly draft = signal('');
  private history: string[] = [];
  private historyIndex = -1;
  private outputSnapshot: readonly NeuTerminalLine[] = [];
  private nextId = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['output']) {
      const external = this.output();
      if (external !== this.outputSnapshot) {
        const previous = this.outputSnapshot;
        this.outputSnapshot = external;
        const extendsPrevious =
          external.length >= previous.length &&
          previous.every(
            (line, index) =>
              line.text === external[index]?.text && line.kind === external[index]?.kind,
          );
        if (!external.length && previous.length) {
          this.entries.set([]);
        } else if (extendsPrevious) {
          const additions = external.slice(previous.length).map((line) => this.outputEntry(line));
          if (additions.length) this.entries.update((entries) => [...entries, ...additions]);
        } else {
          this.entries.update((entries) => [
            ...entries.filter((entry) => entry.type === 'command'),
            ...external.map((line) => this.outputEntry(line)),
          ]);
        }
        this.scrollToEnd();
      }
    }
    if (changes['response'] && this.response() && this.entries().some((entry) => entry.type === 'command')) {
      this.appendOutput(this.response()!);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.submit();
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectHistory(-1);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectHistory(1);
    }
  }

  submit(): void {
    if (this.disabled() || this.readonly()) return;
    const command = this.draft().trim();
    if (!command) return;
    this.entries.update((entries) => [...entries, { id: ++this.nextId, type: 'command', text: command }]);
    this.history.push(command);
    this.historyIndex = this.history.length;
    this.draft.set('');
    this.commandSubmit.emit({ command });
    this.scrollToEnd();
  }

  appendOutput(text: string, kind: NeuTerminalLine['kind'] = 'output'): void {
    this.entries.update((entries) => [...entries, this.outputEntry({ text, kind })]);
    this.scrollToEnd();
  }

  clear(): void {
    this.entries.set([]);
  }

  focusInput(): void {
    if (!this.disabled()) this.commandInput().nativeElement.focus();
  }

  private selectHistory(direction: -1 | 1): void {
    if (!this.history.length) return;
    this.historyIndex = Math.max(0, Math.min(this.history.length, this.historyIndex + direction));
    this.draft.set(this.history[this.historyIndex] ?? '');
  }

  private outputEntry(line: NeuTerminalLine): TerminalEntry {
    return { id: ++this.nextId, type: 'output', text: line.text, kind: line.kind ?? 'output' };
  }

  private scrollToEnd(): void {
    queueMicrotask(() => {
      if (this.destroyRef.destroyed) return;
      const element = this.terminal().nativeElement;
      element.scrollTop = element.scrollHeight;
    });
  }
}

interface TerminalEntry {
  id: number;
  type: 'command' | 'output';
  text: string;
  kind?: NeuTerminalLine['kind'];
}
