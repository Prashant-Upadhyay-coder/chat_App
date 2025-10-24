import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'registeruser',

  imports: [CommonModule,ReactiveFormsModule,MatCardModule,MatInputModule,MatFormFieldModule ,MatButtonModule],
  templateUrl: './registeruser.html',
  styleUrl: './registeruser.css'
})
export class Registeruser implements OnInit {
 registerForm!:FormGroup
 error ='';
 
 private fb = inject(FormBuilder)
 private auth = inject(AuthService)
 private router = inject(Router)


  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email:['',[Validators.required , Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  get f() {
    return this.registerForm.controls;
  }
   submit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { username,email, password } = this.registerForm.value;

    this.auth.register(username,email,password).subscribe({
      next: () => {
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.error = err?.error?.error || 'Login failed';
      },
    });
  }

}
