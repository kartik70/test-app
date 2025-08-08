import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { StompService } from '../services/stomp.service';
import { ChatMessage, QuickButton } from '../models/chat-message';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule,CommonModule] 
})
export class ChatComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private stomp = inject(StompService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('scrollContainer', { static: true }) private scrollContainer!: ElementRef<HTMLElement>;

  me = 'Kartik';
  newMessage = '';
  messages: ChatMessage[] = [];

  constructor() {}

  ngOnInit(): void {
    // connect (optionally pass custom URL)
    /* this.stomp.connect(); */ // uses token WS_ENDPOINT if provided

    // subscribe to incoming messages
    this.stomp.incoming$
      .pipe(takeUntil(this.destroy$))
      .subscribe((msg) => this.onIncoming(msg));

    // demo seed messages (optional)
    this.seedDemoMessages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stomp.disconnect();
  }

  private seedDemoMessages() {
    this.messages = [
      { id: this.generateId(), sender: 'Friend', type: 'text', content: 'Hey! Are you free today?', timestamp: this.now() },
      { id: this.generateId(), sender: this.me, type: 'text', content: 'Yes — free after 7 PM.', timestamp: this.now(), status: 'read' },
      { id: this.generateId(), sender: 'Friend', type: 'image', mediaUrl: 'https://picsum.photos/300/200', timestamp: this.now() },
      { id: this.generateId(), sender: 'Friend', type: 'buttons', buttons: [{ label: 'Sounds good', action: 'ok' }, { label: 'Not today', action: 'no' }], timestamp: this.now() }
    ];
    this.cdr.markForCheck();
    setTimeout(() => this.scrollToBottom(), 60);
  }

  private onIncoming(msg: ChatMessage) {
    // dedupe if clientId present
    if (msg.clientId) {
      const idx = this.messages.findIndex(m => m.clientId === msg.clientId);
      if (idx > -1) {
        this.messages[idx] = { ...this.messages[idx], ...msg };
        this.cdr.markForCheck();
        this.scrollToBottom();
        return;
      }
    }

    // normal push
    this.messages.push(msg);
    this.cdr.markForCheck();
    this.scrollToBottom();
  }

  sendText() {
    const text = (this.newMessage || '').trim();
    if (!text) return;

    const clientId = this.generateId();
    const msg: ChatMessage = {
      clientId,
      sender: this.me,
      type: 'text',
      content: text,
      timestamp: this.now(),
      status: 'pending'
    };

    // push locally
    this.messages.push(msg);
    this.cdr.markForCheck();
    this.scrollToBottom();
    this.newMessage = '';

    // send via stomp (server expected to echo back to topic)
    // destination defined in StompService tokens or default /app/chat
    this.stomp.send(undefined, msg);
  }

  handleButtonClick(btn: QuickButton) {
    // For simplicity, send the label as a message
    this.newMessage = btn.label;
    this.sendText();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;

      let type: ChatMessage['type'] = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';

      const clientId = this.generateId();
      const msg: ChatMessage = {
        clientId,
        sender: this.me,
        type,
        mediaUrl: dataUrl,
        fileName: file.name,
        timestamp: this.now(),
        status: 'pending'
      };

      this.messages.push(msg);
      this.cdr.markForCheck();
      this.scrollToBottom();

      // send the file payload to backend (in prod upload and send URL)
      this.stomp.send(undefined, msg);

      // reset input
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  // trackBy for ngFor performance
  trackById(_: number, item: ChatMessage) {
    return item.id ?? item.clientId ?? item.timestamp ?? _;
  }

  private scrollToBottom() {
    try {
      const el = this.scrollContainer.nativeElement;
      setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
    } catch {}
  }

  private now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}
