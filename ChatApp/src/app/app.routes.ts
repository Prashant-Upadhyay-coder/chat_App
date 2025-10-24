import { Routes } from '@angular/router';
import { LoginComponent } from './login/login-component/login-component';
import { UsersComponent } from './users/users-component/users-component';
import { ChatComponent } from './chat/chat-component/chat-component';
import { ChatLayout } from './main/chat-layout/chat-layout';
import { Registeruser } from './registeruser/registeruser';

export const routes: Routes = [
 { path: 'login', component: LoginComponent },
  {
    path: 'home',
    component: ChatLayout,
    children: [
      { path: 'chat/:id', component: ChatComponent }, // nested route
    ],
  },
  {path:'register',component:Registeruser},
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];
