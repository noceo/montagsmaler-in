import { Component, EventEmitter, OnInit } from '@angular/core';
import { RadioGroupComponent } from '../radio-group/radio-group.component';
import {
  DrawMode,
  StrokeWidth,
  ToolbarService,
} from '../../services/toolbar/toolbar.service';
import { ButtonComponent } from '../button/button.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [FormsModule, RadioGroupComponent, ButtonComponent],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  mode: DrawMode = 'path';
  strokeWidthName: StrokeWidth = 'small';
  strokeWidth = 15;
  contextBaseColor = '#000000';
  contextPreviewColor = '';

  constructor(private toolbarService: ToolbarService) {}

  onModeChange(value: string) {
    this.toolbarService.setMode(value as DrawMode);
  }

  onStrokeColorChange(event: Event) {
    const color = (event.target as HTMLInputElement).value;
    this.toolbarService.setStrokeColor(color);
  }

  onStrokeWidthChange(value: string) {
    this.toolbarService.setStrokeWidth(value as StrokeWidth);
  }

  onClear() {
    this.toolbarService.emitClearCanvasEvent();
  }
}
