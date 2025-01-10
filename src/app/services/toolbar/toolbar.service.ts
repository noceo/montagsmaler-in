import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type StrokeWidth = 'tiny' | 'small' | 'medium' | 'big';
export type DrawMode = 'path' | 'line' | 'rect' | 'triangle' | 'ellipse';

@Injectable({
  providedIn: 'root',
})
export class ToolbarService {
  private mode = new BehaviorSubject<DrawMode>('path');
  private strokeWidthName = new BehaviorSubject<StrokeWidth>('small');
  private strokeColor = new BehaviorSubject<string>('#000000');
  private onClearCanvas = new EventEmitter<void>();

  readonly mode$: Observable<DrawMode> = this.mode.asObservable();
  readonly strokeWidthName$: Observable<StrokeWidth> =
    this.strokeWidthName.asObservable();
  readonly strokeColor$: Observable<string> = this.strokeColor.asObservable();

  constructor() {}

  setMode(mode: DrawMode) {
    this.mode.next(mode);
  }

  setStrokeWidth(strokeWidth: StrokeWidth) {
    this.strokeWidthName.next(strokeWidth);
  }

  setStrokeColor(strokeColor: string) {
    this.strokeColor.next(strokeColor);
  }

  emitClearCanvasEvent(): void {
    this.onClearCanvas.emit();
  }

  getClearCanvasEmitter(): EventEmitter<void> {
    return this.onClearCanvas;
  }
}
