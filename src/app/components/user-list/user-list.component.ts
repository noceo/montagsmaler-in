import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { UserService } from '../../services/user/user.service';
import { User } from '../../types/user.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  currentUser?: User | null;
  users: User[] = [];
  private destroyRef = inject(DestroyRef);

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currentUser) => {
        this.currentUser = currentUser;
      });
    this.userService.users$.subscribe((users) => {
      this.users = Object.values(users);
      //   console.log(this.users);
    });
  }
}
