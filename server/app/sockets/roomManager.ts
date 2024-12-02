import { GamePhase } from '../../types/message.types';
import { Room } from '../../types/room.types';
import { User } from '../../types/user.types';

export class RoomManager {
  private rooms: { [roomCode: string]: Room };
  private userRoomMap: { [userId: string]: string };

  constructor() {
    this.rooms = {};
    this.userRoomMap = {};
  }

  // Room lifecycle management
  createRoom(roomCode: string): Room {
    if (!this.rooms[roomCode]) {
      this.rooms[roomCode] = new Room(roomCode, '');
    }
    return this.rooms[roomCode];
  }

  deleteRoom(roomCode: string): void {
    delete this.rooms[roomCode];
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms[roomCode];
  }

  getRoomByUserId(userId: string) {
    const roomCode = this.userRoomMap[userId];
    return this.rooms[roomCode];
  }

  // User management within rooms
  addUserToRoom(roomCode: string, user: User): boolean {
    const room = this.rooms[roomCode];
    if (!room) return false;

    room.addUser(user);
    this.userRoomMap[user.id] = room.getCode();
    console.log(room);
    return true;
  }

  removeUserFromRoom(roomCode: string, userId: string): boolean {
    if (!this.roomExists(roomCode)) return false;

    const room = this.rooms[roomCode];
    if (!room.userExists(userId)) return false;

    room.removeUser(userId);
    delete this.userRoomMap[userId];

    // Delete the room if it's empty
    if (room.getUserCount() === 0) {
      this.deleteRoom(roomCode);
    }
    return true;
  }

  getUsersInRoom(roomCode: string): User[] {
    if (!this.roomExists(roomCode)) return [];
    const room = this.rooms[roomCode];
    return room.getUsers();
  }

  roomExists(roomCode: string): boolean {
    return !!this.rooms[roomCode];
  }
}
