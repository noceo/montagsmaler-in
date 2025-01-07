import { WebSocketController } from '../controllers/websocket.controller';
import { Game } from '../model/game.model';
import { User } from '../model/user.model';

export class Room {
  private code: string;
  private name: string;
  private users: { [userId: string]: User };
  private game?: Game;

  constructor(code: string, name: string) {
    this.code = code;
    this.name = name;
    this.users = {};
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

  getGame(wsm: WebSocketController) {
    if (!this.game) this.game = new Game(wsm, this.code, this.getUsers(), 3);
    return this.game;
  }
}
