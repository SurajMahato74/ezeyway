import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User, Bell, Shield, Globe, Moon, Sun,
  Smartphone, HelpCircle, LogOut, ChevronRight,
  Volume2, VolumeX, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { BottomNavigation } from "@/components/BottomNavigation";

const settingsSections = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Personal Information", path: "/profile-edit" },
      { icon: Shield, label: "Privacy & Security", path: "/privacy" },
      { icon: Globe, label: "Language", path: "/language" }
    ]
  },
  {
    title: "Notifications",
    items: [
      { icon: Bell, label: "Push Notifications", type: "toggle", key: "pushNotifications" },
      { icon: Volume2, label: "Sound", type: "toggle", key: "soundEnabled" },
      { icon: Eye, label: "Order Updates", type: "toggle", key: "orderUpdates" }
    ]
  },
  {
    title: "Preferences",
    items: [
      { icon: Moon, label: "Dark Mode", type: "toggle", key: "darkMode" },
      { icon: Smartphone, label: "App Version", value: "1.0.0", disabled: true }
    ]
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help Center", path: "/help" },
      { icon: Globe, label: "Contact Us", path: "/contact" }
    ]
  }
];

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    soundEnabled: true,
    orderUpdates: true,
    darkMode: false
  });

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    // In real app, clear user session and navigate to login
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">Settings</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="p-4 space-y-6 pb-20">
        {settingsSections.map((section, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <div
                    key={itemIndex}
                    className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                      item.disabled ? 'opacity-50' : 'cursor-pointer'
                    }`}
                    onClick={() => {
                      if (item.type === 'toggle') {
                        handleToggle(item.key!);
                      } else if (item.path && !item.disabled) {
                        handleNavigate(item.path);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.value && (
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                      )}
                      {item.type === 'toggle' && (
                        <Switch
                          checked={settings[item.key as keyof typeof settings] as boolean}
                          onCheckedChange={() => handleToggle(item.key!)}
                        />
                      )}
                      {!item.type && !item.disabled && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* App Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center py-4">
              <div className="text-2xl font-bold text-primary mb-2">KathSnap</div>
              <p className="text-sm text-muted-foreground mb-4">
                Swift Shopping, Delivered to Your Door
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Version 1.0.0</p>
                <p>© 2024 KathSnap. All rights reserved.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full flex items-center justify-center py-6 bg-red-50/40 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          <span className="font-medium text-base">Logout</span>
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
}