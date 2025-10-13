import { useEffect, useRef, useState } from 'react';
import { getWsUrl } from '@/config/api';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export const useWebSocket = (url: string, onMessage?: (message: WebSocketMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = getWsUrl(url);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.current.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle message notifications
        if (message.type === 'new_message') {
          const { notificationService } = await import('@/services/notificationService');
          
          notificationService.showBrowserNotification(
            `New message from ${message.message?.sender_name || 'Unknown'}`,
            {
              body: message.message?.content || 'New message received',
              tag: `message-${message.message?.id}`,
              requireInteraction: false,
              data: { actionUrl: '/vendor/messages' }
            }
          );
        }
        
        onMessage?.(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.current?.close();
    };
  }, [url, onMessage]);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, sendMessage };
};