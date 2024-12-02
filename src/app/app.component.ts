import { Component, DestroyRef, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from './services/user/user.service';
import { GameService } from './services/gameStatus/game.service';
import {
  GamePhase,
  GameStatusMessage,
  InitMessage,
  JoinRoomMessage,
  LeaveRoomMessage,
  Message,
  MessageType,
  WordPickStatus,
} from './types/message.types';
import { User } from './types/user.types';
import { MessagingService } from './services/messaging/messaging.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private currentUser?: User | null;
  private destroyRef = inject(DestroyRef);
  title = 'montagsmaler-in';

  constructor(
    private userService: UserService,
    private gameService: GameService,
    private messagingService: MessagingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currentUser) => (this.currentUser = currentUser));

    this.messagingService.messageBus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => this.handleMessage(message));
  }

  private handleMessage(message: Message) {
    if (message.type === MessageType.JOIN_ROOM) {
      const joinRoomMessage = message as JoinRoomMessage;
      if (!this.currentUser) {
        this.userService.setCurrentUser({
          id: joinRoomMessage.data.user.id,
          name: joinRoomMessage.data.user.name,
        });
        const roomCode = joinRoomMessage.data.roomCode;
        this.router.navigate(['/room']);
        console.log(`Successfully joined room: ${roomCode}`);
        return;
      }

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
      const otherUsers = (message as InitMessage).data.users.filter(
        (user) => user.id !== this.currentUser?.id
      );
      this.userService.addUsers(otherUsers);
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
        if (!activeUser) return;
        this.gameService.setActiveUser(activeUser);
        this.gameService.setWordChoices(wordPickStatus.data.choices);
      }
    }
  }
}
