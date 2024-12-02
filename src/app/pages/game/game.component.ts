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
export class GameComponent implements OnDestroy {
  constructor(
    private messagingService: MessagingService,
    private userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.userService.setCurrentUser(null);
    this.messagingService.disconnect();
  }
}
