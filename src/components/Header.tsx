import { MapPin, Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { messageService } from "@/services/messageService";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import { useAuthAction } from "@/hooks/useAuthAction";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authService } from "@/services/authService";
import logo from "@/assets/ezeywaylogo.png";

export function Header() {
  const navigate = useNavigate();
  const { navigateWithAuth } = useAuthAction();
  const [location, setLocation] = useState({
    city: "Getting location...",
    area: "Please wait"
  });
  const [conversations, setConversations] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const { notifications, unreadCount: unreadNotificationCount, markAsRead, markAllAsRead } = useUserNotifications();

  useEffect(() => {
    const initializeHeader = async () => {
      // Check if user is authenticated before loading data
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        loadConversations();
        const interval = setInterval(loadConversations, 5000);
        return () => clearInterval(interval);
      }
    };

    getCurrentLocation();
    initializeHeader();
  }, []);

  const loadConversations = async () => {
    try {
      const token = await authService.getToken();
      if (!token) {
        // User not authenticated, don't load conversations
        return;
      }
      
      const data: any = await messageService.getConversations();
      const conversationList = Array.isArray(data) ? data : data?.results || [];
      
      // Check for new messages and show notifications
      if (conversations.length > 0) {
        conversationList.forEach(newConv => {
          const oldConv = conversations.find(c => c.id === newConv.id);
          if (oldConv && newConv.unread_count > oldConv.unread_count) {
            showNotification(`New message from ${newConv.other_participant?.username}`, 
                           newConv.last_message?.content || 'New message received');
          }
        });
      }
      
      setConversations(conversationList);
      const unreadCount = conversationList.reduce((total, conv) => total + (conv.unread_count || 0), 0);
      setTotalUnreadCount(unreadCount);
    } catch (error) {
      // Only log error if it's not an authentication issue
      if (!error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
        console.error('Failed to load conversations:', error);
      }
    }
  };

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };



  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
            );
            const data = await response.json();
            if (data.address) {
              // Prioritize road and neighbourhood first
              const primaryLocation = data.address.road || data.address.neighbourhood;
              const secondaryLocation = data.address.neighbourhood || data.address.suburb || data.address.city || data.address.town || data.address.village || data.address.county;
              
              setLocation({
                city: primaryLocation || secondaryLocation || "Unknown City",
                area: `${data.address.neighbourhood || data.address.suburb || data.address.city || data.address.town || data.address.state || ""}${data.address.city_district ? `, ${data.address.city_district}` : ""}`
              });
            } else {
              setLocation({
                city: "Location found",
                area: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              });
            }
          } catch (error) {
            setLocation({
              city: "Location unavailable",
              area: "Service error"
            });
          }
        },
        (error) => {
          setLocation({
            city: "Location denied",
            area: "Enable location access"
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setLocation({
        city: "Location not supported",
        area: "Browser not compatible"
      });
    }
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-3 py-2 md:py-1 bg-card/95 backdrop-blur-sm border-b border-border/30 min-h-[60px] md:min-h-[50px]">
      <div className="flex items-center">
        <img src={logo} alt="Ezeyway" className="h-20 w-20 md:h-12 md:w-24 object-contain" />
      </div>
      
      <div className="flex items-center gap-1.5 cursor-pointer text-center" onClick={getCurrentLocation}>
        <MapPin className="h-3 w-3 text-primary" />
        <div>
          <p className="text-xs font-medium text-foreground">{location.city}</p>
          <p className="text-[10px] text-muted-foreground">{location.area}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 hover:bg-muted rounded-lg transition-smooth relative">
              <MessageCircle className="h-5 w-5 text-foreground" />
              {totalUnreadCount > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{totalUnreadCount > 9 ? '9+' : totalUnreadCount}</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold">Messages</h4>
              <Button variant="ghost" size="sm" onClick={() => navigateWithAuth('/messages')} className="text-xs">
                View all
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No messages</div>
              ) : (
                conversations.slice(0, 5).map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 border-b hover:bg-muted/50 cursor-pointer ${
                      conversation.unread_count > 0 ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => navigateWithAuth('/messages')}
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-1.5 hover:bg-muted rounded-lg transition-smooth">
              <Bell className="h-5 w-5 text-foreground" />
              {unreadNotificationCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center min-w-[16px] bg-destructive text-destructive-foreground">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </Badge>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-semibold">Notifications</h4>
              <div className="flex gap-2">
                {unreadNotificationCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => navigateWithAuth('/notifications')} className="text-xs">
                  View all
                </Button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No notifications</div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b hover:bg-muted/50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.action_url) {
                        navigateWithAuth(notification.action_url);
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
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}