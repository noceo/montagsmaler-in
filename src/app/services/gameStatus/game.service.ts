import { Injectable } from '@angular/core';
import { GamePhase } from '../../types/message.types';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private phase = new Subject<GamePhase>();

  readonly phase$ = this.phase.asObservable();

  constructor() {}

  setPhase(phase: GamePhase) {
    this.phase.next(phase);
  }
}
