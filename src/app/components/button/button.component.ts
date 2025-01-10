import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SvgIconComponent } from 'angular-svg-icon';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [SvgIconComponent, CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() iconSrc: string | undefined;
  @Input() text: string | undefined;
  @Input() isIconOnly: boolean = false;
  @Input() border: boolean = true;
  @Input() disabled: boolean = false;
  @Output() onClick = new EventEmitter<any>();

  onClickButton(event: Event) {
    this.onClick.emit(event);
  }
}
