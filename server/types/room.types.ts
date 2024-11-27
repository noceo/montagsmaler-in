import { GamePhase, GameStatus } from './message.types';
import { User } from './user.types';

export class Room {
  private code: string;
  private name: string;
  private users: { [userId: string]: User };
  private gameStatus: GameStatus;

  constructor(code: string, name: string) {
    this.code = code;
    this.name = name;
    this.users = {};
    this.gameStatus = { phase: GamePhase.PREPARE };
  }

  addUser(user: User) {
    this.users[user.id] = user;
  }
  removeUser(userId: string) {
    delete this.users[userId];
  }

  getUsers(): User[] {
    return Object.values(this.users);
  }

  getUserCount(): number {
    return Object.values(this.users).length;
  }

  userExists(userId: string): boolean {
    return !!this.users[userId];
  }

  getCode(): string {
    return this.code;
  }

  getName(): string {
    return this.name;
  }

  getGameStatus(): GameStatus {
    return this.gameStatus;
  }
}
