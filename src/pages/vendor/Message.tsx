import React, { useState, useRef, useEffect } from 'react';
import { VendorPage } from "@/components/VendorLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Paperclip, FileText, MoreVertical, ArrowLeft } from "lucide-react";
import { messageService, type Conversation, type Message } from '@/services/messageService';
import { apiRequest } from '@/utils/apiUtils';
import { getImageUrl } from '@/utils/imageUtils';

const Message: React.FC = () => {
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
  
  // Disable WebSocket for now
  const sendWSMessage = () => {};

  useEffect(() => {
    fetchCurrentUser();
    loadConversations();
    
    // Check for URL parameters to start a conversation
    const urlParams = new URLSearchParams(window.location.search);
    const startConversationId = urlParams.get('start_conversation');
    
    if (startConversationId) {
      setTimeout(() => {
        handleVendorMessage(parseInt(startConversationId));
      }, 500);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
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

  // Poll for new messages only when conversation is active
  useEffect(() => {
    if (selectedConversation) {
      const interval = setInterval(async () => {
        try {
          const newMessages = await messageService.getMessages(selectedConversation.id);
          const messageArray = Array.isArray(newMessages) ? newMessages.reverse() : [];
          setMessages(messageArray);
          setLastMessageCount(messageArray.length);
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      }, 5000); // Reduced frequency
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadConversations = async (page = 1, append = false) => {
    try {
      const { response, data } = await apiRequest(`messaging/conversations/?page=${page}&page_size=20`);
      
      if (!response.ok) throw new Error('Failed to fetch conversations');
      
      let conversationList = data?.results || [];
      
      // Remove duplicates based on other_participant id
      const uniqueConversations = conversationList.filter((conv, index, self) => 
        index === self.findIndex(c => c.other_participant?.id === conv.other_participant?.id)
      );
      
      // Add superuser conversation only on first page and if not already present
      if (page === 1) {
        const hasSuperuser = uniqueConversations.some(conv => 
          conv.other_participant?.username === 'admin' || 
          conv.other_participant?.id === 1 ||
          conv.other_participant?.username === 'EzzeYway Support'
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
          uniqueConversations.unshift(superuserConv);
        }
      }
      
      if (append) {
        setConversations(prev => {
          // Merge and remove duplicates when appending
          const combined = [...prev, ...uniqueConversations];
          return combined.filter((conv, index, self) => 
            index === self.findIndex(c => c.other_participant?.id === conv.other_participant?.id)
          );
        });
      } else {
        setConversations(uniqueConversations);
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
      const messageArray = Array.isArray(data) ? data.reverse() : [];
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

  const handleVendorMessage = async (userId: number) => {
    try {
      const conversation = await messageService.getOrCreateConversation(userId);
      setSelectedConversation(conversation);
      
      // Clear URL parameters after conversation is created
      const url = new URL(window.location.href);
      url.searchParams.delete('start_conversation');
      url.searchParams.delete('customer_name');
      url.searchParams.delete('order_id');
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.error('Failed to create conversation:', error);
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
      <VendorPage title="Messages">
        <div className="h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>Loading conversations...</p>
          </div>
        </div>
      </VendorPage>
    );
  }

  if (selectedConversation) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col">

        
        {/* Chat Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            {selectedConversation.other_participant?.username === 'EzzeYway Support' ? (
              <AvatarImage src="/logo.png" />
            ) : (
              <AvatarImage src={getImageUrl(selectedConversation.other_participant?.profile_picture)} />
            )}
            <AvatarFallback>{selectedConversation.other_participant?.username?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{selectedConversation.other_participant?.username}</h3>
            <p className="text-xs text-gray-500">Online</p>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
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
                      ? 'bg-green-500 text-white rounded-br-none'
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
                      <FileText className="h-4 w-4" />
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
    <VendorPage title="Messages">
      <div className="h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Messages</h2>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Customers will message you here!</p>
            </div>
          ) : (
            conversations.map((conversation) => (
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
                    {conversation.other_participant?.username === 'EzzeYway Support' ? (
                      <AvatarImage src="/logo.png" />
                    ) : (
                      <AvatarImage src={getImageUrl(conversation.other_participant?.profile_picture)} />
                    )}
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
                    {conversation.last_message?.content || 
                     (conversation.last_message?.file_name ? `📎 ${conversation.last_message.file_name}` : '') ||
                     (conversation.id === 0 ? 'Start conversation' : 'No messages yet')}
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
      </div>
    </VendorPage>
  );
};

export default Message;