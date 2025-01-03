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

const PHASE_DURATIONS: Record<GamePhase, number> = {
  [GamePhase.PREPARE]: 0,
  [GamePhase.WORD_PICK]: 3,
  [GamePhase.DRAW]: 50,
  [GamePhase.RESULT]: 0,
};

export class Game {
  private phase: GamePhase;
  private activeUser?: User;
  private users: User[];
  private currentRound: number;
  private maxRounds: number;
  private chosenWord: string;
  private wordChoices: string[];
  private webSocketManager: WebSocketManager;
  private roomCode: string;
  private timer: number;
  private currentTimeout: NodeJS.Timeout | null;
  private revealInterval: NodeJS.Timeout | null;
  cancelWordPickPhase?: () => void;

  constructor(
    webSocketManager: WebSocketManager,
    roomCode: string,
    users: User[],
    maxRounds: number
  ) {
    this.phase = GamePhase.PREPARE;
    this.chosenWord = '';
    this.wordChoices = ['test1', 'test2', 'test3'];
    this.webSocketManager = webSocketManager;
    this.roomCode = roomCode;
    this.users = users;
    this.timer = 0;
    this.currentRound = 1;
    this.maxRounds = maxRounds;
    this.currentTimeout = null;
    this.revealInterval = null;
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

  setChosenWord(chosenWord: string): void {
    this.chosenWord = chosenWord;
  }

  async start() {
    for (let i = 0; i < this.maxRounds; i++) {
      this.currentRound = i + 1;
      console.log(`Round: ${this.currentRound}`);
      for (const user of this.users) {
        this.activeUser = user;
        console.log(`Active User: ${this.activeUser.name}`);
        await this.wordPickPhase(this.activeUser);
        await this.drawPhase(this.activeUser);
      }
    }
    this.resultPhase();
  }

  private wordPickPhase(activeUser: User): Promise<void> {
    this.phase = GamePhase.WORD_PICK;
    const duration = PHASE_DURATIONS[GamePhase.WORD_PICK];
    this.webSocketManager.broadcastToRoom(this.roomCode, {
      type: MessageType.GAME_STATUS,
      data: {
        gameStatus: {
          phase: GamePhase.WORD_PICK,
          data: {
            userId: activeUser.id,
            choices: this.wordChoices,
            timer: duration,
            currentRound: this.currentRound,
          },
        } as WordPickStatus,
      },
    } as GameStatusMessage);
    console.log(`Phase: ${this.phase}`);
    console.log(duration);
    return new Promise((resolve, _reject) => {
      this.currentTimeout = setTimeout(() => {
        this.chosenWord = this.wordChoices[Math.floor(Math.random() * 3)];
        resolve();
      }, duration * 1000);

      this.cancelWordPickPhase = () => {
        clearTimeout(this.currentTimeout!);
        resolve();
        console.log('Word Pick Timeout cancelled.');
      };
    });
  }

  private drawPhase(activeUser: User): Promise<void> {
    this.phase = GamePhase.DRAW;
    const duration = PHASE_DURATIONS[GamePhase.DRAW];
    console.log(this.chosenWord);

    this.webSocketManager.broadcastToRoom(this.roomCode, {
      type: MessageType.GAME_STATUS,
      data: {
        gameStatus: {
          phase: GamePhase.DRAW,
          data: {
            userId: activeUser.id,
            drawHistory: {},
            timer: duration,
            currentRound: this.currentRound,
            chosenWord: this.chosenWord,
          },
        } as DrawStatus,
      },
    } as GameStatusMessage);
    console.log(`Phase: ${this.phase}`);
    console.log(duration);

    // set interval for revealing random letters
    const chosenWord = this.chosenWord;
    const revealInterval = Math.floor(duration / chosenWord.length);
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
    console.log(randomIndices, revealInterval, duration, chosenWord.length);

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

    return new Promise((resolve, _reject) => {
      setTimeout(() => {
        clearInterval(this.revealInterval!);
        resolve();
      }, duration * 1000);
    });
  }

  private resultPhase() {
    console.log('Showing results...');
  }

  private setTimer(callback: () => void, seconds: number): NodeJS.Timeout {
    this.timer = seconds;
    return setTimeout(callback, seconds * 1000);
  }
}
