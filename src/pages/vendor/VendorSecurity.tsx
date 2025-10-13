import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VendorPage } from "@/components/VendorLayout";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from '@/utils/apiUtils';
import { authService } from '@/services/authService';

const VendorSecurity = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(true); // always show plain password
  const [savedPassword, setSavedPassword] = useState(""); // fetched from API
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch vendor profile with plain_password
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated) return;

        const vendorId = 1; // adjust to your vendor ID logic
        const { response, data } = await apiRequest(`/vendor-profiles/${vendorId}/`);

        if (!response.ok) throw new Error("Failed to fetch profile");
        const plainPass = data?.user_info?.plain_password || "";
        setSavedPassword(plainPass);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error("New password is required");
      return;
    }
    setIsLoading(true);
    try {
      // Check persistent authentication
      const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
      const isVendorLoggedIn = await simplePersistentAuth.isVendorLoggedIn();
      
      if (!isVendorLoggedIn) {
        navigate("/vendor/login");
        return;
      }
      
      // Restore auth for API calls
      const vendorAuth = await simplePersistentAuth.getVendorAuth();
      if (vendorAuth) {
        await authService.setAuth(vendorAuth.token, vendorAuth.user);
      }

      const { response, data } = await apiRequest('/change-password/simple/', {
        method: "POST",
        body: JSON.stringify({
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }
      await authService.setAuth(data.token, await authService.getUser());

      toast.success("Password changed successfully");
      setSavedPassword(newPassword);
      setNewPassword("");
      setIsChangingPassword(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VendorPage title="Security & Login">
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="sm" className="p-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg">Security & Login</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold">Password</h2>
            </div>

            {!isChangingPassword ? (
              <div className="space-y-4">
                <Label>Your Password</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="text" value={savedPassword} disabled className="bg-gray-100" />
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
                />

                <div className="flex gap-2">
                  <Button onClick={handlePasswordChange} disabled={isLoading}>
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsChangingPassword(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </VendorPage>
  );
};

export default VendorSecurity;
