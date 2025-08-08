import { InjectionToken } from '@angular/core';

export const WS_ENDPOINT = new InjectionToken<string>('WS_ENDPOINT'); // e.g. 'http://localhost:8080/ws'
export const APP_DESTINATION = new InjectionToken<string>('APP_DESTINATION'); // e.g. '/app/chat'
export const TOPIC_SUBSCRIBE = new InjectionToken<string>('TOPIC_SUBSCRIBE'); // e.g. '/topic/messages'
