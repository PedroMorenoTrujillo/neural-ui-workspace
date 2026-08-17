import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export type NeuTerminalTone = 'default' | 'success' | 'warning' | 'error' | 'muted';

export interface NeuTerminalLine {
  id: number;
  text: string;
  tone?: NeuTerminalTone;
  command?: boolean;
}

export interface NeuTerminalCommandEvent {
  command: string;
  args: string[];
}

export type NeuTerminalCommandHandler = (
  event: NeuTerminalCommandEvent,
) =>
  | string
  | string[]
  | NeuTerminalLine[]
  | void
  | Promise<string | string[] | NeuTerminalLine[] | void>;

let terminalLineId = 0;

@Component({
  selector: 'neu-terminal',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-terminal-host' },
  template: `
    <section class="neu-terminal" [attr.aria-label]="ariaLabel()" [attr.aria-busy]="busy()">
      @if (title()) {
        <header class="neu-terminal__header">
          <span aria-hidden="true">● ● ●</span><strong>{{ title() }}</strong>
        </header>
      }
      <div
        #output
        class="neu-terminal__output"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        [attr.aria-label]="outputAriaLabel()"
      >
        @for (line of lines(); track line.id) {
          <div
            class="neu-terminal__line neu-terminal__line--{{ line.tone || 'default' }}"
            [class.is-command]="line.command"
          >
            @if (line.command) {
              <span class="neu-terminal__prompt" aria-hidden="true">{{ prompt() }}</span>
            }
            <span>{{ line.text }}</span>
          </div>
        }
        @if (busy()) {
          <div class="neu-terminal__line neu-terminal__line--muted">{{ busyLabel() }}</div>
        }
      </div>
      <label class="neu-terminal__input-row">
        <span class="neu-terminal__prompt" aria-hidden="true">{{ prompt() }}</span>
        <span class="neu-terminal__sr-only">{{ inputLabel() }}</span>
        <input
          class="neu-terminal__input"
          type="text"
          autocomplete="off"
          spellcheck="false"
          [disabled]="disabled() || busy()"
          [value]="currentInput()"
          [placeholder]="placeholder()"
          (input)="currentInput.set($any($event.target).value)"
          (keydown.enter)="submit()"
          (keydown.arrowup)="navigateHistory(-1, $event)"
          (keydown.arrowdown)="navigateHistory(1, $event)"
          (keydown.tab)="complete($event)"
          (keydown.control.l)="clearShortcut($event)"
          (keydown.meta.l)="clearShortcut($event)"
        />
      </label>
    </section>
  `,
  styleUrl: './neu-terminal.component.scss',
})
export class NeuTerminalComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly title = input('Terminal');
  readonly prompt = input('$');
  readonly placeholder = input('Type a command');
  readonly ariaLabel = input('Interactive terminal');
  readonly outputAriaLabel = input('Terminal output');
  readonly inputLabel = input('Command');
  readonly busyLabel = input('Working…');
  readonly commandsLabel = input('Commands');
  readonly commandNotFoundLabel = input('Command not found');
  readonly disabled = input(false);
  readonly welcome = input<string[]>([]);
  readonly commands = input<Record<string, NeuTerminalCommandHandler>>({});
  readonly command = output<NeuTerminalCommandEvent>();
  readonly clear = output<void>();
  readonly linesChange = output<NeuTerminalLine[]>();

  readonly lines = signal<NeuTerminalLine[]>([]);
  readonly currentInput = signal('');
  readonly busy = signal(false);
  private readonly history = signal<string[]>([]);
  private historyIndex = 0;

  constructor() {
    effect(() => {
      this.lines.set(this.welcome().map((text) => this.createLine(text, 'muted')));
      this.history.set([]);
      this.historyIndex = 0;
    });
  }

  async submit(): Promise<void> {
    const raw = this.currentInput().trim();
    if (!raw || this.disabled() || this.busy()) return;
    const [name = '', ...args] = this.tokenize(raw);
    const event = { command: name, args };
    this.append([this.createLine(raw, 'default', true)]);
    this.history.update((items) => [...items.filter((item) => item !== raw), raw]);
    this.historyIndex = this.history().length;
    this.currentInput.set('');
    if (name === 'clear') {
      this.clearOutput();
      return;
    }
    if (name === 'help' && !this.commands()[name]) {
      const names = Object.keys(this.commands()).sort();
      const commandNames = names.length ? ['clear', 'help', ...names] : ['clear', 'help'];
      this.append([
        this.createLine(`${this.commandsLabel()}: ${commandNames.join(', ')}`, 'muted'),
      ]);
      return;
    }
    this.command.emit(event);
    const handler = this.commands()[name];
    if (!handler) {
      this.append([this.createLine(`${this.commandNotFoundLabel()}: ${name}`, 'error')]);
      return;
    }
    try {
      this.busy.set(true);
      const result = await handler(event);
      this.append(this.normalizeResult(result));
    } catch (error) {
      this.append([
        this.createLine(error instanceof Error ? error.message : String(error), 'error'),
      ]);
    } finally {
      this.busy.set(false);
    }
  }
  clearOutput(): void {
    this.lines.set([]);
    this.linesChange.emit([]);
    this.clear.emit();
  }
  append(lines: NeuTerminalLine[]): void {
    if (!lines.length) return;
    this.lines.update((current) => [...current, ...lines]);
    this.linesChange.emit(this.lines());
    queueMicrotask(() => {
      const viewport = this.host.nativeElement.querySelector<HTMLElement>('.neu-terminal__output');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    });
  }
  navigateHistory(direction: -1 | 1, event: Event): void {
    event.preventDefault();
    const history = this.history();
    if (!history.length) return;
    this.historyIndex = Math.max(0, Math.min(history.length, this.historyIndex + direction));
    this.currentInput.set(
      this.historyIndex === history.length ? '' : (history[this.historyIndex] ?? ''),
    );
  }
  complete(event: Event): void {
    const query = this.currentInput().trim();
    if (!query || query.includes(' ')) return;
    const matches = ['clear', 'help', ...Object.keys(this.commands())].filter((name) =>
      name.startsWith(query),
    );
    if (!matches.length) return;
    event.preventDefault();
    if (matches.length === 1) this.currentInput.set(matches[0] + ' ');
    else this.append([this.createLine(matches.join('  '), 'muted')]);
  }
  clearShortcut(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.ctrlKey || keyboardEvent.metaKey) {
      event.preventDefault();
      this.clearOutput();
    }
  }
  private normalizeResult(result: string | string[] | NeuTerminalLine[] | void): NeuTerminalLine[] {
    if (result == null) return [];
    if (typeof result === 'string') return [this.createLine(result)];
    return result.map((line) =>
      typeof line === 'string'
        ? this.createLine(line)
        : { ...line, id: line.id || ++terminalLineId },
    );
  }
  private createLine(
    text: string,
    tone: NeuTerminalTone = 'default',
    command = false,
  ): NeuTerminalLine {
    return { id: ++terminalLineId, text, tone, command };
  }
  private tokenize(command: string): string[] {
    return (
      command
        .match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
        ?.map((part) => part.replace(/^(?:"|')|(?:"|')$/g, '')) ?? []
    );
  }
}
