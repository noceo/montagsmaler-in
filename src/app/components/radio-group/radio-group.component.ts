import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  RadioButtonComponent,
  RadioButtonIconSize,
} from '../radio-button/radio-button.component';

interface RadioOption {
  label: string;
  value: string;
  iconSrc: string;
  iconSize?: RadioButtonIconSize;
}

@Component({
  selector: 'app-radio-group',
  standalone: true,
  imports: [RadioButtonComponent],
  templateUrl: './radio-group.component.html',
  styleUrl: './radio-group.component.scss',
})
export class RadioGroupComponent {
  @Input() name!: string;
  @Input() options!: RadioOption[];
  @Input() selectedValue!: string;
  @Input() defaultValue!: string;
  @Input() color: 'primary' | 'secondary' = 'primary';
  @Output() selectionChange = new EventEmitter<string>();

  onChange(value: string) {
    this.selectionChange.emit(value);
  }
}
