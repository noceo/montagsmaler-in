import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user/user.service';
import { map } from 'rxjs';

export const userGuard: CanActivateFn = (_route, _state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.currentUser$.pipe(
    map((currentUser) => {
      if (currentUser) return true;
      router.navigate(['']);
      return false;
    })
  );
};
