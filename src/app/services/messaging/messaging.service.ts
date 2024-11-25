import { Injectable, OnDestroy } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Subject, Subscription } from 'rxjs';
import { Message } from '../../types/message.types';

@Injectable({
  providedIn: 'root',
})
export class MessagingService implements OnDestroy {
  private messageBus = new Subject<Message>();
  private subscriptions: Subscription[] = [];
  private socket!: WebSocket;

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

  subscribe(callback: (message: Message) => void) {
    const subscription = this.messageBus.subscribe(callback);
    this.subscriptions.push(subscription);
    return subscription;
  }

  send(message: Message) {
    this.socket.send(JSON.stringify(message));
  }
}
