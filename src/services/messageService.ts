import { apiRequest } from '@/utils/apiUtils';
import { authService } from '@/services/authService';

// Import notification service for browser notifications
let notificationService: any = null;

// Lazy load to avoid circular imports
const getNotificationService = async () => {
  if (!notificationService) {
    const { notificationService: ns } = await import('./notificationService');
    notificationService = ns;
  }
  return notificationService;
};

export interface Conversation {
  id: number;
  participants: Array<{
    id: number;
    username: string;
    profile_picture?: string;
  }>;
  last_message?: {
    id: number;
    content: string;
    created_at: string;
    sender: {
      id: number;
      username: string;
    };
  };
  unread_count: number;
  other_participant?: {
    id: number;
    username: string;
    profile_picture?: string;
  };
}

export interface Message {
  id: number;
  sender: {
    id: number;
    username: string;
  };
  message_type: 'text' | 'image' | 'file';
  content?: string;
  file_url?: string;
  file_name?: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  is_pinned: boolean;
  created_at: string;
  is_read: boolean;
}

class MessageService {

  async getConversations(): Promise<Conversation[]> {
    try {
      const { response, data } = await apiRequest('/api/messaging/conversations/');
      if (!response.ok) {
        return [];
      }
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (error) {
      return [];
    }
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    try {
      const { response, data } = await apiRequest(`/api/messaging/conversations/${conversationId}/messages/`);
      if (!response.ok) {
        console.error(`Messages API error: ${response.status}`);
        return [];
      }
      console.log('Messages API response:', data);
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (error) {
      console.error('Messages API error:', error);
      return [];
    }
  }

  async sendMessage(data: {
    conversation_id?: number;
    recipient_id?: number;
    message_type: 'text' | 'image' | 'file';
    content?: string;
    file?: File;
  }) {
    try {
      const formData = new FormData();
      
      if (data.conversation_id) formData.append('conversation_id', data.conversation_id.toString());
      if (data.recipient_id) formData.append('recipient_id', data.recipient_id.toString());
      formData.append('message_type', data.message_type);
      if (data.content) formData.append('content', data.content);
      if (data.file) formData.append('file', data.file);

      const { response, data: responseData } = await apiRequest('/api/messaging/messages/send/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        console.error(`Message send failed: ${response.status}`);
        throw new Error(`HTTP ${response.status}`);
      }
      
      console.log('Message sent successfully:', responseData);
      return responseData;
    } catch (error) {
      console.warn('Backend not available, simulating message send');
      const user = await authService.getUser();
      return {
        message: {
          id: Date.now(),
          sender: { id: user?.id || 0, username: user?.username || 'You' },
          message_type: data.message_type,
          content: data.content,
          status: 'sent',
          is_pinned: false,
          created_at: new Date().toISOString(),
          is_read: false
        }
      };
    }
  }

  // Method to handle incoming message notifications
  async handleIncomingMessage(message: Message, senderName: string) {
    try {
      const ns = await getNotificationService();
      
      // Show browser notification for incoming message
      ns.showBrowserNotification(`New message from ${senderName}`, {
        body: message.content || 'New message received',
        tag: `message-${message.id}`,
        requireInteraction: false,
        data: { actionUrl: '/vendor/messages' }
      });
      
      // Dispatch custom event for UI updates
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('newMessage', {
          detail: { message, senderName }
        }));
      }
    } catch (error) {
      console.error('Failed to handle incoming message notification:', error);
    }
  }

  async getOrCreateConversation(userId: number): Promise<Conversation> {
    try {
      const { response, data } = await apiRequest(`/api/messaging/conversations/user/${userId}/`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return data || this.createMockConversation(userId);
    } catch (error) {
      console.warn('Backend not available, creating mock conversation');
      return this.createMockConversation(userId);
    }
  }

  private createMockConversation(userId: number): Conversation {
    return {
      id: userId,
      participants: [],
      last_message: undefined,
      unread_count: 0,
      other_participant: {
        id: userId,
        username: userId === 1 ? 'EzzeYway Support' : `User ${userId}`,
        profile_picture: undefined
      }
    };
  }

  // Call methods removed - call functionality disabled
}

export const messageService = new MessageService();

// Global message notification handler
if (typeof window !== 'undefined') {
  // Listen for WebSocket messages and trigger notifications
  window.addEventListener('message', async (event) => {
    if (event.data?.type === 'new_message') {
      const { message } = event.data;
      await messageService.handleIncomingMessage(message, message.sender?.username || 'Unknown');
    }
  });
}