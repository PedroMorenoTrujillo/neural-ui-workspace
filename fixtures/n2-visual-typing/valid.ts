import type { NeuDensity, NeuTone, NeuVariant } from '@neural-ui/core';
import { NeuAlertComponent, type NeuAlertTone, type NeuAlertVariant } from '@neural-ui/core/alert';
import { type NeuBadgeTone, type NeuBadgeVariant } from '@neural-ui/core/badge';
import { NeuButtonComponent, type NeuButtonTone, type NeuButtonVariant } from '@neural-ui/core/button';
import type { NeuCalendarEventTone } from '@neural-ui/core/calendar';
import type { NeuChipTone } from '@neural-ui/core/chip';
import type { NeuNotificationTone } from '@neural-ui/core/notification-center';
import type { NeuProgressTone } from '@neural-ui/core/progress-bar';
import type { NeuSpinnerTone } from '@neural-ui/core/spinner';
import type { NeuTagTone, NeuTagVariant } from '@neural-ui/core/tag';
import type { NeuTimelineItemTone } from '@neural-ui/core/timeline';
import type { NeuTimelineGridItemTone } from '@neural-ui/core/timeline-grid';
import type { NeuToastTone } from '@neural-ui/core/toast';
import type { NeuToolbarTone, NeuToolbarVariant } from '@neural-ui/core/toolbar';

declare const alert: NeuAlertComponent;
declare const button: NeuButtonComponent;

const tones: readonly NeuTone[] = ['neutral', 'brand', 'info', 'success', 'warning', 'danger'];
const variants: readonly NeuVariant[] = ['solid', 'soft', 'outline', 'ghost', 'text'];
const densities: readonly NeuDensity[] = ['compact', 'normal', 'relaxed'];
const componentContracts: readonly unknown[] = [
  'info' satisfies NeuAlertTone,
  'outline' satisfies NeuAlertVariant,
  'neutral' satisfies NeuBadgeTone,
  'soft' satisfies NeuBadgeVariant,
  'brand' satisfies NeuButtonTone,
  'ghost' satisfies NeuButtonVariant,
  'brand' satisfies NeuCalendarEventTone,
  'neutral' satisfies NeuChipTone,
  'danger' satisfies NeuNotificationTone,
  'brand' satisfies NeuProgressTone,
  'info' satisfies NeuSpinnerTone,
  'warning' satisfies NeuTagTone,
  'solid' satisfies NeuTagVariant,
  'neutral' satisfies NeuTimelineItemTone,
  'info' satisfies NeuTimelineGridItemTone,
  'danger' satisfies NeuToastTone,
  'brand' satisfies NeuToolbarTone,
  'soft' satisfies NeuToolbarVariant,
  alert.tone(),
  alert.variant(),
  button.tone(),
  button.variant(),
];

// @ts-expect-error global tone is a closed union.
const invalidTone: NeuTone = 'primary';
// @ts-expect-error danger is a tone, not a variant.
const invalidVariant: NeuVariant = 'danger';
// @ts-expect-error comfortable was replaced by normal.
const invalidDensity: NeuDensity = 'comfortable';
// @ts-expect-error Alert type was replaced by tone.
alert.type;
// @ts-expect-error Alert outline was replaced by variant.
alert.outline;
// @ts-expect-error Button no longer accepts mixed semantic variants.
const invalidButtonVariant: NeuButtonVariant = 'secondary';

void tones;
void variants;
void densities;
void componentContracts;
void invalidTone;
void invalidVariant;
void invalidDensity;
void invalidButtonVariant;
