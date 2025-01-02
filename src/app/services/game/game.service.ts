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
  private totalTime = new Subject<number>();
  private remainingTime = new Subject<number>();
  private timerIntervalId?: ReturnType<typeof setInterval>;

  readonly phase$ = this.phase.asObservable();
  readonly wordChoices$ = this.wordChoices.asObservable();
  readonly activeUser$ = this.activeUser.asObservable();
  readonly totalTime$ = this.totalTime.asObservable();
  readonly remainingTime$ = this.remainingTime.asObservable();

  setPhase(phase: GamePhase) {
    this.phase.next(phase);
  }

  setWordChoices(words: string[]) {
    this.wordChoices.next(words);
  }

  setActiveUser(user: User) {
    this.activeUser.next(user);
  }

  setTimer(timer: number) {
    if (this.timerIntervalId) clearInterval(this.timerIntervalId);
    let currentTime = timer;
    this.totalTime.next(timer);
    this.remainingTime.next(currentTime--);
    this.timerIntervalId = setInterval(() => {
      if (currentTime >= 0) this.remainingTime.next(currentTime--);
      else clearInterval(this.timerIntervalId);
    }, 1000);
  }
}
