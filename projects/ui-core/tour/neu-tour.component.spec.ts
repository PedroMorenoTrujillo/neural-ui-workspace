import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { NeuTourComponent } from './neu-tour.component';

describe('NeuTourComponent', () => {
  it('anchors late targets and proposes navigation and Escape dismissal', async () => {
    const fixture = TestBed.createComponent(NeuTourComponent);
    const document = TestBed.inject(DOCUMENT);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const target = document.createElement('button');
    target.id = 'tour-test-target';
    fixture.componentRef.setInput('steps', [
      { title: 'First step', description: 'Explore the first action.', targetId: target.id },
      { title: 'Next step', description: 'Explore the next action.', targetId: target.id },
    ]);
    fixture.componentRef.setInput('open', true);
    const missing: string[] = [];
    const indexes: number[] = [];
    const dismissed: boolean[] = [];
    fixture.componentInstance.targetMissing.subscribe((id) => missing.push(id));
    fixture.componentInstance.indexChange.subscribe((index) => indexes.push(index));
    fixture.componentInstance.dismissed.subscribe(() => dismissed.push(true));

    try {
      await fixture.whenStable();
      expect(missing).toEqual([target.id]);
      document.body.append(target);
      await new Promise((resolve) => setTimeout(resolve, 0));
      await fixture.whenStable();
      const dialog = overlay.querySelector<HTMLElement>('[role=dialog]');
      expect(dialog?.textContent).toContain('First step');
      expect(overlay.querySelector('.neu-tour__marker')).toBeTruthy();
      [...(dialog?.querySelectorAll('button') ?? [])].find((button) =>
        button.textContent?.trim() === 'Next',
      )?.click();
      expect(indexes).toEqual([1]);
      expect(fixture.componentInstance.index()).toBe(0);

      dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(dismissed).toEqual([true]);
      expect(fixture.componentInstance.open()).toBe(true);
    } finally {
      fixture.destroy();
      target.remove();
    }
  });
});
