import { Component, inject, signal } from '@angular/core';
import { UserService } from '../../services/User/user-service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { CommonModule } from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTabsModule} from '@angular/material/tabs';
import { ChatService } from '../../services/chat/chat-service';
import {MatChipsModule} from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'users-component',
  imports: [CommonModule,MatIconModule,MatButtonModule,MatToolbarModule,MatTabsModule,MatListModule,MatDividerModule,MatChipsModule ,MatMenuModule],
  templateUrl: './users-component.html',
  styleUrl: './users-component.css'
})
export class UsersComponent {
username = signal('')
users: any[] = [];
private userSvc = inject(UserService)
private router = inject(Router)
private auth = inject(AuthService)

  constructor(){}

  ngOnInit(){
    this.userSvc.getUsers().subscribe((res:any) =>{
     this.users = res.users;
    })
    this.auth.user$.subscribe({next:val => this.username.set(val.username) })};

  openChat(u:any) {
    this.userSvc.setSelectedUser(u.username)
    this.router.navigate(['/home/chat', u.id]);
  }
  
  logout(){ this.auth.logout(); this.router.navigateByUrl('/login'); }
}
