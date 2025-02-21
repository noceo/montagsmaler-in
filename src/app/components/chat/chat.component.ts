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
import {
  ChatMessage,
  GamePhase,
  GuessMessage,
  MessageType,
} from '../../types/message.types';
import { Subject, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from '../../types/user.types';
import { GameService } from '../../services/game/game.service';

enum UIMessageType {
  STANDARD,
  SUCCESS,
  WARNING,
  ERROR,
}

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
  isGuessCorrect: boolean = false;
  private currentUser?: User | null;
  private activeUser?: User | null;
  private phase?: GamePhase;
  private lastGuess: string = '';
  private destroyRef = inject(DestroyRef);

  constructor(
    private userService: UserService,
    private gameService: GameService,
    private messagingService: MessagingService
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currentUser) => {
        this.currentUser = currentUser;
      });

    this.gameService.activeUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((activeUser) => {
        this.activeUser = activeUser;
      });

    this.gameService.phase$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((phase) => {
        this.phase = phase;
        if (
          phase === GamePhase.DRAW &&
          this.currentUser?.id !== this.activeUser?.id
        ) {
          console.log('focus');
          setTimeout(() => this.chatInputRef.nativeElement.focus(), 1000);
        }
      });

    this.gameService.isGuessCorrect$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isGuessCorrect) => {
        this.isGuessCorrect = isGuessCorrect;
      });

    this.gameService.lastGuess$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lastGuess) => {
        this.lastGuess = lastGuess;
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
        if (message.type === MessageType.CHAT) {
          const chatMessage = message as ChatMessage;
          const user = this.userService.getUserById(chatMessage.userId);
          if (!this.currentUser || !user) return;

          const username = this.currentUser.id === user.id ? 'You' : user.name;
          const uiMessage = `${username}: ${chatMessage.data.text}`;
          this.addMessageToChatArea(uiMessage);
        }
      });

    this.messagingService.messageBus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        if (message.type === MessageType.GUESS) {
          const guessMessage = message as GuessMessage;
          // received by every client
          if (guessMessage.data.isCorrect) {
            const user = this.userService.getUserById(guessMessage.userId);
            if (!this.currentUser || !user) return;
            const username =
              this.currentUser.id === user.id ? 'You' : user.name;
            const uiMessage = `${username} guessed the word.`;
            this.addMessageToChatArea(uiMessage, UIMessageType.SUCCESS);
          }
          // only received by the user affected
          else if (guessMessage.data.isPartiallyCorrect) {
            const uiMessage = `${this.lastGuess} is close.`;
            this.addMessageToChatArea(uiMessage, UIMessageType.WARNING);
          }
        }
      });
  }

  onInputChange(value: string) {
    this.counterRef.nativeElement.innerText = value.length.toString();
    if (value.length) this.counterRef.nativeElement.classList.remove('hidden');
    else this.counterRef.nativeElement.classList.add('hidden');
  }

  onSend() {
    if (!this.newMessage || !this.currentUser) return;

    if (this.phase === GamePhase.DRAW)
      this.gameService.setLastGuess(this.newMessage);

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

  private addMessageToChatArea(
    message: string,
    type?: UIMessageType,
    username: string = ''
  ) {
    const containerElement = document.createElement('p');
    containerElement.className = 'message';
    switch (type) {
      case UIMessageType.SUCCESS:
        containerElement.classList.add('success');
        break;
      case UIMessageType.WARNING:
        containerElement.classList.add('warning');
        break;
      case UIMessageType.ERROR:
        containerElement.classList.add('error');
        break;
    }

    if (username) {
      const usernameElement = document.createElement('b');
      usernameElement.textContent = `${username}: `;
      containerElement.appendChild(usernameElement);
    }

    const messageElement = document.createTextNode(message);
    containerElement.appendChild(messageElement);
    this.chatAreaRef.nativeElement.appendChild(containerElement);
    this.chatAreaRef.nativeElement.scrollTo({
      top: this.chatAreaRef.nativeElement.scrollHeight,
    });
  }
}
