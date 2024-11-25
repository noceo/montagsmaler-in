import { Room } from '../../types/room.types';
import { User } from '../../types/user.types';

export class RoomManager {
  private rooms: { [roomCode: string]: Room };

  constructor() {
    this.rooms = {};
  }

  // Room lifecycle management
  createRoom(roomCode: string): Room {
    if (!this.rooms[roomCode]) {
      this.rooms[roomCode] = { code: roomCode, users: {} };
    }
    return this.rooms[roomCode];
  }

  deleteRoom(roomCode: string): void {
    delete this.rooms[roomCode];
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms[roomCode];
  }

  // User management within rooms
  addUserToRoom(roomCode: string, user: User): boolean {
    const room = this.rooms[roomCode];
    if (!room) return false;

    room.users[user.id] = user;
    console.log(room);
    return true;
  }

  removeUserFromRoom(roomCode: string, userId: string): boolean {
    const room = this.rooms[roomCode];
    if (!room || !room.users[userId]) return false;

    delete room.users[userId];

    // Delete the room if it's empty
    if (Object.keys(room.users).length === 0) {
      this.deleteRoom(roomCode);
    }
    return true;
  }

  getUsersInRoom(roomCode: string): User[] {
    const room = this.rooms[roomCode];
    return room ? Object.values(room.users) : [];
  }

  roomExists(roomCode: string): boolean {
    return !!this.rooms[roomCode];
  }
}
