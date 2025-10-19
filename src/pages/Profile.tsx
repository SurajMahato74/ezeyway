import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, ShoppingBag, Heart, LogOut, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNavigation } from "@/components/BottomNavigation";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { FloatingChat } from "@/components/FloatingChat";
import { ProfilePasswordSetup } from "@/components/ProfilePasswordSetup";
import { useAuthAction } from "@/hooks/useAuthAction";
import { API_BASE } from '@/config/api';
import { authService } from '@/services/authService';
import { apiRequest } from '@/utils/apiUtils';
import { useApp } from '@/contexts/AppContext';

// Menu items constant for cleaner code
const MENU_ITEMS = [
  { icon: ShoppingBag, label: "My Orders", path: "/orders" },
  { icon: Heart, label: "Wishlist", path: "/wishlist" },
  { icon: User, label: "Personal Information", path: "/profile-edit" },
  { icon: Shield, label: "Privacy & Security", path: "/privacy" },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout, state, login } = useApp();
  const { navigateWithAuth } = useAuthAction();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await authService.getToken();
      if (!token) {
        navigateWithAuth('/profile');
        return;
      }

      const { response, data: userData } = await apiRequest('/profile/');
      
      if (!response.ok && userData) {
        // Handle API response data if available
        console.log('Profile API response:', userData);
      }

      if (response.status === 401) {
        // Token might be invalid or user doesn't have access to this endpoint
        console.log('Profile endpoint returned 401, using stored user data');
        const storedUser = await authService.getUser();
        if (storedUser) {
          setUser({
            email: storedUser.email || storedUser.username || 'User',
            avatar: "/placeholder-avatar.jpg"
          });
          return;
        } else {
          navigateWithAuth('/profile');
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      // userData is already parsed from apiRequest

      // Update the context with the latest user data including available_roles
      if (state.user) {
        const updatedUser = {
          ...state.user,
          available_roles: userData.available_roles || state.user.available_roles,
          user_type: userData.user_type || state.user.user_type
        };
        const currentToken = await authService.getToken();
        await login(updatedUser, currentToken); // Update context with current token
      }

      setUser({
        email: userData.email,
        avatar: userData.profile_picture
          ? (userData.profile_picture.startsWith('http')
              ? userData.profile_picture
              : `${API_BASE}media/${userData.profile_picture}`)
          : "/placeholder-avatar.jpg"
      });
    } catch (err) {
      setError(err.message);
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/logout/', { method: 'POST' });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      await logout();
      navigate("/login");
    }
  };

  const handleProfileImageUpload = async (file) => {
    if (!file) return;
    
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      const { response, data: result } = await apiRequest('/profile/upload-picture/', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok && result) {
        setUser(prev => ({ ...prev, avatar: result.profile_picture }));
      }
    } catch (error) {
      console.error('Profile image upload error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Failed to load profile"}</p>
          <Button onClick={() => navigate("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex flex-col items-center pt-6 pb-6">
          <div className="relative">
            <div 
              className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mb-3 cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProfileImageUpload(file);
                };
                input.click();
              }}
            >
              {user.avatar && user.avatar !== "/placeholder-avatar.jpg" ? (
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-semibold text-lg">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <Button 
              size="sm" 
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full p-0 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProfileImageUpload(file);
                };
                input.click();
              }}
            >
              <Camera className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-gray-800 text-base font-medium">{user.email}</p>
        </div>
      </div>

      {/* Menu Section */}
      <div className="p-4 space-y-6 pb-20">
        {/* Role Switcher and Logout Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account Type
            </h3>
            <p className="text-sm text-gray-600 mb-3">Switch between your Customer and Vendor accounts</p>
            <RoleSwitcher />
          </div>
          
          {/* Logout Button */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center py-4 bg-red-50/40 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
        
        {/* Password Setup for Google OAuth users */}
        <ProfilePasswordSetup />
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {MENU_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigateWithAuth(item.path)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <div className="text-gray-400">›</div>
                </div>
              );
            })}
          </CardContent>
        </Card>




      </div>

      <FloatingChat />
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;