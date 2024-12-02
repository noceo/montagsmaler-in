import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { WhiteboardComponent } from '../../components/whiteboard/whiteboard.component';
import { UserListComponent } from '../../components/user-list/user-list.component';
import { MessagingService } from '../../services/messaging/messaging.service';
import { UserService } from '../../services/user/user.service';
import {
  GamePhase,
  GameStatusMessage,
  InitMessage,
  JoinRoomMessage,
  LeaveRoomMessage,
  MessageType,
  WordPickStatus,
} from '../../types/message.types';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ChatComponent } from '../../components/chat/chat.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { GameService } from '../../services/gameStatus/game.service';
import { User } from '../../types/user.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    WhiteboardComponent,
    UserListComponent,
    ChatComponent,
    ToolbarComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  private currentUser?: User | null;
  private destroyRef = inject(DestroyRef);

  constructor(
    private messagingService: MessagingService,
    private userService: UserService,
    private gameService: GameService
  ) {}

  ngOnInit() {
    this.userService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currentUser) => {
        this.currentUser = currentUser;
      });

    this.messagingService.messageBus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        if (message.type === MessageType.JOIN_ROOM) {
          console.log(
            (message as JoinRoomMessage).data.user.name,
            this.currentUser?.name
          );
          if (
            (message as JoinRoomMessage).data.user.name ===
            this.currentUser?.name
          )
            return;

          console.log(
            `User ${(message as JoinRoomMessage).data.user.name} joined.`
          );
          this.userService.addUser((message as JoinRoomMessage).data.user);
        } else if (message.type === MessageType.LEAVE_ROOM) {
          const leaveRoomMessage = message as LeaveRoomMessage;
          const leavingUser = this.userService.getUserById(
            leaveRoomMessage.data.userId
          );
          if (!leavingUser) return;

          console.log(`User ${leavingUser.name} left.`);
          this.userService.removeUser(leaveRoomMessage.data.userId);
        } else if (message.type === MessageType.INIT) {
          const initMessage = message as InitMessage;
          this.gameService.setPhase(initMessage.data.gameStatus.phase);
          // setTimeout(() => this.gameService.setPhase(GamePhase.DRAW));
        } else if (message.type === MessageType.GAME_STATUS) {
          const gameStatusMessage = message as GameStatusMessage;
          this.gameService.setPhase(gameStatusMessage.data.gameStatus.phase);

          if (gameStatusMessage.data.gameStatus.phase === GamePhase.WORD_PICK) {
            const wordPickStatus = gameStatusMessage.data
              .gameStatus as WordPickStatus;
            const activeUser = this.userService.getUserById(
              wordPickStatus.data.userId
            );
            console.log('PICK', activeUser);
            if (!activeUser) return;
            this.gameService.setActiveUser(activeUser);
            this.gameService.setWordChoices(wordPickStatus.data.choices);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.userService.setCurrentUser(null);
    this.messagingService.disconnect();
  }
}
