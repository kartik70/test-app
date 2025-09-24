export type MsgType = 'text' | 'image' | 'video' | 'file' | 'buttons' | 'typing' | 'template';

export interface QuickButton {
  label: string;
  action?: string;
}

export interface ChatMessage {
  id?: string;               // client or server id
  clientId?: string;         // optional client-generated id for dedupe
  sender: string;            // e.g. username or userId
  type: MsgType;
  content?: string;          // text content
  mediaUrl?: string;         // image/video/file url or dataURL (demo)
  fileName?: string;         // optional for files
  buttons?: QuickButton[];   // for quick replies / structured messages
  timestamp?: string;        // ISO or formatted time
  status?: 'pending'|'sent'|'delivered'|'read'; // outgoing status
  // template specific fields (header/body/footer)
  headerText?: string;
  bodyText?: string;
  footerText?: string;
}
