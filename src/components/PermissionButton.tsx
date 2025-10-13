import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Camera, Mic, Settings } from 'lucide-react';
import { PermissionService } from '@/services/permissions';

interface PermissionButtonProps {
  type: 'location' | 'camera' | 'all';
  className?: string;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({ type, className }) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handlePermissionRequest = async () => {
    setIsRequesting(true);
    try {
      switch (type) {
        case 'location':
          await PermissionService.requestLocationPermission();
          break;
        case 'camera':
          await PermissionService.requestCameraPermission();
          break;
        case 'all':
          await PermissionService.requestAllPermissions();
          break;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'location':
        return <MapPin className="w-4 h-4 mr-2" />;
      case 'camera':
        return <Camera className="w-4 h-4 mr-2" />;
      case 'all':
        return <Settings className="w-4 h-4 mr-2" />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'location':
        return 'Enable Location';
      case 'camera':
        return 'Enable Camera & Mic';
      case 'all':
        return 'Enable All Permissions';
    }
  };

  return (
    <Button
      onClick={handlePermissionRequest}
      disabled={isRequesting}
      className={className}
      variant="outline"
    >
      {getIcon()}
      {isRequesting ? 'Requesting...' : getLabel()}
    </Button>
  );
};