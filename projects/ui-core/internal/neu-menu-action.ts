export type NeuMenuRouterLink = string | unknown[];

export interface NeuMenuCommandEvent<T> {
  originalEvent: Event;
  item: T;
}

/** Additive shape understood by new menu-family components. */
export interface NeuMenuActionLike<TSelf = unknown> {
  key?: string;
  id?: string;
  label?: string;
  icon?: string;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
  separator?: boolean;
  visible?: boolean;
  url?: string;
  target?: string;
  rel?: string;
  routerLink?: NeuMenuRouterLink;
  tooltip?: string;
  command?: (event: NeuMenuCommandEvent<TSelf>) => void;
}

export type NeuMenuActionKind = 'command' | 'router' | 'external' | 'none';

export interface NeuResolvedMenuAction<T> {
  readonly original: T;
  readonly key: string;
  readonly label: string;
  readonly icon?: string;
  readonly badge?: string | number;
  readonly tooltip?: string;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly separator: boolean;
  readonly visible: boolean;
  readonly url?: string;
  readonly target?: string;
  readonly rel?: string;
  readonly routerLink?: NeuMenuRouterLink;
  readonly kind: NeuMenuActionKind;
  readonly command?: (event: NeuMenuCommandEvent<T>) => void;
}

export function resolveNeuMenuAction<T extends NeuMenuActionLike<T>>(
  item: T,
  index = 0,
): NeuResolvedMenuAction<T> {
  const routerLink = item.routerLink;
  const url = item.url;
  const kind: NeuMenuActionKind =
    routerLink != null ? 'router' : url ? 'external' : item.command ? 'command' : 'none';

  return {
    original: item,
    key: item.key ?? item.id ?? `item-${index}`,
    label: item.label ?? '',
    icon: item.icon,
    badge: item.badge,
    tooltip: item.tooltip,
    active: item.active === true,
    disabled: item.disabled === true,
    separator: item.separator === true,
    visible: item.visible !== false,
    url,
    target: item.target,
    rel: item.rel ?? (item.target === '_blank' ? 'noopener noreferrer' : undefined),
    routerLink,
    kind,
    command: item.command,
  };
}

/** Runs commands and enforces disabled/hidden semantics without owning navigation. */
export function activateNeuMenuAction<T>(
  action: NeuResolvedMenuAction<T>,
  originalEvent: Event,
): boolean {
  if (action.disabled || action.separator || !action.visible) {
    originalEvent.preventDefault();
    originalEvent.stopPropagation();
    return false;
  }

  action.command?.({ originalEvent, item: action.original });
  return true;
}
