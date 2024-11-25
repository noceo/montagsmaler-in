import { Injectable } from '@angular/core';
import { User } from '../../types/user.types';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserMap {
  [userId: string]: User;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users = new BehaviorSubject<UserMap>({});
  private currentUser?: User;

  readonly users$: Observable<UserMap> = this.users.asObservable();

  addUser(user: User) {
    this.users.next({
      ...this.users.value,
      [user.id]: user,
    });
  }

  addUsers(users: User[]) {
    const newUsers = users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {} as { [userId: string]: User });

    const currentUsers = this.users.value;
    this.users.next({
      ...currentUsers,
      ...newUsers,
    });
  }

  removeUser(id: string) {
    const currentUsers = { ...this.users.value };
    delete currentUsers[id];
    this.users.next(currentUsers);
  }

  getUserById(id: string): User | undefined {
    return this.users.value[id];
  }

  getCurrentUser(): User | undefined {
    return this.currentUser;
  }

  setCurrentUser(user?: User) {
    this.currentUser = user;
  }
}
