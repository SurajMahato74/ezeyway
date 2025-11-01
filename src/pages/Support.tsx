import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/utils/apiUtils';
import { authService } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation } from '@/components/BottomNavigation';

export default function Support() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadMessages();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const auth = await authService.isAuthenticated();
    setIsAuthenticated(auth);
  };

  const loadMessages = async () => {
    try {
      setLoadingMessages(true);
      const { response, data } = await apiRequest('/messaging/conversations/');
      if (response.ok && data?.results) {
        console.log('Conversations data:', data);
        // Find conversation with superuser/admin - look for ezeywaya user
        const superuserConversation = data.results.find(conv =>
          conv.participants?.some(p => p.username === 'ezeywaya' || p.email === 'ezeywaya@gmail.com')
        );

        console.log('Looking for ezeywaya conversation:', superuserConversation);
        console.log('All conversations:', data.results.map(c => ({
          id: c.id,
          participants: c.participants?.map(p => ({ username: p.username, email: p.email, user_type: p.user_type }))
        })));

        console.log('Superuser conversation found:', superuserConversation);

        if (superuserConversation) {
          setConversationId(superuserConversation.id);
          const { response: msgResponse, data: msgData } = await apiRequest(`/messaging/conversations/${superuserConversation.id}/messages/`);
          console.log('Messages response:', msgResponse, msgData);
          if (msgResponse.ok && msgData?.results) {
            // Show all messages in the admin conversation
            console.log('All messages in admin conversation:', msgData.results);
            setMessages(msgData.results.reverse()); // Reverse to show latest at bottom
          }
        } else {
          console.log('No superuser conversation found');
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!isAuthenticated) {
      navigate('/login?redirect=/support');
      return;
    }

    setLoading(true);
    try {
      let targetConversationId = conversationId;

      // If no conversation exists, create one
      if (!targetConversationId) {
        const { response: createResponse, data: createData } = await apiRequest('/messaging/conversations/create/', {
          method: 'POST',
          body: JSON.stringify({
            message: newMessage.trim()
          })
        });

        if (createResponse.ok && createData) {
          targetConversationId = createData.conversation_id;
          setConversationId(targetConversationId);
        }
      } else {
        // Send message to existing conversation using the send message API
        await apiRequest('/messaging/messages/send/', {
          method: 'POST',
          body: JSON.stringify({
            conversation_id: targetConversationId,
            content: newMessage.trim(),
            message_type: 'text'
          })
        });
      }

      // Add message to UI immediately
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: newMessage.trim(),
        sender: { user_type: 'customer' },
        created_at: new Date().toISOString()
      }]);
      setNewMessage('');

      // Refresh messages after a short delay
      setTimeout(() => loadMessages(), 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center justify-between p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">Customer Support</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground mb-4">
                Please sign in to access customer support
              </p>
              <Button
                onClick={() => navigate('/login?redirect=/support')}
                className="w-full"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Customer Support</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMessages ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Welcome to Support</h3>
              <p className="text-muted-foreground">
                Send us a message and we'll get back to you as soon as possible.
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showDate = index === 0 || formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-start mb-2">
                    <div className="flex items-start gap-2 max-w-xs">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="rounded-lg px-3 py-2 bg-primary text-primary-foreground">
                        <p className="text-sm">{message.content || message.message}</p>
                        <p className="text-xs mt-1 text-primary-foreground/70">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t bg-card p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || loading}
              className="px-4"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}