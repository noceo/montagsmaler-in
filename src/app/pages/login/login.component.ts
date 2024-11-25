import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../components/button/button.component';
import { MessagingService } from '../../services/messaging/messaging.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user/user.service';
import { JoinRoomMessage } from '../../types/message.types';
import { Subscription } from 'rxjs';
import { faker } from '@faker-js/faker';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  private messagingSubscription!: Subscription;
  private roomCode = '';
  username = '';

  constructor(
    private messagingService: MessagingService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // chek if there is a roomCode included as a url param
    this.route.queryParams.subscribe((params) => {
      if (Object.hasOwn(params, 'r')) this.roomCode = params['r'];
    });

    this.messagingSubscription = this.messagingService.subscribe((message) => {
      // if the server acknowledges that the client has joined
      console.log(message);
      if (message.type === 'joinRoom') {
        const joinRoomMessage = message as JoinRoomMessage;

        this.userService.setCurrentUser({
          id: joinRoomMessage.data.user.id,
          name: joinRoomMessage.data.user.name,
        });
        this.roomCode = joinRoomMessage.data.roomCode;
        this.router.navigate(['/room']);
        console.log(`Successfully joined room: ${this.roomCode}`);
      }
    });

    this.messagingService.connect();
    this.messagingService.onConnection(() => {
      this.messagingService.send({
        type: 'login',
        data: { userName: faker.internet.username(), roomCode: 'test' },
      });
    });
  }

  ngOnDestroy(): void {
    this.messagingSubscription.unsubscribe();
  }

  onLogin(event: Event) {
    // this.messagingService.connect();
    // this.messagingService.onConnection(() => {
    //   this.messagingService.send({
    //     type: 'login',
    //     data: { userName: this.username, roomCode: this.roomCode },
    //   });
    // });
  }
}
