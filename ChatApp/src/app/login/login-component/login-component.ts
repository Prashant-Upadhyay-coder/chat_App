import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Router, RouterLink } from '@angular/router';
import { ChatService } from '../../services/chat/chat-service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';

import {MatDividerModule} from '@angular/material/divider';
@Component({
  selector: 'app-login-component',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatDividerModule, RouterLink],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css'
})
export class LoginComponent implements OnInit{
 error = '';
 LoginForm!: FormGroup;

  private auth = inject(AuthService);
  private router = inject(Router);
  private chat = inject(ChatService);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.LoginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  get f() {
    return this.LoginForm.controls;
  }

  submit() {
    if (this.LoginForm.invalid) {
      this.LoginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.LoginForm.value;

    this.auth.login(username, password).subscribe({
      next: (res: any) => {
        this.auth.setSession(res.user, res.token);
        this.chat.connect();
        this.router.navigateByUrl('/home');
      },
      error: (err) => {
        this.error = err?.error?.error || 'Login failed';
      },
    });
  }
}
