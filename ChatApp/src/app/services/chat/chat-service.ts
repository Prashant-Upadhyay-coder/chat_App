import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth-service';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private socket: Socket | null = null;

  private replyMessageSource = new BehaviorSubject<any | null>(null);
  replyMessage$ = this.replyMessageSource.asObservable();

  constructor(private auth: AuthService, private http: HttpClient) {}

  /** SOCKET CONNECTION **/
  connect() {
    const token = this.auth.getToken();
    if (!token) return;
    this.socket = io(environment.socketUrl, { query: { token } });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  /** REPLY SYSTEM **/
  setReplyMessage(msg: any) {
    this.replyMessageSource.next(msg);
  }
  clearReplyMessage() {
    this.replyMessageSource.next(null);
  }

  /** SOCKET LISTENERS **/
  onMessage(cb: (msg: any) => void) {
    this.socket?.on('private_message', (m) => cb(m));
  }

  onMessageEdited(cb: (msg: any) => void) {
    this.socket?.on('message_edited', (m) => cb(m));
  }

  onMessageDeleted(cb: (msg: any) => void) {
    this.socket?.on('message_deleted', (m) => cb(m));
  }

  onSeen(cb: (data: any) => void) {
    this.socket?.on('message_seen', (data) => cb(data));
  }

  /** SOCKET EMIT **/
  sendSocketMessage(to: string, content: string, replyToId?: string) {
    const payload = { to, content, replyToId: replyToId || null };
    this.socket?.emit('private_message', payload);
  }

  sendSocketEdit(messageId: string, content: string) {
    this.socket?.emit('edit_message', { messageId, content });
  }

  sendSocketDelete(messageId: string) {
    this.socket?.emit('delete_message', { messageId });
  }

  emitSeen(messageId: string, to: string) {
    this.socket?.emit('message_seen', { messageId, to });
  }

  /** REST ENDPOINTS **/
  sendMessageREST(receiverId: string, content: string, replyToId?: string) {
    return this.http.post(`${environment.apiUrl}/messages`, { receiverId, content, replyToId });
  }

  editMessage(messageId: string, content: string) {
    return this.http.put(`${environment.apiUrl}/messages/edit`, { messageId, content });
  }

  deleteMessage(messageId: string) {
    return this.http.delete(`${environment.apiUrl}/messages/${messageId}`);
  }

  getConversation(otherUserId: string, limit = 100) {
    return this.http.get<any>(`${environment.apiUrl}/messages/${otherUserId}?limit=${limit}`);
  }

  markSeen(otherUserId: string) {
    return this.http.post(`${environment.apiUrl}/messages/mark-seen`, { otherUserId });
  }
  // --- Listen for reactions ---
onMessageReaction(cb: (data: any) => void) {
  this.socket?.on('message_reaction', (reaction) => cb(reaction));
}

// --- Emit reaction ---
reactToMessage(messageId: string, reactionType: string) {
  this.socket?.emit('react_message', { messageId, reactionType });
}

// --- Optional: REST call to fetch reactions on load ---
getMessageReactions(messageId: string) {
  return this.http.get<any>(`${environment.apiUrl}/messages/${messageId}/reactions`);
}
}
