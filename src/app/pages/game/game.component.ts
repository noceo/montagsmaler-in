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
import { GameService } from '../../services/game/game.service';
import { User } from '../../types/user.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimerComponent } from '../../components/timer/timer.component';
import { GameInfoPanelComponent } from '../../components/game-info-panel/game-info-panel.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    WhiteboardComponent,
    UserListComponent,
    ChatComponent,
    ToolbarComponent,
    TimerComponent,
    GameInfoPanelComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  isMyTurn: boolean = false;

  constructor(
    private messagingService: MessagingService,
    private gameService: GameService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.gameService.isMyTurn$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isMyTurn) => (this.isMyTurn = isMyTurn));
  }

  ngOnDestroy(): void {
    this.userService.setCurrentUser(null);
    this.messagingService.disconnect();
  }
}
