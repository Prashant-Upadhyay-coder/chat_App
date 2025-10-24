import { Component, inject, signal } from '@angular/core';
import { ChatService } from '../../services/chat/chat-service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {MatChipsModule} from '@angular/material/chips';

import {MatToolbarModule} from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../services/User/user-service';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-chat-component',
  imports: [FormsModule,CommonModule,MatToolbarModule,MatChipsModule,MatIcon,MatButtonModule,MatMenuModule],
  templateUrl: './chat-component.html',
  styleUrl: './chat-component.css',

})
export class ChatComponent {
 otherId!: string;
  otherUsername = signal('Contact');
  messages: any[] = [];
  text = '';
  editingMessageId: string | null = null;
  replyingTo: any = null;
  meId!: string;
 emojisIcon=['👍','❤️','😂','😮','😢','👏']
  private chat = inject(ChatService);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private usersrv = inject(UserService);

  ngOnInit() {
    const me = this.auth.getCurrentUser();
    if (!me) return;
    this.meId = me.id;

    this.chat.connect();
    this.usersrv.restoreSelectedUser();

    this.route.params.subscribe(params => {
      this.otherId = params['id'];
      this.loadConversation();
    });

    this.usersrv.selectedUser$.subscribe(name => {
      if (name?.trim()) this.otherUsername.set(name);
    });

    // Incoming messages
    this.chat.onMessage(msg => {



      if (
        (msg.senderId === this.otherId && msg.receiverId === this.meId) ||
        (msg.senderId === this.meId && msg.receiverId === this.otherId)
      ) {
        this.messages.push(msg);
        setTimeout(() => this.scrollToBottom(), 50);
        if (msg.senderId === this.otherId && !msg.seen) {
          this.chat.emitSeen(msg.id, msg.senderId);
        }
      }
    });

// Live edits
this.chat.onMessageEdited(updatedMsg => {
  const idx = this.messages.findIndex(m => m.id === updatedMsg.id);
  if (idx !== -1) {
    // Merge old + new message data
    this.messages[idx] = {
      ...this.messages[idx],
      ...updatedMsg,
    };
  }
});

    // Live deletes
    this.chat.onMessageDeleted(deletedMsg => {
      const idx = this.messages.findIndex(m => m.id === deletedMsg.id);
      if (idx !== -1) {
        this.messages[idx] = { ...this.messages[idx], ...deletedMsg, deleted: true };
        if (this.replyingTo?.id === deletedMsg.id) this.cancelReply();
      }
    });

    // Seen updates
    this.chat.onSeen(data => {
      const msg = this.messages.find(m => m.id === data.messageId);
      if (msg) msg.seen = true;
    });
// Live reaction updates
this.chat.onMessageReaction(reaction => {
  const msg = this.messages.find(m => m.id === reaction.messageId);
  if (msg) {
    // If removed by same user, clear
    if (reaction.action === 'removed' && reaction.userId === this.meId) msg.reaction = null;
    else msg.reaction = reaction.reactionType;
  }
});

  }

  loadConversation() {
   this.chat.getConversation(this.otherId).subscribe(res => {
  // Map messages and take first reaction (single reaction per message)
  this.messages = (res.messages || []).map((m:any) => ({
    ...m,
    reaction: m.reactions?.[0]?.reaction || null, // take first reaction from backend
    showReactions: false
  }));

  const unseen = this.messages.filter(m => !m.seen && m.receiverId === this.meId);
  unseen.forEach(m => this.chat.emitSeen(m.id, m.senderId));
  if (unseen.length) this.chat.markSeen(this.otherId).subscribe();
  setTimeout(() => this.scrollToBottom(), 50);
});

  }

  send() {
    if (!this.text.trim()) return;

    if (this.editingMessageId) {
      this.chat.sendSocketEdit(this.editingMessageId, this.text);
      const idx = this.messages.findIndex(m => m.id === this.editingMessageId);
      if (idx !== -1) this.messages[idx].content = this.text;
      this.editingMessageId = null;
    } else {
      const replyToId = this.replyingTo?.id || null;
      this.chat.sendSocketMessage(this.otherId, this.text, replyToId);
    }

    this.text = '';
    this.replyingTo = null;
    setTimeout(() => this.scrollToBottom(), 50);
  }

  editMessage(msg: any) {
    if (msg.deleted) return;
    this.editingMessageId = msg.id;
    this.text = msg.content;
  }

  replyMessage(msg: any) {
    if (msg.deleted) return;
    this.replyingTo = msg;
  }

  cancelReply() {
    this.replyingTo = null;
  }

  deleteMessage(msg: any) {
    if (msg.deleted) return;
    if (!confirm('Are you sure you want to delete this message?')) return;
    this.chat.sendSocketDelete(msg.id);
  }

  getRepliedMessage(replyToId: string) {
    const msg = this.messages.find(m => m.id === replyToId);
    if (msg) return msg.deleted ? { content: 'Replied message was deleted' } : msg;
    return { content: 'Replied message not found' };
  }

  scrollToBottom() {
    const container = document.querySelector('.messages');
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }
reactToMessage(msg: any, emoji: string) {
  // Update locally
  msg.reaction = msg.reaction === emoji ? null : emoji;
  msg.showReactions = false;

  // Emit to server
  this.chat.reactToMessage(msg.id, emoji);
}

  ngOnDestroy() {
    this.chat.disconnect();
  }
}
