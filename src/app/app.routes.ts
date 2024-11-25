import { Routes } from '@angular/router';
import { GameComponent } from './pages/game/game.component';
import { LoginComponent } from './pages/login/login.component';
import { userGuard } from './guards/user.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'room', component: GameComponent, canActivate: [userGuard] },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
