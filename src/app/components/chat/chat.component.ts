import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { SvgIconComponent } from 'angular-svg-icon';
import { UserService } from '../../services/user/user.service';
import { MessagingService } from '../../services/messaging/messaging.service';
import { ChatMessage } from '../../types/message.types';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, ButtonComponent, SvgIconComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent {
  @ViewChild('chatArea') chatAreaRef!: ElementRef<HTMLElement>;
  @ViewChild('chatInput') chatInputRef!: ElementRef<HTMLElement>;
  newMessage = '';

  constructor(
    private userService: UserService,
    private messagingService: MessagingService
  ) {}

  ngAfterViewInit() {
    this.chatInputRef.nativeElement.addEventListener('keypress', (event) => {
      if (event.key !== 'Enter') return;
      this.onSend();
    });

    this.messagingService.subscribe((message) => {
      if (message.type !== 'chat') return;
      const chatMessage = message as ChatMessage;
      const user = this.userService.getUserById(chatMessage.userId);
      if (!user) return;
      this.addMessageToChatArea(user.name, chatMessage.data.text);
    });
  }

  onSend() {
    const currentUser = this.userService.getCurrentUser();
    if (!this.newMessage || !currentUser) return;

    this.addMessageToChatArea(currentUser.name, this.newMessage);

    this.messagingService.send({
      type: 'chat',
      userId: currentUser.id,
      data: {
        text: this.newMessage,
      },
    });

    this.newMessage = '';
  }

  private addMessageToChatArea(username: string, message: string) {
    const containerElement = document.createElement('p');
    containerElement.className = 'message';

    const usernameElement = document.createElement('b');
    const messageElement = document.createTextNode(message);
    usernameElement.textContent = `${username}: `;

    containerElement.appendChild(usernameElement);
    containerElement.appendChild(messageElement);
    this.chatAreaRef.nativeElement.appendChild(containerElement);
    this.chatAreaRef.nativeElement.scrollTo({
      top: this.chatAreaRef.nativeElement.scrollHeight,
    });
  }
}
