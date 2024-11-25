import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MessagingService } from './services/messaging/messaging.service';
import { UserService } from './services/user/user.service';
import { InitMessage } from './types/message.types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'montagsmaler-in';

  constructor(
    private messagingService: MessagingService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.messagingService.subscribe((message) => {
      if (message.type === 'init') {
        console.log('Test');
        const otherUsers = (message as InitMessage).data.users.filter(
          (user) => user.id !== this.userService.getCurrentUser()?.id
        );
        this.userService.addUsers(otherUsers);
      }
    });
  }
}
