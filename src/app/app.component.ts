import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessagingService } from './services/messaging/messaging.service';
import { UserService } from './services/user/user.service';
import { InitMessage, MessageType } from './types/message.types';
import { User } from './types/user.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'montagsmaler-in';
  private currentUser?: User | null;
  private destroyRef = inject(DestroyRef);

  constructor(
    private messagingService: MessagingService,
    private userService: UserService
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
        if (message.type === MessageType.INIT) {
          const otherUsers = (message as InitMessage).data.users.filter(
            (user) => user.id !== this.currentUser?.id
          );
          this.userService.addUsers(otherUsers);
        }
      });
  }
}
