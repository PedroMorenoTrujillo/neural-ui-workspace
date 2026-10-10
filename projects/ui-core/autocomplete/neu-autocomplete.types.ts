import {
  NeuOptionGroupTemplateContext,
  NeuOptionLoaderTemplateContext,
  NeuOptionTemplateContext,
  NeuViewportRange,
} from '@neural-ui/core/option-api';

export interface NeuAutocompleteOption<V = unknown> {
  readonly value: V;
  readonly label: string;
  readonly disabled?: boolean;
}

export type NeuAutocompleteMode = 'strict' | 'free-text';
export type NeuAutocompleteValue<V, F extends NeuAutocompleteMode = 'strict'> =
  F extends 'free-text' ? V | string | null : V | null;
export type NeuAutocompleteDropdownMode = 'blank' | 'current';
export type NeuAutocompleteSize = 'sm' | 'md' | 'lg';
export type NeuAutocompleteVariant = 'outline' | 'solid';
export type NeuAutocompleteCompletionSource = 'input' | 'focus' | 'dropdown' | 'programmatic';

export interface NeuAutocompleteCompleteEvent {
  readonly originalEvent: Event | null;
  readonly query: string;
  readonly source: NeuAutocompleteCompletionSource;
  readonly requestId: number;
}

export interface NeuAutocompleteSelectEvent<T, V> {
  readonly originalEvent: Event | null;
  readonly option: T;
  readonly value: V;
}

export interface NeuAutocompleteSuggestionsRequest {
  readonly query: string;
  readonly source: NeuAutocompleteCompletionSource;
  readonly requestId: number;
  readonly queryRevision: number;
  readonly range?: NeuViewportRange;
  readonly reason: 'initial' | 'query' | 'viewport' | 'retry';
}

export interface NeuAutocompleteDropdownClickEvent {
  readonly originalEvent: Event;
  readonly query: string;
  readonly mode: NeuAutocompleteDropdownMode;
}

export interface NeuAutocompleteClearEvent<V, F extends NeuAutocompleteMode = 'strict'> {
  readonly originalEvent: Event | null;
  readonly previousValue: NeuAutocompleteValue<V, F>;
  readonly previousText: string;
  readonly reason: 'button' | 'input' | 'force-selection' | 'programmatic';
}

export interface NeuAutocompleteOverlayEvent {
  readonly originalEvent: Event | null;
  readonly reason:
    | 'completion'
    | 'focus'
    | 'dropdown'
    | 'keyboard'
    | 'selection'
    | 'clear'
    | 'escape'
    | 'outside'
    | 'tab'
    | 'programmatic';
}

export interface NeuAutocompleteItemContext<T, V = unknown> extends NeuOptionTemplateContext<T> {
  readonly label: string;
  readonly value: V;
}

export type NeuAutocompleteGroupContext<G> = NeuOptionGroupTemplateContext<G>;
export type NeuAutocompleteLoaderContext = NeuOptionLoaderTemplateContext;

export interface NeuAutocompleteIconContext {
  readonly $implicit: boolean;
  readonly active: boolean;
}
