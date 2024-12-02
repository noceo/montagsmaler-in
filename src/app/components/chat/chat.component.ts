import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SvgIconComponent } from 'angular-svg-icon';
import { UserService } from '../../services/user/user.service';
import { MessagingService } from '../../services/messaging/messaging.service';
import { ChatMessage, MessageType } from '../../types/message.types';
import { Subject, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '../../types/user.types';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, SvgIconComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ChatComponent implements OnInit {
  @ViewChild('chatArea') chatAreaRef!: ElementRef<HTMLElement>;
  @ViewChild('chatInput') chatInputRef!: ElementRef<HTMLElement>;
  @ViewChild('counter') counterRef!: ElementRef<HTMLElement>;
  newMessage = '';
  private currentUser?: User | null;
  private destroyRef = inject(DestroyRef);

  constructor(
    private userService: UserService,
    private messagingService: MessagingService
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currentUser) => {
        this.currentUser = currentUser;
      });
  }

  ngAfterViewInit(): void {
    this.chatInputRef.nativeElement.addEventListener('keypress', (event) => {
      if (event.key !== 'Enter') return;
      this.onSend();
    });

    this.messagingService.messageBus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        if (message.type !== MessageType.CHAT) return;
        const chatMessage = message as ChatMessage;
        const user = this.userService.getUserById(chatMessage.userId);
        if (!this.currentUser || !user) return;

        const username = this.currentUser.id === user.id ? 'You' : user.name;
        this.addMessageToChatArea(username, chatMessage.data.text);
      });
  }

  onInputChange(value: string) {
    this.counterRef.nativeElement.innerText = value.length.toString();
    if (value.length) this.counterRef.nativeElement.classList.remove('hidden');
    else this.counterRef.nativeElement.classList.add('hidden');
  }

  onSend() {
    if (!this.newMessage || !this.currentUser) return;

    this.messagingService.send({
      type: MessageType.CHAT,
      userId: this.currentUser.id,
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
