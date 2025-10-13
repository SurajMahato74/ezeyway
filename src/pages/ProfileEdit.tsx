import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Camera, Save, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from '@/config/api';
import { authService } from '@/services/authService';

interface UserData {
  username: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  profile_picture: string | null;
}

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [userData, setUserData] = useState<UserData>({
    username: "",
    email: "",
    phone_number: "",
    address: "",
    date_of_birth: "",
    profile_picture: null
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await authService.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(API_BASE + "profile/", {
        headers: {
          "Authorization": `Token ${token}`,
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setUserData({
        username: data.username || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        address: data.address || "",
        date_of_birth: data.date_of_birth || "",
        profile_picture: data.profile_picture 
          ? (data.profile_picture.startsWith('http') 
              ? data.profile_picture 
              : `${API_BASE}media/${data.profile_picture}`)
          : null
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await authService.getToken();
      if (!token) return;

      const response = await fetch(API_BASE + "profile/update/", {
        method: "PUT",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          username: userData.username,
          phone_number: userData.phone_number,
          address: userData.address,
          date_of_birth: userData.date_of_birth || null
        })
      });

      if (response.ok) {
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageUpload = async (file: File) => {
    if (!file) return;
    
    try {
      const token = await authService.getToken();
      if (!token) return;
      
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      const response = await fetch(API_BASE + "profile/upload-picture/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "ngrok-skip-browser-warning": "true"
        },
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setUserData(prev => ({ ...prev, profile_picture: result.profile_picture }));
        toast({
          title: "Success",
          description: "Profile picture updated successfully!",
        });
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      console.error('Profile image upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    }
  };

  const updateUserData = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Personal Information</h1>
          </div>
          <Button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saving}
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-4 pb-20">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div 
                  className={`w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden ${isEditing ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                  onClick={isEditing ? () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleProfileImageUpload(file);
                    };
                    input.click();
                  } : undefined}
                >
                  {userData.profile_picture ? (
                    <img 
                      src={userData.profile_picture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-semibold text-2xl">
                      {userData.username ? userData.username.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <Button 
                    size="sm" 
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full p-0 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleProfileImageUpload(file);
                      };
                      input.click();
                    }}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {isEditing ? "Click to change profile picture" : "Profile Picture"}
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={userData.username}
                  onChange={(e) => updateUserData("username", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  disabled={true}
                  className="mt-1 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={userData.phone_number}
                  onChange={(e) => updateUserData("phone_number", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={userData.address}
                  onChange={(e) => updateUserData("address", e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="Enter your address"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={userData.date_of_birth || ""}
                  onChange={(e) => updateUserData("date_of_birth", e.target.value || null)}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfileEdit;