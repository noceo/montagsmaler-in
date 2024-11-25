import { Component, OnDestroy, OnInit } from '@angular/core';
import { WhiteboardComponent } from '../../components/whiteboard/whiteboard.component';
import { UserListComponent } from '../../components/user-list/user-list.component';
import { MessagingService } from '../../services/messaging/messaging.service';
import { UserService } from '../../services/user/user.service';
import {
  InitMessage,
  JoinRoomMessage,
  LeaveRoomMessage,
  MessageType,
} from '../../types/message.types';
import { Subscription } from 'rxjs';
import { ChatComponent } from '../../components/chat/chat.component';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';

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
  private messagingSubscription!: Subscription;

  constructor(
    private messagingService: MessagingService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.messagingSubscription = this.messagingService.subscribe((message) => {
      if (message.type === MessageType.JOIN_ROOM) {
        console.log(
          (message as JoinRoomMessage).data.user.name,
          this.userService.getCurrentUser()?.name
        );
        if (
          (message as JoinRoomMessage).data.user.name ===
          this.userService.getCurrentUser()?.name
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
      }
    });
  }

  ngOnDestroy(): void {
    this.userService.setCurrentUser(undefined);
    this.messagingSubscription.unsubscribe();
    this.messagingService.disconnect();
  }
}
