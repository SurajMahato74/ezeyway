import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/utils/apiUtils';
import { authService } from '@/services/authService';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function FloatingChat() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const [isOpen, setIsOpen] = useState(false);
   const [messages, setMessages] = useState([]);
   const [newMessage, setNewMessage] = useState('');
   const [loading, setLoading] = useState(false);
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const [conversationId, setConversationId] = useState(null);
   const [currentUserId, setCurrentUserId] = useState(null);
   const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkAuth();
    
    // Check for support message in URL params
    const supportMessage = searchParams.get('support_message');
    if (supportMessage) {
      setNewMessage(decodeURIComponent(supportMessage));
      setIsOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadMessages();
    }
  }, [isOpen, isAuthenticated]);

  const checkAuth = async () => {
    const auth = await authService.isAuthenticated();
    setIsAuthenticated(auth);

    // Get current user info
    if (auth) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const { response, data } = await apiRequest('/profile/');
          if (response.ok && data) {
            setCurrentUserId(data.id);
          }
        }
      } catch (error) {
        console.error('Failed to get user profile:', error);
      }
    }
  };

  const loadMessages = async () => {
    try {
      const { response, data } = await apiRequest('/messaging/conversations/');
      if (response.ok && data?.results) {
        // Find conversation with ezeywaya admin user
        const superuserConversation = data.results.find(conv =>
          conv.participants?.some(p => p.username === 'ezeywaya' || p.email === 'ezeywaya@gmail.com')
        );
        
        if (superuserConversation) {
          setConversationId(superuserConversation.id);
          const { response: msgResponse, data: msgData } = await apiRequest(`/messaging/conversations/${superuserConversation.id}/messages/`);
          if (msgResponse.ok && msgData?.results) {
            setMessages(msgData.results.reverse()); // Reverse to show latest at bottom
          }
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
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
      const currentUser = { id: 'current_user', user_type: 'customer' }; // Mock current user for immediate display
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: newMessage.trim(),
        sender: currentUser,
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

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-24 right-4 z-50">
        <Button
          onClick={() => {
            if (!isAuthenticated) {
              navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
              return;
            }
            setIsOpen(!isOpen);
          }}
          className="w-10 h-10 rounded-full bg-yellow-500 hover:bg-yellow-600 shadow-lg border-2 border-black"
        >
          {isOpen ? <X className="h-4 w-4 text-black" /> : <MessageCircle className="h-4 w-4 text-black" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-32 right-4 w-72 h-[500px] bg-white rounded-lg shadow-xl border-2 border-black z-50 flex flex-col">
          {/* Header */}
          <div className="bg-yellow-500 text-black p-3 rounded-t-lg border-2 border-black border-b-0">
            <h3 className="font-semibold">Chat with Support</h3>
            <p className="text-xs opacity-75">EzeyWay Customer Service</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!isAuthenticated ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="mb-4">Sign in to chat with support</p>
                <Button 
                  size="sm" 
                  className="bg-yellow-500 hover:bg-yellow-600 text-black border border-black"
                  onClick={() => navigate('/login?redirect=' + encodeURIComponent(window.location.pathname))}
                >
                  Sign In
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start a conversation with our support team</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.sender?.id === currentUserId || message.sender?.id === 'current_user';
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm border ${
                        isCurrentUser
                          ? 'bg-yellow-500 text-black border-black'
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      {message.content || message.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {isAuthenticated && (
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-[85%] resize-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent h-[100px] overflow-y-auto"
                  disabled={loading}
                  rows={5}
                />
                <div className="flex flex-col gap-1 w-[15%]">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    id="chat-file-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('chat-file-upload').click()}
                    className="w-full h-8 p-0 text-base"
                  >
                    📎
                  </Button>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || loading}
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black border border-black w-full h-8 p-0"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}