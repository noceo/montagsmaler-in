import {
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SvgIconComponent } from 'angular-svg-icon';
import { UserService } from '../../services/user/user.service';
import { MessagingService } from '../../services/messaging/messaging.service';
import { ChatMessage, MessageType } from '../../types/message.types';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, SvgIconComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent {
  @ViewChild('chatArea') chatAreaRef!: ElementRef<HTMLElement>;
  @ViewChild('chatInput') chatInputRef!: ElementRef<HTMLElement>;
  @ViewChild('counter') counterRef!: ElementRef<HTMLElement>;
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
      if (message.type !== MessageType.CHAT) return;
      const chatMessage = message as ChatMessage;
      const currentUser = this.userService.getCurrentUser()!;
      const user = this.userService.getUserById(chatMessage.userId);
      if (!user && currentUser.id !== chatMessage.userId) return;

      const username = user?.name || 'You';
      this.addMessageToChatArea(username, chatMessage.data.text);
    });
  }

  onInputChange(value: string) {
    this.counterRef.nativeElement.innerText = value.length.toString();
    if (value.length) this.counterRef.nativeElement.classList.remove('hidden');
    else this.counterRef.nativeElement.classList.add('hidden');
  }

  onSend() {
    const currentUser = this.userService.getCurrentUser();
    if (!this.newMessage || !currentUser) return;

    this.messagingService.send({
      type: MessageType.CHAT,
      userId: currentUser.id,
      data: {
        text: this.newMessage,
      },
    });

    this.newMessage = '';
    this.counterRef.nativeElement.innerText = '0';
    this.counterRef.nativeElement.classList.add('hidden');
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
