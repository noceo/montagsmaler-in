import { DestroyRef, inject, Injectable, OnDestroy } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, Subject, Subscription } from 'rxjs';
import { Message } from '../../types/message.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class MessagingService implements OnDestroy {
  private messageBus = new Subject<Message>();
  private socket!: WebSocket;

  readonly messageBus$ = this.messageBus.asObservable();

  ngOnDestroy(): void {
    this.disconnect();
  }

  connect() {
    this.socket = new WebSocket(environment.socketURL);
    console.log(environment.socketURL);
    this.socket.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
      this.messageBus.next(message);
    };
  }

  disconnect() {
    if (this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.close();
  }

  onConnection(callback: () => void) {
    this.socket.onopen = callback;
  }

  send(message: Message) {
    this.socket.send(JSON.stringify(message));
  }
}
