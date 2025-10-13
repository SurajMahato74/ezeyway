import { useState, useEffect, ReactNode } from "react";
import { Bell, MessageCircle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { messageService } from "@/services/messageService";
import { notificationService, type Notification } from "@/services/notificationService";
import { apiRequest } from '@/utils/apiUtils';
import { authService } from '@/services/authService';
import { debugAuth } from '@/utils/authDebug';
import { createApiHeaders } from '@/utils/apiUtils';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const messageNotifications = [
  {
    id: 1,
    message: "New message from John Doe",
    time: "2 min ago",
    unread: true,
    sender: "John Doe"
  },
  {
    id: 2,
    message: "Jane Smith: Can you send me the invoice?",
    time: "1 hour ago",
    unread: true,
    sender: "Jane Smith"
  },
  {
    id: 3,
    message: "EzzeYway Support: Welcome to EzzeYway!",
    time: "Yesterday",
    unread: false,
    sender: "EzzeYway Support"
  },
];

interface VendorHeaderProps {
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
}

export function VendorHeader({ title, subtitle, headerActions }: VendorHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [profileId, setProfileId] = useState<number | null>(null);

  const unreadCount = notificationsList.filter(n => !n.read).length;
  const unreadMessagesCount = conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);

  // Disable WebSocket for now, use polling instead
  const isConnected = false;

  useEffect(() => {
    console.log('🚀 VendorHeader initializing...');
    
    fetchVendorStatus();
    requestNotificationPermission();
    loadConversations();
    loadNotifications();
    
    const conversationInterval = setInterval(loadConversations, 5000);
    const notificationInterval = setInterval(loadNotifications, 5000); // Check every 5 seconds for real-time feel
    
    // Listen for custom events
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      setNotificationsList(prev => [notification, ...prev]);
    };
    
    const handleOrderCreated = (event: CustomEvent) => {
      const { order } = event.detail;
      const notification: Notification = {
        id: Date.now(),
        type: 'order',
        title: 'New Order Received!',
        message: `Order #${order.order_number} for ₹${order.total_amount}`,
        data: { orderId: order.id },
        read: false,
        created_at: new Date().toISOString(),
        action_url: '/vendor/orders'
      };
      setNotificationsList(prev => [notification, ...prev]);
      
      // Show browser notification
      notificationService.showBrowserNotification(notification.title, {
        body: notification.message,
        tag: `order-${order.id}`,
        requireInteraction: true,
        data: { actionUrl: '/vendor/orders' }
      });
      
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    };
    
    window.addEventListener('newNotification', handleNewNotification as EventListener);
    window.addEventListener('orderCreated', handleOrderCreated as EventListener);
    
    return () => {
      clearInterval(conversationInterval);
      clearInterval(notificationInterval);
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
      window.removeEventListener('orderCreated', handleOrderCreated as EventListener);
    };
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations();
      const conversationList = Array.isArray(data) ? data : data?.results || [];
      
      // Deduplicate conversations by other_participant.id, keeping the latest one
      const uniqueConversations = conversationList.reduce((acc, conv) => {
        const participantId = conv.other_participant?.id;
        if (!participantId) return acc;
        
        const existing = acc.find(c => c.other_participant?.id === participantId);
        if (!existing) {
          acc.push(conv);
        } else {
          // Keep the one with the latest message
          const convTime = conv.last_message?.created_at || conv.updated_at;
          const existingTime = existing.last_message?.created_at || existing.updated_at;
          if (new Date(convTime) > new Date(existingTime)) {
            const index = acc.findIndex(c => c.other_participant?.id === participantId);
            acc[index] = conv;
          }
        }
        return acc;
      }, []);
      
      // Check for new messages and show notifications
      if (conversations.length > 0) {
        uniqueConversations.forEach(newConv => {
          const oldConv = conversations.find(c => c.other_participant?.id === newConv.other_participant?.id);
          if (oldConv && newConv.unread_count > oldConv.unread_count) {
            // Show browser notification
            notificationService.showBrowserNotification(
              `New message from ${newConv.other_participant?.username}`,
              {
                body: newConv.last_message?.content || 'New message received',
                tag: `message-${newConv.id}`,
                requireInteraction: false,
                data: { actionUrl: '/vendor/messages' }
              }
            );
          }
        });
      }
      
      setConversations(uniqueConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      // Don't clear auth for conversation loading errors
    }
  };

  const loadNotifications = async () => {
    try {
      const notifications = await notificationService.getNotifications();
      
      // Check for new notifications and show browser notifications
      if (notificationsList.length > 0) {
        notifications.forEach(newNotif => {
          const exists = notificationsList.find(n => n.id === newNotif.id);
          if (!exists && newNotif.type === 'order') {
            // Show browser notification for new orders
            notificationService.showBrowserNotification(newNotif.title, {
              body: newNotif.message,
              tag: `notification-${newNotif.id}`,
              requireInteraction: true,
              data: { actionUrl: '/vendor/orders' }
            });
            
            toast({
              title: newNotif.title,
              description: newNotif.message,
              duration: 5000,
            });
          }
        });
      }
      
      setNotificationsList(notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // Don't clear auth for notification loading errors
    }
  };



  const requestNotificationPermission = async () => {
    await notificationService.requestPermission();
  };

  const fetchVendorStatus = async () => {
    console.log('🔍 Fetching vendor status...');
    
    try {
      const isAuthenticated = await authService.isAuthenticated();
      console.log('🔐 Authentication check for fetch:', isAuthenticated);
      
      if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to login');
        navigate("/vendor/login");
        return;
      }

      const user = await authService.getUser();
      const { response, data } = await apiRequest('/vendor-profiles/');

      console.log('📥 Fetch vendor status response:', { 
        status: response.status, 
        statusText: response.statusText,
        data,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.status === 401 || response.status === 403) {
        console.log('🚫 Authentication error in fetch, clearing auth');
        await authService.clearAuth();
        navigate("/vendor/login");
        return;
      }

      if (response.status !== 200 && response.status !== 201) {
        console.log('⚠️ Unexpected status in fetch:', response.status);
        throw new Error(data?.error || data?.message || "Failed to fetch vendor status");
      }

      if (data && data.results && data.results.length > 0) {
        // Find profile that matches current user ID
        const userProfile = data.results.find(p => p.user === user?.id) || data.results[0];
        console.log('👤 Profile found:', { id: userProfile.id, user: userProfile.user, is_active: userProfile.is_active });
        setProfileId(userProfile.id);
        setIsActive(userProfile.is_active || false);
      } else {
        console.log('❌ No profile found in response');
      }
    } catch (err) {
      console.error("❌ Error fetching vendor status:", err);
      toast({
        title: "Error",
        description: "Failed to load vendor status",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async () => {
    console.log('🔄 Toggle status started');
    
    // Debug authentication
    await debugAuth();
    
    try {
      const isAuthenticated = await authService.isAuthenticated();
      console.log('🔐 Authentication check:', isAuthenticated);
      
      if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to login');
        navigate("/vendor/login");
        return;
      }

      if (!profileId) {
        console.log('❌ No profile ID found');
        throw new Error("Profile ID not found");
      }

      const newStatus = !isActive;
      console.log('📝 Toggling status from', isActive, 'to', newStatus, 'for profile', profileId);
      
      const requestBody = { is_active: newStatus };
      console.log('📤 Request body:', requestBody);
      
      // Debug headers before request
      const headers = await createApiHeaders();
      console.log('📤 Request headers:', headers);
      
      const { response, data } = await apiRequest(`/vendor-profiles/${profileId}/toggle-status/`, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Toggle status response:', { 
        status: response.status, 
        statusText: response.statusText,
        data,
        headers: Object.fromEntries(response.headers.entries())
      });
      console.log('🔍 Response details:', {
        ok: response.ok,
        status: response.status,
        dataSuccess: data?.success,
        dataError: data?.error,
        dataMessage: data?.message
      });

      // Handle different response scenarios
      if (response.status === 401 || response.status === 403) {
        console.log('🚫 Authentication error - but not clearing auth yet');
        // Don't immediately clear auth - the token might still be valid for other endpoints
        toast({
          title: "Permission Error",
          description: "You don't have permission to perform this action",
          variant: "destructive",
        });
        return;
      }

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Success response received');
        
        // Check if the API returned success in the data
        if (data && data.success !== false) {
          // Success - update the status based on API response or our request
          const actualStatus = data.is_active !== undefined ? data.is_active : newStatus;
          console.log('🎯 Setting status to:', actualStatus);
          
          setIsActive(actualStatus);
          toast({
            title: "Success",
            description: data.message || `Status set to ${actualStatus ? "Online" : "Offline"}`,
          });
          
          console.log('✅ Toggle completed successfully');
          return;
        } else {
          console.log('❌ API returned success: false');
          throw new Error(data?.error || data?.message || "Failed to toggle status");
        }
      }

      // For other status codes, show error but don't clear auth
      console.log('⚠️ Unexpected status code:', response.status);
      const errorMessage = data?.error || data?.detail || data?.message || `Server returned status ${response.status}`;
      throw new Error(errorMessage);

    } catch (err) {
      console.error("❌ Error toggling status:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to toggle status",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    setNotificationsList(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotificationsList(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };



  return (
    <header className="fixed top-0 z-50 w-full max-w-full border-b bg-gradient-to-r from-gray-50 to-white shadow-lg overflow-hidden">
      <div className="flex h-14 sm:h-16 items-center px-3 sm:px-4 max-w-full">
        {/* Left Section - Logo & Brand */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/assets/ezeywaylogo.png" alt="Ezeyway" className="h-32 w-32 sm:h-36 sm:w-36 object-contain flex-shrink-0" />
          </div>
        </div>

        {/* Center Section - Online/Offline Toggle & Connection Status */}
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-full px-3 py-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${
              isActive ? 'text-green-700' : 'text-gray-700'
            }`}>
              {isActive ? 'Online' : 'Offline'}
            </span>
            {isConnected && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Real-time notifications active" />
            )}
          </div>
          <button
            onClick={toggleStatus}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 ${
              isActive ? 'bg-green-500' : 'bg-gray-400'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm ${
                isActive ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {/* Messages */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 text-gray-700 hover:bg-gray-100">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadMessagesCount > 0 && (
                  <Badge
                    className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-[10px] sm:text-xs flex items-center justify-center min-w-[16px] sm:min-w-[20px] bg-red-500 text-white border-2 border-white"
                  >
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </Badge>
                )}
                <span className="sr-only">Messages</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 sm:w-80 mr-2 sm:mr-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h4 className="font-semibold">Messages</h4>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/vendor/messages')}
                    className="text-xs"
                  >
                    View all
                  </Button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No messages
                  </div>
                ) : (
                  conversations.slice(0, 5).map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-3 border-b hover:bg-muted/50 cursor-pointer ${
                        conversation.unread_count > 0 ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => navigate('/vendor/messages')}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={conversation.other_participant?.profile_picture} />
                          <AvatarFallback>{conversation.other_participant?.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{conversation.other_participant?.username}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.last_message?.content || conversation.last_message?.file_name || 'No messages'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {conversation.last_message ? new Date(conversation.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                        {conversation.unread_count > 0 && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-bold">{conversation.unread_count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Custom Header Actions (like new notification system) */}
          {headerActions}
          
          {/* Fallback Notifications if no headerActions provided */}
          {!headerActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 text-gray-700 hover:bg-gray-100">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-[10px] sm:text-xs flex items-center justify-center min-w-[16px] sm:min-w-[20px] bg-red-500 text-white border-2 border-white"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 sm:w-80 mr-2 sm:mr-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <h4 className="font-semibold">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificationsList.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notificationsList.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => {
                          markAsRead(notification.id);
                          // Always route to vendor pages for vendor header
                          if (notification.type === 'order') {
                            navigate('/vendor/orders');
                          } else if (notification.type === 'payment') {
                            navigate('/vendor/wallet');
                          } else if (notification.type === 'message') {
                            navigate('/vendor/messages');
                          } else {
                            navigate('/vendor/orders'); // Default to orders page for all notifications
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            !notification.read ? 'bg-blue-500' : 'bg-transparent'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                notification.type === 'order' ? 'border-green-200 text-green-700' :
                                notification.type === 'payment' ? 'border-blue-200 text-blue-700' :
                                notification.type === 'message' ? 'border-purple-200 text-purple-700' :
                                'border-gray-200 text-gray-700'
                              }`}
                            >
                              {notification.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t">
                  <Button 
                    variant="ghost" 
                    className="w-full text-sm"
                    onClick={() => navigate('/vendor/notifications')}
                  >
                    View all notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}