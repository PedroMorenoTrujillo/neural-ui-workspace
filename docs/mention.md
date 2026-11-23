# Mention

`NeuMentionComponent` is a labelled textarea that suggests `@` mentions. Its list is anchored below the field and updates for the token at the caret. Use `[(value)]` for an application-owned string or bind it with Angular Signal Forms.

```ts
import { Component, signal } from '@angular/core';
import { NeuMentionComponent, type NeuMentionSuggestion } from '@neural-ui/core/mention';

@Component({
  imports: [NeuMentionComponent],
  template: `
    <neu-mention
      label="Comment"
      suggestionsLabel="Colleagues"
      [(value)]="comment"
      [suggestions]="colleagues"
    />
  `,
})
export class CommentEditor {
  readonly comment = signal('');
  readonly colleagues: readonly NeuMentionSuggestion[] = [
    { value: 'ada', label: 'Ada Lovelace' },
    { value: 'grace', label: 'Grace Hopper' },
  ];
}
```

A suggestion's `value` is the handle inserted after `@`. The value supports letters, marks, numbers, underscores, dots and hyphens. `label` is the accessible, visible text in the suggestion list. Matching uses a case-insensitive prefix of either value or label. After committing an item, the component emits `suggestionSelected` with the selected object.

For remote suggestions, listen to `queryChange`, cancel or ignore older requests when the query changes and bind the current results back to `suggestions`. The empty query `''` means the user entered `@` without text. `null` means they left or dismissed the query. The component filters supplied results by the current token, and the application owns request timing, errors and result limits.

While the list is visible, Up and Down move through suggestions, Enter selects the active suggestion and Escape dismisses the list. Tab retains native focus navigation. The textarea keeps focus while navigating suggestions and waits until composition finishes before opening a query.

The suggestion list's default accessible name follows `NEURAL_LOCALE` for Spanish and English. Set `suggestionsLabel` to provide an application-specific name or another language. Pointer and touch selection keep focus in the textarea.
