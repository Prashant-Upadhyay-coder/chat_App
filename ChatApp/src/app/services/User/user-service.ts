import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _selectedUser = new BehaviorSubject<string | null>(null);
  public selectedUser$ = this._selectedUser.asObservable();

  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get<any>(`${environment.apiUrl}/users`);
  }

  setSelectedUser(name: string) {
    this._selectedUser.next(name);
    localStorage.setItem('selectedUser', name);
  }

  restoreSelectedUser() {
    const stored = localStorage.getItem('selectedUser');
    if (stored) this._selectedUser.next(stored);
  }

  getSelectedUserValue() {
    return this._selectedUser.value;
  }
}
