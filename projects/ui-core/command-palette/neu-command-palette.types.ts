import type {
  NeuCommand,
  NeuCommandAction,
  NeuCommandPaletteComponent,
  NeuCommandPaletteItemContext,
} from './neu-command-palette.component';
// @ts-expect-error Neural 2 removes the global command registry service.
import type { NeuCommandPaletteService } from './neu-command-palette.component';

const action = { id: 'save', label: 'Save', kind: 'action', keywords: ['write'] } as const satisfies NeuCommand;
const router = { id: 'home', label: 'Home', kind: 'router', routerLink: ['/home'] as const } as const satisfies NeuCommand;
const link = { id: 'docs', label: 'Docs', kind: 'link', href: '/docs', target: '_blank' } as const satisfies NeuCommand;
const commands: readonly NeuCommand[] = [action, router, link];
const context: NeuCommandPaletteItemContext = { $implicit: action, index: 0 };
const component = null as unknown as NeuCommandPaletteComponent;
const visibleCommands: readonly NeuCommand[] = component.commands();
component.commandAction.subscribe((intent: NeuCommandAction) => { void intent.id; });
component.open();
component.close();
void [commands, context, visibleCommands];

// @ts-expect-error Action commands may not contain callbacks.
const callbackAction: NeuCommand = { id: 'bad', label: 'Bad', kind: 'action', action: () => {} };
// @ts-expect-error Actions cannot also be Router navigation.
const mixedAction: NeuCommand = { id: 'bad', label: 'Bad', kind: 'action', routerLink: '/bad' };
// @ts-expect-error Router navigation requires routerLink.
const missingRouterDestination: NeuCommand = { id: 'bad', label: 'Bad', kind: 'router' };
// @ts-expect-error URL navigation requires href.
const missingHref: NeuCommand = { id: 'bad', label: 'Bad', kind: 'link' };
// @ts-expect-error URL and Router navigation are mutually exclusive.
const mixedNavigation: NeuCommand = { id: 'bad', label: 'Bad', kind: 'link', href: '/bad', routerLink: '/bad' };
// @ts-expect-error Legacy untagged commands are not valid.
const untagged: NeuCommand = { id: 'bad', label: 'Bad' };
// @ts-expect-error There is no public execution method.
component.execute(action);
void [callbackAction, mixedAction, missingRouterDestination, missingHref, mixedNavigation, untagged];
