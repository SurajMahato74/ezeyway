export interface Message {
  id: number;
  content: string;
  created_at: string;
  sender: {
    id: number;
    username: string;
  };
  message_type: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
  is_read: boolean;
}

export interface Conversation {
  id: number;
  participants: Array<{
    id: number;
    username: string;
    profile_picture?: string;
  }>;
  last_message?: Message;
  unread_count: number;
  other_participant?: {
    id: number;
    username: string;
    profile_picture?: string;
  };
}

export interface MessageService {
  getMessages(conversationId: number): Promise<Message[]>;
  sendMessage(data: {
    conversation_id: number;
    message_type: 'text' | 'image' | 'file';
    content?: string;
    file?: File;
  }): Promise<{ message: Message }>;
  getOrCreateConversation(userId: number): Promise<Conversation>;
}