import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

export type RadioButtonIconSize = 'tiny' | 'small' | 'medium' | 'big';

@Component({
  selector: 'app-radio-button',
  standalone: true,
  imports: [AngularSvgIconModule, CommonModule],
  templateUrl: './radio-button.component.html',
  styleUrl: './radio-button.component.scss',
})
export class RadioButtonComponent {
  @Input() iconSrc: string | undefined;
  @Input() iconSize: RadioButtonIconSize = 'medium';
  @Input() ariaLabel: string | undefined;
  @Input() name!: string;
  @Input() option!: string;
  @Input() isChecked: boolean = false;
  @Input() color: 'primary' | 'secondary' = 'primary';
  @Output() selectionChange = new EventEmitter<string>();

  onChange(value: string) {
    this.selectionChange.emit(value);
  }
}
