import { WebSocketManager } from '../app/sockets/webSocketManager';
import {
  DrawStatus,
  GamePhase,
  GameStatusMessage,
  MessageType,
  RevealLetterMessage,
  WordPickStatus,
} from './message.types';
import { User } from './user.types';
import distance from 'jaro-winkler';

const PHASE_DURATIONS: Record<GamePhase, number> = {
  [GamePhase.PREPARE]: 0,
  [GamePhase.WORD_PICK]: 3,
  [GamePhase.DRAW]: 50,
  [GamePhase.RESULT]: 0,
};

const MAX_POINTS = 1000;

export class Game {
  private phase: GamePhase;
  private phaseDuration: number;
  private activeUser?: User;
  private users: { user: User; points: number }[];
  private currentRound: number;
  private currentDrawPhaseStats: {
    user: User;
    points: number;
    guessedCorrectly: boolean;
  }[];
  private maxRounds: number;
  private chosenWord: string;
  private wordChoices: string[];
  private correctGuesses: number;
  private webSocketManager: WebSocketManager;
  private roomCode: string;
  private currentTimeout: NodeJS.Timeout | null;
  private revealInterval: NodeJS.Timeout | null;
  private timerInterval: NodeJS.Timeout | null;
  private secondsRemaining: number;
  cancelWordPickPhase?: () => void;
  cancelDrawPhase?: () => void;

  constructor(
    webSocketManager: WebSocketManager,
    roomCode: string,
    users: User[],
    maxRounds: number
  ) {
    this.phase = GamePhase.PREPARE;
    this.phaseDuration = PHASE_DURATIONS[GamePhase.PREPARE];
    this.chosenWord = '';
    this.wordChoices = ['test1', 'test2', 'test3'];
    this.correctGuesses = 0;
    this.webSocketManager = webSocketManager;
    this.roomCode = roomCode;
    this.users = users.map((user) => ({ user: user, points: 0 }));
    this.currentRound = 1;
    this.currentDrawPhaseStats = users.map((user) => ({
      user: user,
      points: 0,
      guessedCorrectly: false,
    }));
    this.maxRounds = maxRounds;
    this.currentTimeout = null;
    this.revealInterval = null;
    this.timerInterval = null;
    this.secondsRemaining = 0;
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  getActiveUser(): User | undefined {
    return this.activeUser;
  }

  getWordChoices(): string[] {
    return this.wordChoices;
  }

  getChosenWord(): string {
    return this.chosenWord;
  }

  setChosenWord(chosenWord: string): void {
    this.chosenWord = chosenWord;
  }

  isGuessCorrect(guess: string): boolean {
    return guess === this.chosenWord;
  }

  isGuessPartiallyCorrect(guess: string): boolean {
    return distance(guess, this.chosenWord) > 0.9;
  }

  isFirstCorrectGuess(userId: string): boolean {
    const user = this.currentDrawPhaseStats.find(
      (user) => user.user.id === userId
    );
    if (!user) return true;
    return !user.guessedCorrectly;
  }

  registerCorrectGuess(userId: string) {
    const user = this.users.find((entry) => entry.user.id === userId);
    const currentDrawPhaseUser = this.currentDrawPhaseStats.find(
      (entry) => entry.user.id === userId
    );
    if (!user || !currentDrawPhaseUser) return;

    // calculate points based on remaining time
    const remainingTimePercentage = this.secondsRemaining / this.phaseDuration;
    let points;
    if (remainingTimePercentage >= 0.9) points = MAX_POINTS;
    else if (remainingTimePercentage >= 0.8) points = MAX_POINTS * 0.8;
    else if (remainingTimePercentage >= 0.7) points = MAX_POINTS * 0.7;
    else if (remainingTimePercentage >= 0.6) points = MAX_POINTS * 0.6;
    else if (remainingTimePercentage >= 0.5) points = MAX_POINTS * 0.5;
    else points = MAX_POINTS * 0.25;
    points = Math.floor(points);

    user.points += points;
    currentDrawPhaseUser.points += points;
    currentDrawPhaseUser.guessedCorrectly = true;
    this.correctGuesses++;

    if (this.correctGuesses === this.users.length && this.cancelDrawPhase) {
      this.cancelDrawPhase();
    }
  }

  async start() {
    for (let i = 0; i < this.maxRounds; i++) {
      this.currentRound = i + 1;
      console.log(`Round: ${this.currentRound}`);
      for (const { user } of this.users) {
        this.currentDrawPhaseStats = this.users.map((entry) => ({
          user: entry.user,
          points: 0,
          guessedCorrectly: false,
        }));
        this.activeUser = user;
        this.correctGuesses = 0;
        console.log(`Active User: ${this.activeUser.name}`);
        await this.wordPickPhase(this.activeUser);
        await this.drawPhase(this.activeUser);
        console.log('Round Stats: ', this.currentDrawPhaseStats);
      }
    }
    this.resultPhase();
  }

  private wordPickPhase(activeUser: User): Promise<void> {
    this.phase = GamePhase.WORD_PICK;
    this.phaseDuration = PHASE_DURATIONS[GamePhase.WORD_PICK];
    this.webSocketManager.broadcastToRoom(this.roomCode, {
      type: MessageType.GAME_STATUS,
      data: {
        gameStatus: {
          phase: GamePhase.WORD_PICK,
          data: {
            userId: activeUser.id,
            choices: this.wordChoices,
            timer: this.phaseDuration,
            currentRound: this.currentRound,
          },
        } as WordPickStatus,
      },
    } as GameStatusMessage);
    console.log(`Phase: ${this.phase}`);
    console.log(this.phaseDuration);
    this.startTimer(this.phaseDuration);

    return new Promise((resolve, _reject) => {
      this.currentTimeout = setTimeout(() => {
        this.chosenWord = this.wordChoices[Math.floor(Math.random() * 3)];
        resolve();
      }, this.phaseDuration * 1000);

      this.cancelWordPickPhase = () => {
        clearTimeout(this.currentTimeout!);
        resolve();
        console.log('Word Pick Timeout cancelled.');
      };
    });
  }

  private drawPhase(activeUser: User): Promise<void> {
    this.phase = GamePhase.DRAW;
    this.phaseDuration = PHASE_DURATIONS[GamePhase.DRAW];
    console.log(this.chosenWord);

    this.webSocketManager.broadcastToRoom(this.roomCode, {
      type: MessageType.GAME_STATUS,
      data: {
        gameStatus: {
          phase: GamePhase.DRAW,
          data: {
            userId: activeUser.id,
            drawHistory: {},
            timer: this.phaseDuration,
            currentRound: this.currentRound,
            chosenWord: this.chosenWord,
          },
        } as DrawStatus,
      },
    } as GameStatusMessage);
    console.log(`Phase: ${this.phase}`);
    console.log(this.phaseDuration);

    // set interval for revealing random letters
    const chosenWord = this.chosenWord;
    const revealInterval = Math.floor(this.phaseDuration / chosenWord.length);
    const randomIndices = Array.from(
      { length: chosenWord.length },
      (_, i) => i
    );
    for (let i = randomIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [randomIndices[i], randomIndices[j]] = [
        randomIndices[j],
        randomIndices[i],
      ];
    }
    let i = 0;
    console.log(
      randomIndices,
      revealInterval,
      this.phaseDuration,
      chosenWord.length
    );

    this.revealInterval = setInterval(() => {
      const randIndex = randomIndices[i];
      this.webSocketManager.broadcastToRoom(this.roomCode, {
        type: MessageType.REVEAL_LETTER,
        data: {
          index: randIndex,
          letter: this.chosenWord[randIndex],
        },
      } as RevealLetterMessage);
      i++;
    }, revealInterval * 1000);

    this.startTimer(this.phaseDuration);

    return new Promise((resolve, _reject) => {
      setTimeout(() => {
        clearInterval(this.revealInterval!);
        resolve();
      }, this.phaseDuration * 1000);

      this.cancelDrawPhase = () => {
        clearTimeout(this.currentTimeout!);
        resolve();
        console.log('Draw Timeout cancelled.');
      };
    });
  }

  private resultPhase() {
    console.log('Showing results...');
  }

  private startTimer(seconds: number): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.secondsRemaining = seconds;
    this.timerInterval = setInterval(() => {
      if (this.secondsRemaining > 0) this.secondsRemaining--;
      else clearInterval(this.timerInterval!);
    }, 1000);
  }
}
