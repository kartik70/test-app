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
      .subscribe((msg: any) => this.onIncoming(this.transformIncoming(msg)));

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
      {
        id: this.generateId(),
        sender: 'Friend',
        type: 'template',
        headerText: 'Hi {{name}}',
        bodyText: 'Thanks for showing interest in our internet broadband! How can we help?',
        footerText: 'hihihih',
        buttons: [
          { label: 'Check Availability', action: 'CHECK' },
          { label: 'Plans & Pricing', action: 'PLANS' },
          { label: 'Talk to Expert', action: 'EXPERT' }
        ],
        timestamp: this.now()
      }
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

  // Map incoming API payloads into ChatMessage, supporting template payload shown by user
  private transformIncoming(raw: any): ChatMessage {
    try {
      // Detect template-like payload
      if (raw && typeof raw === 'object' && raw.header && raw.body && raw.footer) {
        const buttons: QuickButton[] = [];
        for (let i = 1; i <= 3; i++) {
          const key = `button_${i}`;
          const b = (raw as any)[key];
          if (b && b.type === 'button' && typeof b.stringContent === 'string' && b.stringContent.trim()) {
            buttons.push({ label: b.stringContent.trim(), action: b.buttonSubType });
          }
        }

        const msg: ChatMessage = {
          id: this.generateId(),
          sender: 'Friend',
          type: 'template',
          headerText: raw.header?.stringContent ?? '',
          bodyText: raw.body?.stringContent ?? '',
          footerText: raw.footer?.stringContent ?? '',
          buttons,
          timestamp: this.now()
        };
        return msg;
      }

      // If it already matches our contract, let it pass through
      if (raw && raw.type) return raw as ChatMessage;

      // Fallbacks
      if (typeof raw === 'string') {
        return { id: this.generateId(), sender: 'Friend', type: 'text', content: raw, timestamp: this.now() };
      }
    } catch {}

    // Unknown payload → show as textified JSON for debugging
    return { id: this.generateId(), sender: 'Friend', type: 'text', content: JSON.stringify(raw), timestamp: this.now() };
  }

  handleButtonClick(btn: QuickButton) {
    // For simplicity, send the label as a message
    this.newMessage = btn.label;
    this.sendText();
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
