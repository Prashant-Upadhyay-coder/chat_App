import { Component } from '@angular/core';
import { UsersComponent } from '../../users/users-component/users-component';
import { MatCardModule } from '@angular/material/card';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'chat-layout',
  imports: [UsersComponent, RouterOutlet],
  templateUrl: './chat-layout.html',
  styleUrl: './chat-layout.css'
})
export class ChatLayout {

}
