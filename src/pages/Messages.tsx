import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Paperclip, ArrowLeft, ArrowLeftIcon, RefreshCw, Phone, Video } from "lucide-react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { messageService, type Conversation, type Message } from '@/services/messageService';
import { authService } from '@/services/authService';
import { apiRequest } from '@/utils/apiUtils';
import { getImageUrl } from '@/utils/imageUtils';
import { notificationService } from '@/services/notificationService';
import { API_CONFIG } from '@/config/api';
import CallInterface from '@/components/CallInterface';

// Define an interface for the CallInterface component methods
interface CallInterfaceRef {
  initiateCall: (userId: number, callType: 'audio' | 'video') => void;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorParam = searchParams.get('vendor');
  const conversationParam = searchParams.get('conversation');
  
  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = await authService.getToken();
      if (!token) {
        const currentUrl = window.location.pathname + window.location.search;
        navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      }
    };
    checkAuth();
  }, [navigate]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationsPage, setConversationsPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [callInProgress, setCallInProgress] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'answered' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Call interface ref for direct access
  const callInterfaceRef = useRef<any>(null);
  
  // Disable WebSocket for now to prevent connection errors
  const sendWSMessage = () => {};



  useEffect(() => {
    const initializeMessages = async () => {
      await fetchCurrentUser();
      await loadConversations();
      notificationService.initialize();
      
      // If vendor parameter exists, create/open conversation with that vendor
      if (vendorParam) {
        handleVendorMessage(parseInt(vendorParam));
      }
      
      // If conversation parameter exists, open that specific conversation
      if (conversationParam) {
        handleConversationOpen(parseInt(conversationParam));
      }
    };
    
    initializeMessages();
    
    // Listen for messages from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'newMessage' && e.newValue) {
        const messageData = JSON.parse(e.newValue);
        if (messageData.sender !== currentUser?.username) {
          notificationService.notifyNewMessage(
            messageData.sender,
            messageData.content,
            messageData.conversationId.toString(),
            'customer'
          );
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [vendorParam, conversationParam]); // Removed currentUser dependency to prevent re-runs

  const fetchCurrentUser = async () => {
    try {
      const token = await authService.getToken();
      if (!token) return;
      
      setAuthToken(token);
      const { response, data } = await apiRequest('/profile/');
      
      if (response.ok && data) {
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Auto-refresh messages every 5 seconds when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const refreshMessages = async () => {
      try {
        const data = await messageService.getMessages(selectedConversation.id);
        let messageArray = [];
        if (Array.isArray(data)) {
          messageArray = data.reverse();
        } else if (data?.results && Array.isArray(data.results)) {
          messageArray = data.results.reverse();
        }

        // Only update if we have new messages
        if (messageArray.length !== lastMessageCount) {
          setMessages(messageArray);
          setLastMessageCount(messageArray.length);
        }
      } catch (error) {
        console.error('Failed to refresh messages:', error);
      }
    };

    // Initial load
    refreshMessages();

    // Set up interval for auto-refresh
    const interval = setInterval(refreshMessages, 5000); // Refresh every 5 seconds

    // Also refresh on visibility change
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        refreshMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedConversation, lastMessageCount]);



  const loadConversations = async (page = 1, append = false) => {
    try {
      const { response, data } = await apiRequest(`messaging/conversations/?page=${page}&page_size=20`);
      
      if (!response.ok) throw new Error('Failed to fetch conversations');
      
      let conversationList = data?.results || [];
      
      // Add superuser conversation only on first page
      if (page === 1) {
        const hasSuperuser = conversationList.some(conv => 
          conv.other_participant?.username === 'admin' || 
          conv.other_participant?.id === 1
        );
        
        if (!hasSuperuser) {
          const superuserConv = {
            id: 0,
            participants: [],
            last_message: null,
            unread_count: 0,
            other_participant: {
              id: 1,
              username: 'EzzeYway Support',
              profile_picture: null
            }
          };
          conversationList = [superuserConv, ...conversationList];
        }
      }
      
      if (append) {
        setConversations(prev => [...prev, ...conversationList]);
      } else {
        setConversations(conversationList);
      }
      
      setHasMoreConversations(!!data?.next);
      setConversationsPage(page);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      if (page === 1) {
        setConversations([{
          id: 0,
          participants: [],
          last_message: null,
          unread_count: 0,
          other_participant: {
            id: 1,
            username: 'EzzeYway Support',
            profile_picture: null
          }
        }]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreConversations = async () => {
    if (loadingMore || !hasMoreConversations) return;
    setLoadingMore(true);
    await loadConversations(conversationsPage + 1, true);
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const data = await messageService.getMessages(conversationId);
      let messageArray = [];
      if (Array.isArray(data)) {
        messageArray = data.reverse();
      } else if (data?.results && Array.isArray(data.results)) {
        messageArray = data.results.reverse();
      }
      setMessages(messageArray);
      setLastMessageCount(messageArray.length);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
      setLastMessageCount(0);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      const result = await messageService.sendMessage({
        conversation_id: selectedConversation.id,
        message_type: 'text',
        content: messageText,
      });
      
      setMessages(prev => [...prev, result.message]);
      
      // Always broadcast message (even if simulated)
      const messageData = {
        conversationId: selectedConversation.id,
        sender: currentUser?.username || 'Unknown',
        content: messageText,
        timestamp: new Date().toISOString()
      };
      
      // Use localStorage for same-domain tabs
      localStorage.setItem('newMessage', JSON.stringify(messageData));
      setTimeout(() => localStorage.removeItem('newMessage'), 100);
      
      // Also broadcast via API for cross-domain
      try {
        const broadcastUrl = `${API_CONFIG.BASE_URL}/broadcast/`;
        await fetch(broadcastUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender: currentUser?.username || 'Unknown',
            content: messageText,
            conversation_id: selectedConversation.id
          })
        });
      } catch (e) {
        console.log('Cross-domain broadcast failed:', e);
      }
      
      setMessageText('');
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;

    try {
      const result = await messageService.sendMessage({
        conversation_id: selectedConversation.id,
        message_type: file.type.startsWith('image/') ? 'image' : 'file',
        file,
      });
      
      setMessages(prev => [...prev, result.message]);
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  };

  const handleVendorMessage = async (vendorId: number) => {
    try {
      const conversation = await messageService.getOrCreateConversation(vendorId);
      setSelectedConversation(conversation);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  // Start call timer
  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Stop call timer
  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // End current call
  const endCurrentCall = () => {
    setCallInProgress(false);
    setCallStatus('ended');
    stopCallTimer();
    setCallDuration(0);
  };

  // Call functions with direct integration
  const initiateCall = async (userId: number, callType: 'audio' | 'video') => {
    console.log('🎯 Initiating call to user:', userId, 'type:', callType);
    
    if (!authToken) {
      console.error('❌ No auth token available for call');
      alert('Please login to make calls');
      return;
    }

    try {
      setCallInProgress(true);
      setCallType(callType);
      setCallStatus('connecting');

      // Use fetch API to initiate call - fix the path to include messaging/
      const response = await fetch(`${API_CONFIG.BASE_URL}/messaging/calls/initiate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify({
          recipient_id: userId,
          call_type: callType,
        }),
      });

      if (response.ok) {
        console.log('✅ Call initiated successfully');
        const responseData = await response.json();
        console.log('📞 Call response:', responseData);
        
        // Update status to ringing
        setCallStatus('ringing');
        
        // Auto end call after 30 seconds if not answered (simulation)
        setTimeout(() => {
          if (callInProgress && callStatus === 'ringing') {
            console.log('🔔 Call timed out');
            endCurrentCall();
            alert('Call was not answered');
          }
        }, 30000);
        
      } else {
        const errorData = await response.json();
        console.error('❌ Call initiation failed:', errorData);
        alert(`Failed to start call: ${errorData.error || 'Unknown error'}`);
        endCurrentCall();
      }
    } catch (error) {
      console.error('❌ Call initiation error:', error);
      alert('Failed to start call. Please try again.');
      endCurrentCall();
    }
  };

  const handleAudioCall = async () => {
    console.log('🔊 Audio call button clicked');
    if (selectedConversation?.other_participant?.id) {
      console.log('📞 Starting audio call to:', selectedConversation.other_participant.id);
      setTargetUserId(selectedConversation.other_participant.id);
      await initiateCall(selectedConversation.other_participant.id, 'audio');
    } else {
      console.error('❌ No user ID found for audio call');
    }
  };

  const handleVideoCall = async () => {
    console.log('📹 Video call button clicked');
    if (selectedConversation?.other_participant?.id) {
      console.log('📞 Starting video call to:', selectedConversation.other_participant.id);
      setTargetUserId(selectedConversation.other_participant.id);
      await initiateCall(selectedConversation.other_participant.id, 'video');
    } else {
      console.error('❌ No user ID found for video call');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, []);

  const handleCallEnd = () => {
    setShowCallInterface(false);
    setTargetUserId(null);
  };

  const handleConversationOpen = async (conversationId: number) => {
    try {
      // Wait for conversations to load first
      await new Promise(resolve => {
        const checkConversations = () => {
          if (conversations.length > 0 || !loading) {
            resolve(true);
          } else {
            setTimeout(checkConversations, 100);
          }
        };
        checkConversations();
      });
      
      // Find the conversation in the loaded conversations
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    } catch (error) {
      console.error('Failed to open conversation:', error);
    }
  };



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col">

        
        {/* Chat Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => {
            setSelectedConversation(null);
            // Clear the conversation parameter from URL
            navigate('/messages', { replace: true });
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={getImageUrl(selectedConversation.other_participant?.profile_picture)} />
            <AvatarFallback>{selectedConversation.other_participant?.username?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{selectedConversation.other_participant?.username}</h3>
            <p className="text-xs text-gray-500">Online</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleAudioCall}
              className="p-2"
              title="Voice Call"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleVideoCall}
              className="p-2"
              title="Video Call"
            >
              <Video className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => loadMessages(selectedConversation.id)}
              className="p-2"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            const isCurrentUser = currentUser && message.sender.id === currentUser.id;
            return (
              <div
                key={message.id}
                className={`w-full flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                    isCurrentUser
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {message.message_type === 'text' && (
                    <p className="text-sm">{message.content}</p>
                  )}
                  
                  {message.message_type === 'image' && (
                    <div className="space-y-2">
                      <img
                        src={getImageUrl(message.file_url)}
                        alt="Shared image"
                        className="rounded max-w-full h-auto"
                      />
                    </div>
                  )}
                  
                  {message.message_type === 'file' && (
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm">{message.file_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end mt-1 gap-1">
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isCurrentUser && (
                      <span className={`text-xs ${
                        message.is_read ? 'text-blue-500' : 'text-gray-400'
                      }`}>
                        {message.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t p-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col relative">
      {/* Call Interface Overlay */}
      {callInProgress && (
        <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
          {/* Call Header */}
          <div className="bg-gray-800 p-6 text-center text-white">
            <div className="text-4xl mb-4">
              {callType === 'video' ? '📹' : '📞'}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {selectedConversation?.other_participant?.username || 'Unknown User'}
            </h3>
            <p className="text-gray-300">
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'ringing' && 'Ringing...'}
              {callStatus === 'answered' && 'Call in progress'}
              {callStatus === 'ended' && 'Call ended'}
            </p>
            {callStatus === 'answered' && (
              <p className="text-sm text-gray-400 mt-2">
                {formatDuration(callDuration)}
              </p>
            )}
          </div>

          {/* Call Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-48 h-48 bg-gray-700 rounded-full mx-auto mb-8 flex items-center justify-center">
                <span className="text-8xl">
                  {callType === 'video' ? '📹' : '📞'}
                </span>
              </div>
              <div className="space-y-4">
                <div className="text-lg">
                  {selectedConversation?.other_participant?.username}
                </div>
                <div className="flex justify-center space-x-8">
                  {/* Mute Button */}
                  <button className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500">
                    🎤
                  </button>
                  
                  {/* Speaker Button */}
                  <button className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500">
                    🔊
                  </button>
                  
                  {/* End Call Button */}
                  <button
                    onClick={endCurrentCall}
                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  >
                    📞
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">Messages</h2>
          </div>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Start messaging with vendors!</p>
          </div>
        ) : (
          conversations.map((conversation, index) => (
            <div
              key={conversation.id}
              className="flex items-center gap-3 p-4 border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                if (conversation.id === 0) {
                  // Handle superuser conversation
                  handleVendorMessage(1);
                } else {
                  setSelectedConversation(conversation);
                }
              }}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getImageUrl(conversation.other_participant?.profile_picture)} />
                  <AvatarFallback>{conversation.other_participant?.username?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm truncate">{conversation.other_participant?.username}</h3>
                  <span className="text-xs text-gray-500">
                    {conversation.last_message ? new Date(conversation.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {conversation.last_message?.content || conversation.last_message?.file_name || 'Start conversation'}
                </p>
              </div>
              {conversation.unread_count > 0 && (
                <Badge className="bg-blue-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                  {conversation.unread_count}
                </Badge>
              )}
            </div>
          ))
        )}
        {hasMoreConversations && (
          <div className="p-4 text-center">
            <Button 
              onClick={loadMoreConversations} 
              disabled={loadingMore}
              variant="outline"
              className="w-full"
            >
              {loadingMore ? 'Loading...' : 'Load More Conversations'}
            </Button>
          </div>
        )}
      </div>

      {/* Call Interface */}
      {authToken && currentUser && (
        <CallInterface
          authToken={authToken}
          userId={currentUser.id}
          onCallEnd={handleCallEnd}
        />
      )}
    </div>
  );
};

export default Messages;