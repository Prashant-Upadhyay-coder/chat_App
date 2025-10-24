import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = new BehaviorSubject<any>(null);
  public user$ = this._user.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) this._user.next(JSON.parse(user));
  }

  register(username: string, email: string, password: string) {
    return this.http.post(`${environment.apiUrl}/auth/register`, { username, email, password });
  }

  login(username: string, password: string) {

    return this.http.post(`${environment.apiUrl}/auth/login`, {
  username: username,
  password: password
});

  }

  setSession(user: any, token: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this._user.next(user);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._user.next('');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser() {
    return this._user.value;
  }
}
