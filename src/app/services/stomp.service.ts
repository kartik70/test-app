import { inject, Injectable, Optional } from '@angular/core';
import { Client, Frame, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { ChatMessage } from '../models/chat-message';
import { WS_ENDPOINT, APP_DESTINATION, TOPIC_SUBSCRIBE } from '../models/tokens';

@Injectable({
    providedIn: 'root'
})
export class StompService {
    private client?: Client;
    private sub?: StompSubscription;
    private incomingSubject = new Subject<ChatMessage>();
    incoming$ = this.incomingSubject.asObservable();

    // optionals via DI, but component can pass custom url to connect()
    private wsEndpoint = inject(WS_ENDPOINT, { optional: true });
    private dest = inject(APP_DESTINATION, { optional: true }) ?? '/app/chat';
    private topic = inject(TOPIC_SUBSCRIBE, { optional: true }) ?? '/topic/messages';

    connect(url?: string): void {
        const wsUrl = url ?? this.wsEndpoint ?? '/ws';

        // prevent double connect
        if (this.client && this.client.active) return;

        this.client = new Client({
            // use SockJS to enable spring sockjs endpoint compatibility
            webSocketFactory: () => new SockJS(wsUrl),
            reconnectDelay: 5000,
            debug: (msg) => {
                // comment out or route to logger
                // console.debug('[STOMP]', msg);
            }
        });

        this.client.onConnect = (frame: Frame) => {
            // subscribe to topic
            this.sub = this.client!.subscribe(this.topic!, (message: IMessage) => {
                if (message.body) {
                    try {
                        const payload: ChatMessage = JSON.parse(message.body);
                        this.incomingSubject.next(payload);
                    } catch (e) {
                        console.error('STOMP: invalid JSON payload', e);
                    }
                }
            });
        };

        this.client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Detailed error: ' + frame.body);
        };

        this.client.activate();
    }

    disconnect(): void {
        try {
            this.sub?.unsubscribe();
            this.client?.deactivate();
        } catch (e) { /* ignore */ }
    }

    // Publish to destination (e.g. /app/chat)
    send(destination?: string, payload?: any): void {
        if (!this.client) {
            console.warn('STOMP client not initialized. Call connect() first.');
            return;
        }
        const dest = destination ?? this.dest;
        try {
            this.client.publish({ destination: dest!, body: JSON.stringify(payload) });
        } catch (e) {
            console.error('STOMP send failed', e);
        }
    }
}
