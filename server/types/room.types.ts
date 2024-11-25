import { User } from './user.types';

export interface Room {
  code: string;
  users: { [userId: string]: User };
}
