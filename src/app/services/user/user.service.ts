import { Injectable } from '@angular/core';
import { User } from '../../types/user.types';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface UserMap {
  [userId: string]: User;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users = new BehaviorSubject<UserMap>({});
  private currentUser = new BehaviorSubject<User | null>(null);

  readonly users$ = this.users.asObservable();
  readonly currentUser$ = this.currentUser.asObservable();

  addUser(user: User) {
    console.log('Add new user: ', user);
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
    return this.currentUser.value?.id === id
      ? this.currentUser.value
      : this.users.value[id];
  }

  setCurrentUser(user: User | null) {
    this.currentUser.next(user);
  }
}
