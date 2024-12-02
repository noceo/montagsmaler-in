import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../components/button/button.component';
import { MessagingService } from '../../services/messaging/messaging.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginMessage, MessageType } from '../../types/message.types';
import { faker } from '@faker-js/faker';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  //   private roomCode = '';
  username = '';
  private destroyRef = inject(DestroyRef);

  constructor(
    private messagingService: MessagingService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // chek if there is a roomCode included as a url param
    // this.route.queryParams
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe((params) => {
    //     if (Object.hasOwn(params, 'r')) this.roomCode = params['r'];
    //   });

    this.messagingService.connect();
    this.messagingService.onConnection(() => {
      this.messagingService.send({
        type: MessageType.LOGIN,
        data: { userName: faker.internet.username(), roomCode: 'test' },
      } as LoginMessage);
    });
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
