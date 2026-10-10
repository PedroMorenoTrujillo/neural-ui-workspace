import * as i0 from '@angular/core';
import { InjectionToken } from '@angular/core';

export interface SyntheticOptions {
  enabled: boolean;
  label?: string;
}

export type SyntheticValue = string | number;

export declare class SyntheticCompoundComponent {
  readonly multilineInput: i0.InputSignal<string>;
  readonly internalAlias: i0.InputSignal<number>;
  readonly multilineOutput: i0.OutputEmitterRef<string>;
  readonly aliasedOutput: i0.OutputEmitterRef<number>;
  readonly multilineModel: i0.ModelSignal<boolean>;
  readonly publicProperty: string;
  /** @deprecated Use publicMethod instead. */
  legacyMethod(): void;
  publicMethod(value: SyntheticValue): string;
  templateMechanic(): void;
  /** @internal */
  internalMechanic(): void;
  static ɵfac: i0.ɵɵFactoryDeclaration<SyntheticCompoundComponent, never>;
  static ɵcmp: i0.ɵɵComponentDeclaration<
    SyntheticCompoundComponent,
    'neu-synthetic',
    never,
    {
      multilineInput: { alias: 'multilineInput'; required: false; isSignal: true };
      internalAlias: { alias: 'publicAlias'; required: true; isSignal: true };
      multilineModel: { alias: 'multilineModel'; required: false; isSignal: true };
    },
    {
      multilineOutput: 'multilineOutput';
      aliasedOutput: 'publicOutput';
      multilineModel: 'multilineModelChange';
    },
    never,
    never,
    true,
    never
  >;
}

export declare class SyntheticTemplateDirective {
  readonly syntheticTemplate: i0.InputSignal<string>;
  static ɵfac: i0.ɵɵFactoryDeclaration<SyntheticTemplateDirective, never>;
  static ɵdir: i0.ɵɵDirectiveDeclaration<
    SyntheticTemplateDirective,
    'ng-template[neuSynthetic]',
    never,
    { syntheticTemplate: { alias: 'neuSynthetic'; required: false; isSignal: true } },
    {},
    never,
    never,
    true,
    never
  >;
}

export declare class SyntheticService {
  load(): Promise<SyntheticValue>;
  static ɵfac: i0.ɵɵFactoryDeclaration<SyntheticService, never>;
  static ɵprov: i0.ɵɵInjectableDeclaration<SyntheticService>;
}

export declare function syntheticFunction(value: SyntheticValue): string;

/** @deprecated Use syntheticFunction. */
export declare function legacySyntheticFunction(value: SyntheticValue): string;

export declare const SYNTHETIC_TOKEN: InjectionToken<SyntheticOptions>;

/** @internal */
export declare const INTERNAL_SYNTHETIC_TOKEN: InjectionToken<string>;

export { SyntheticService as SyntheticServiceAlias };
