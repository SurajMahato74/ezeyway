import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from '@/config/api';
import { authService } from '@/services/authService';

const Privacy = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(true);
  const [savedPassword, setSavedPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
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

        if (!response.ok) throw new Error("Failed to fetch profile");
        
        const data = await response.json();
        const plainPass = data?.plain_password || "";
        setSavedPassword(plainPass);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast({
        title: "Error",
        description: "New password is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const token = await authService.getToken();
      if (!token) {
        toast({
          title: "Error",
          description: "You are not authenticated. Please log in.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const response = await fetch(API_BASE + "change-password/simple/", {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }

      const data = await response.json();
      await authService.setAuth(data.token, await authService.getUser());

      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      
      setSavedPassword(newPassword);
      setNewPassword("");
      setIsChangingPassword(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="sm" className="p-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">Privacy & Security</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-20">
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold">Password</h2>
          </div>

          {!isChangingPassword ? (
            <div className="space-y-4">
              <Label>Your Password</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={savedPassword} 
                  disabled 
                  className="bg-gray-100" 
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={() => setIsChangingPassword(true)} disabled={isLoading}>
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Label>New Password</Label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />

              <div className="flex gap-2">
                <Button onClick={handlePasswordChange} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setNewPassword("");
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Privacy;