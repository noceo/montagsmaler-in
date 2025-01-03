import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from './services/user/user.service';
import { GameService } from './services/game/game.service';
import {
  DrawStatus,
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
export class AppComponent implements OnInit {
  private currentUser?: User | null;
  private messageHandlers: Partial<
    Record<MessageType, (message: Message) => void>
  > = {
    [MessageType.JOIN_ROOM]: (message) => this.handleJoinRoom(message),
    [MessageType.LEAVE_ROOM]: (message) => this.handleLeaveRoom(message),
  };
  private destroyRef = inject(DestroyRef);
  title = 'montagsmaler-in';

  constructor(
    private userService: UserService,
    private messagingService: MessagingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currentUser) => (this.currentUser = currentUser));

    this.messagingService.messageBus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        if (!this.messageHandlers[message.type]) return;
        this.messageHandlers[message.type]!(message);
      });
  }

  private handleJoinRoom(message: Message) {
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

    console.log(`User ${(message as JoinRoomMessage).data.user.name} joined.`);
    this.userService.addUser((message as JoinRoomMessage).data.user);
  }

  private handleLeaveRoom(message: Message) {
    const leaveRoomMessage = message as LeaveRoomMessage;
    const leavingUser = this.userService.getUserById(
      leaveRoomMessage.data.userId
    );
    if (!leavingUser) return;

    console.log(`User ${leavingUser.name} left.`);
    this.userService.removeUser(leaveRoomMessage.data.userId);
  }
}
