# N2-023 — Matriz normativa de ejes visuales

## Vocabulario global

```ts
export type NeuTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';
export type NeuVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'text';
export type NeuDensity = 'compact' | 'normal' | 'relaxed';
```

Los tres ejes son ortogonales. Las uniones globales definen vocabulario, no obligan a ningún componente a aceptar todos los valores. `tone` expresa intención semántica; `variant`, tratamiento visual intercambiable; `density`, compactación espacial. Tamaño, shape, color literal, estado de validación, comportamiento y visibilidad no son sustitutos de estos ejes.

## Matriz por componente

| Component | Current visual API | Tone? | Allowed tones | Variant? | Allowed variants | Density? | Allowed densities | Defaults | Legacy members removed/renamed | Rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Alert | `type`, `outline` | YES | `info`, `success`, `warning`, `danger` | YES | `soft`, `outline` | NO | NONE | `info`, `soft` | `type -> tone`; `outline:boolean -> variant`; `error -> danger` | Feedback has semantic intent and two existing treatments. |
| Autocomplete | `variant=outlined|filled`, `size`, HTML `type` | NO | NONE | YES | `outline`, `solid` | NO | NONE | `outline` | `outlined -> outline`; `filled -> solid` | Existing interchangeable field treatment; size/type remain separate. |
| Avatar | `color`, `shape`, `size` | NO | NONE | NO | NONE | NO | NONE | Existing defaults | KEEP — DIFFERENT SEMANTICS | Literal palette, shape and size are explicit domains. |
| Badge | semantic `variant`, `outline`, `pill`, `size` | YES | `neutral`, `info`, `success`, `warning`, `danger` | YES | `soft`, `outline` | NO | NONE | `neutral`, `soft` | `variant -> tone`; `outline:boolean -> variant`; `default -> neutral` | Status color and treatment were mixed across two properties. |
| BlockUI | `variant=default|light|dark` | NO | NONE | NO | NONE | NO | NONE | `default` | KEEP — DIFFERENT SEMANTICS | Contextual overlay contrast policy, not semantic tone or canonical treatment. |
| BottomSheet | `size` | NO | NONE | NO | NONE | NO | NONE | `md` | KEEP — DIFFERENT SEMANTICS | Geometric size remains size. |
| Button | mixed `variant=primary|secondary|ghost|danger|outline` | YES | `neutral`, `brand`, `danger` | YES | `solid`, `outline`, `ghost` | NO | NONE | `brand`, `solid` | split into `tone` + canonical `variant`; no compatibility values | Action intent and treatment become independent. Legacy mapping: primary=brand/solid, secondary=neutral/solid, ghost=neutral/ghost, danger=danger/solid, outline=brand/outline. |
| Calendar event | `NeuCalendarEvent.variant=default|success|warning|danger|info` | YES | `brand`, `info`, `success`, `warning`, `danger` | NO | NONE | NO | NONE | `brand` | `variant -> tone`; `default -> brand` | Event marker color is semantic; current default is brand-colored. Calendar behavior remains closed. |
| Chip | semantic `variant=default|primary|success|warning|danger` | YES | `neutral`, `brand`, `success`, `warning`, `danger` | NO | NONE | NO | NONE | `neutral` | `variant -> tone`; `default -> neutral`; `primary -> brand` | Existing axis only changes semantic color. |
| CodeBlock | `compact:boolean` | NO | NONE | NO | NONE | YES | `compact`, `normal`, `relaxed` | `normal` | `compact -> density` | Compact mode changes a coherent group of spatial metrics. Language and wrapping remain separate. |
| ContextMenu item | `variant=default|danger` | YES | `neutral`, `danger` | NO | NONE | NO | NONE | `neutral` | `variant -> tone`; `default -> neutral` | Destructive intent is semantic, not a treatment. |
| EmptyState | `tone`, `compact:boolean`, `size` | YES | `neutral`, `info`, `success`, `warning`, `danger` | NO | NONE | YES | `compact`, `normal`, `relaxed` | `neutral`, `normal` | `compact -> density` | Tone is already correct; compact controls coherent spacing independently of size. |
| InputTags | `variant=outlined|filled`, `size` | NO | NONE | YES | `outline`, `solid` | NO | NONE | `outline` | `outlined -> outline`; `filled -> solid` | Same field-treatment contract as other selectors. Validation remains validation. |
| Notification | `type=info|success|warning|error` | YES | `info`, `success`, `warning`, `danger` | NO | NONE | NO | NONE | `info` | `type -> tone`; `error -> danger` | Public data expresses notification intent. Service behavior is unchanged. |
| Nav badge | `badgeVariant=default|success|warning|danger|info` | YES | `neutral`, `info`, `success`, `warning`, `danger` | NO | NONE | NO | NONE | `neutral` | `badgeVariant -> badgeTone`; `default -> neutral` | The nested badge forwards semantic intent to Badge; navigation behavior is unchanged. |
| Panel / ScrollArea | `variant=auto|hover|scroll|always|hidden` | NO | NONE | NO | NONE | NO | NONE | `auto` | KEEP — DIFFERENT SEMANTICS | Scrollbar visibility policy; explicitly excluded from visual variant vocabulary. |
| ProgressBar | semantic `variant=primary|success|warning|danger` | YES | `brand`, `success`, `warning`, `danger` | NO | NONE | NO | NONE | `brand` | `variant -> tone`; `primary -> brand` | Fill color is semantic. Size remains geometric. |
| SchedulerGantt | `compact:boolean`; task `variant` | YES (task) | `neutral`, `info`, `success`, `warning`, `danger` | NO | NONE | YES | `compact`, `normal`, `relaxed` | task `neutral`, component `normal` | task `variant -> tone`; `compact -> density` | Delegates semantic item color and coherent grid density without changing scheduling behavior. |
| Select | `variant=outlined|filled`, `size` | NO | NONE | YES | `outline`, `solid` | NO | NONE | `outline` | `outlined -> outline`; `filled -> solid` | Existing interchangeable field treatment. |
| Skeleton | `variant=text|circle|rect` | NO | NONE | NO | NONE | NO | NONE | `rect` | KEEP — DIFFERENT SEMANTICS | Structural placeholder shape, explicitly not a visual treatment axis. |
| Spinner | `severity`, literal `color`, CSS `size` | YES | `brand`, `info`, `success`, `warning`, `danger` | NO | NONE | NO | NONE | `brand` | `severity -> tone`; `primary -> brand`; literal color/size kept | Semantic tone and consumer-authored CSS color remain distinct. |
| SplitButton | Button mixed `variant` | YES | `neutral`, `brand`, `danger` | YES | `solid`, `outline`, `ghost` | NO | NONE | `brand`, `solid` | same split and mapping as Button | Both internal buttons share one applied visual contract. |
| Tag | `severity=success|secondary|info|warn|danger|contrast`, `rounded` | YES | `neutral`, `info`, `success`, `warning`, `danger` | YES | `soft`, `solid` | NO | NONE | `neutral`, `soft` | `severity -> tone`; `warn -> warning`; secondary=neutral/soft; contrast=neutral/solid | Existing semantic colors use soft treatment; contrast is an existing solid treatment. Shape stays separate. |
| Timeline | `compact:boolean`; item `variant` | YES (item) | `neutral`, `info`, `success`, `warning`, `danger` | NO | NONE | YES | `compact`, `normal`, `relaxed` | item `neutral`, component `normal` | item `variant -> tone`; `compact -> density` | Dot color is semantic and layout has a real dense mode. |
| TimelineGrid | `compact:boolean`; item `variant` | YES (item) | `neutral`, `info`, `success`, `warning`, `danger` | NO | NONE | YES | `compact`, `normal`, `relaxed` | item `neutral`, component `normal` | item `variant -> tone`; `compact -> density` | Item color is semantic and grid density changes coordinated geometry. |
| Toast | `type=success|error|info|warning` | YES | `info`, `success`, `warning`, `danger` | NO | NONE | NO | NONE | `info` | `type -> tone`; `error -> danger` | Toast intent drives color, icon and live-region urgency. Convenience method `error()` remains domain behavior. |
| Toolbar | `surface=primary|surface|none`, `density=comfortable|compact`, `size` | YES | `neutral`, `brand` | YES | `solid`, `soft`, `ghost` | YES | `compact`, `normal`, `relaxed` | `neutral`, `soft`, `normal` | `surface` split into `tone` + `variant`; `comfortable -> normal` | Existing surfaces map deterministically: primary=brand/solid, surface=neutral/soft, none=neutral/ghost. Density is a product-level layout choice; size remains separate. |
| Table | certified `density` and feature contracts | NO CHANGE | Certified surface | NO CHANGE | Certified surface | NO CHANGE | Certified surface | Certified defaults | NONE | Explicitly excluded; N2-023 does not reopen NeuTable. |
| TreeTable | certified hierarchy and density contracts | NO CHANGE | Certified surface | NO CHANGE | Certified surface | NO CHANGE | Certified surface | Certified defaults | NONE | Explicitly excluded; N2-023 does not reopen NeuTreeTable. |
| Other controls/containers | HTML/domain `type`, geometric `size`, literal `color`, `shape`, `rounded`, arbitrary node `style` | NO | NONE | NO | NONE | NO | NONE | Existing defaults | KEEP — DIFFERENT SEMANTICS | These names represent domains explicitly excluded by the normative rules. No axis is added mechanically. |

## Closed public aliases

Only aliases that add real type safety are introduced:

- `NeuTone`, `NeuVariant`, `NeuDensity` as the shared vocabulary.
- Component-specific tone/variant aliases for the subsets above.
- Existing component-specific size, shape, literal-color and behavior aliases remain independent.

No component receives all three axes automatically, and no public union uses `string` or `any`.

## Token migration

The 14 compatibility aliases are removed only after all product references use these canonical destinations:

| Removed alias | Canonical destination |
| --- | --- |
| `--neu-color-border` | `--neu-border` |
| `--neu-color-danger` | `--neu-error` |
| `--neu-danger` | `--neu-error` |
| `--neu-color-picker-bg` | `--neu-surface` |
| `--neu-color-picker-shadow` | `--neu-shadow-lg` |
| `--neu-color-primary` | `--neu-primary` |
| `--neu-color-primary-alpha` | `--neu-primary-alpha` |
| `--neu-color-secondary` | `--neu-secondary` |
| `--neu-color-success` | `--neu-success` |
| `--neu-color-surface-subtle` | `--neu-bg` |
| `--neu-color-text-secondary` | `--neu-text-muted` |
| `--neu-color-warning` | `--neu-warning` |
| `--neu-nav-toggle-color-hover` | `--neu-text` |
| `--neu-radius-md` | `--neu-radius` |

OrganizationChart promotes its existing deterministic local defaults to the global token layer:

- `--neu-organization-chart-connector`;
- `--neu-organization-chart-connector-width`.

This is a theming-default correction, not a behavioral redesign.
