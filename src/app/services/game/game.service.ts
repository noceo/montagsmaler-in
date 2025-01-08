import { Injectable } from '@angular/core';
import {
  DrawStatus,
  GamePhase,
  GameStatusMessage,
  GuessMessage,
  InitMessage,
  Message,
  MessageType,
  RevealLetterMessage,
  WordPickStatus,
} from '../../types/message.types';
import { BehaviorSubject, combineLatest, map, Observable, of } from 'rxjs';
import { User } from '../../types/user.types';
import { MessagingService } from '../messaging/messaging.service';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private currentUser?: User | null;
  private phase = new BehaviorSubject<GamePhase>(GamePhase.PREPARE);
  private wordChoices = new BehaviorSubject<string[]>([]);
  private activeUser = new BehaviorSubject<User | null>(null);
  private totalTime = new BehaviorSubject<number>(0);
  private remainingTime = new BehaviorSubject<number>(0);
  private timerIntervalId?: ReturnType<typeof setInterval>;
  private revealIntervalId?: ReturnType<typeof setInterval>;
  private currentRound = new BehaviorSubject<number>(1);
  private maxRounds = new BehaviorSubject<number>(3);
  private chosenWord = new BehaviorSubject<string>('');
  private revealedLetters = new BehaviorSubject<string[]>([]);
  private lastGuess = new BehaviorSubject<string>('');
  private isGuessCorrect = new BehaviorSubject<boolean>(false);
  private revealedIndices = [];
  private messageHandlers: Partial<
    Record<MessageType, (message: Message) => void>
  > = {
    [MessageType.INIT]: (message) => this.handleInit(message),
    [MessageType.GAME_STATUS]: (message) => this.handleGameStatus(message),
    [MessageType.REVEAL_LETTER]: (message) => this.handleRevealLetter(message),
    [MessageType.GUESS]: (message) => this.handleGuess(message),
  };

  readonly phase$ = this.phase.asObservable();
  readonly wordChoices$ = this.wordChoices.asObservable();
  readonly activeUser$ = this.activeUser.asObservable();
  readonly totalTime$ = this.totalTime.asObservable();
  readonly remainingTime$ = this.remainingTime.asObservable();
  readonly currentRound$ = this.currentRound.asObservable();
  readonly maxRounds$ = this.maxRounds.asObservable();
  readonly chosenWord$ = this.chosenWord.asObservable();
  readonly revealedLetters$ = this.revealedLetters.asObservable();
  readonly lastGuess$ = this.lastGuess.asObservable();
  readonly isGuessCorrect$ = this.isGuessCorrect.asObservable();
  readonly isMyTurn$: Observable<boolean> = of(false);

  constructor(
    private messagingService: MessagingService,
    private userService: UserService
  ) {
    this.messagingService.messageBus$.subscribe((message) => {
      if (!Object.hasOwn(this.messageHandlers, message.type)) return;
      this.messageHandlers[message.type]!(message);
    });

    this.userService.currentUser$.subscribe(
      (currentUser) => (this.currentUser = currentUser)
    );

    this.isMyTurn$ = combineLatest([
      this.activeUser$,
      this.userService.currentUser$,
    ]).pipe(
      map(([activeUser, currentUser]) => activeUser?.id === currentUser?.id)
    );
  }

  private handleInit(message: Message) {
    const initMessage = message as InitMessage;
    this.setPhase(initMessage.data.gameStatus.phase);
    const otherUsers = (message as InitMessage).data.users.filter(
      (user) => user.id !== this.currentUser?.id
    );
    this.userService.addUsers(otherUsers);
    this.setMaxRounds(initMessage.data.settings.maxRounds);
    // setTimeout(() => this.gameService.setPhase(GamePhase.DRAW));
  }

  private handleGameStatus(message: Message) {
    const gameStatusMessage = message as GameStatusMessage;
    this.setPhase(gameStatusMessage.data.gameStatus.phase);

    if (gameStatusMessage.data.gameStatus.phase === GamePhase.WORD_PICK) {
      const wordPickStatus = gameStatusMessage.data
        .gameStatus as WordPickStatus;
      const activeUser = this.userService.getUserById(
        wordPickStatus.data.userId
      );
      if (!activeUser) return;
      this.setActiveUser(activeUser);
      this.setWordChoices(wordPickStatus.data.choices);
      this.setTimer(wordPickStatus.data.timer);
      this.setCurrentRound(wordPickStatus.data.currentRound);
    } else if (gameStatusMessage.data.gameStatus.phase === GamePhase.DRAW) {
      const drawStatus = gameStatusMessage.data.gameStatus as DrawStatus;
      const activeUser = this.userService.getUserById(drawStatus.data.userId);
      if (!activeUser) return;
      console.log(drawStatus.data.chosenWord);
      this.setActiveUser(activeUser);
      this.setChosenWord(drawStatus.data.chosenWord);
      this.setTimer(drawStatus.data.timer);
      this.setIsGuessCorrect(false);
    }
  }

  private handleRevealLetter(message: Message) {
    if (this.isGuessCorrect.getValue()) return;
    const { index, letter } = (message as RevealLetterMessage).data;
    let newRevealedLetters = [...this.revealedLetters.getValue()];
    newRevealedLetters[index] = letter;
    this.revealedLetters.next(newRevealedLetters);
  }

  private handleGuess(message: Message) {
    const isGuessCorrect = (message as GuessMessage).data.isCorrect;
    if (this.currentUser?.id === message.userId)
      this.setIsGuessCorrect(isGuessCorrect);
  }

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

  setCurrentRound(currentRound: number) {
    this.currentRound.next(currentRound);
  }

  setMaxRounds(maxRounds: number) {
    this.maxRounds.next(maxRounds);
  }

  setChosenWord(chosenWord: string) {
    this.chosenWord.next(chosenWord);
    this.revealedLetters.next(Array(chosenWord.length).fill('_'));
  }

  setIsGuessCorrect(isGuessCorrect: boolean) {
    this.isGuessCorrect.next(isGuessCorrect);
  }

  setLastGuess(lastGuess: string) {
    this.lastGuess.next(lastGuess);
  }
}
