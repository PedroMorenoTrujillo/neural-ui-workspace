import { TemplateRef, signal, type Signal } from '@angular/core';

/** @internal The single preview engine's host-specific hooks. */
export interface InternalNeuMediaItem {
  src: string;
  alt: string;
  caption?: string;
}

/** @internal */
export interface InternalNeuMediaCaptionContext {
  $implicit: InternalNeuMediaItem;
  index: number;
}

/** @internal */
export interface InternalNeuMediaPreviewController {
  readonly scale: Signal<number>;
  readonly transform: Signal<string>;
  zoom(delta: number): void;
  rotate(delta: number): void;
  flip(axis: 'x' | 'y'): void;
  resetTransform(): void;
}

/** @internal Gallery augments the standalone viewer without a second overlay. */
export interface InternalNeuMediaPreviewHost {
  items(): readonly InternalNeuMediaItem[];
  index(): number;
  navigate(direction: -1 | 1): void;
  canNavigate(direction: -1 | 1): boolean;
  maxZoom(): number;
  labels(): {
    toolbar: string;
    zoomIn: string;
    zoomOut: string;
    rotateLeft: string;
    rotateRight: string;
    flipHorizontal: string;
    flipVertical: string;
    reset: string;
    close: string;
    previous: string;
    next: string;
    download: string;
  };
  captionTemplate(): TemplateRef<InternalNeuMediaCaptionContext> | undefined;
  onZoom(value: number): void;
  onRotation(value: number): void;
  onFlip(value: { x: number; y: number }): void;
  onImageError(index: number): void;
  readonly gallery: true;
}

/** @internal Scoped to one Gallery instance; no global applied state. */
export class InternalNeuMediaPreviewAdapter {
  host: InternalNeuMediaPreviewHost | null = null;
  readonly session = signal<InternalNeuMediaPreviewController | null>(null);
}
