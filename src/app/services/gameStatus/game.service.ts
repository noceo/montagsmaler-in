import { Injectable } from '@angular/core';
import { GamePhase } from '../../types/message.types';
import { BehaviorSubject, Subject } from 'rxjs';
import { User } from '../../types/user.types';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private phase = new BehaviorSubject<GamePhase>(GamePhase.PREPARE);
  private wordChoices = new BehaviorSubject<string[]>([]);
  private activeUser = new BehaviorSubject<User | null>(null);

  readonly phase$ = this.phase.asObservable();
  readonly wordChoices$ = this.wordChoices.asObservable();
  readonly activeUser$ = this.activeUser.asObservable();

  constructor() {}

  setPhase(phase: GamePhase) {
    this.phase.next(phase);
  }

  setWordChoices(words: string[]) {
    this.wordChoices.next(words);
  }

  setActiveUser(user: User) {
    this.activeUser.next(user);
  }
}
