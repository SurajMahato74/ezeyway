import React, { useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { apiRequest } from '@/utils/apiUtils';
import { Capacitor } from '@capacitor/core';

export const VendorDebugInfo: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const collectDebugInfo = async () => {
      try {
        const token = await authService.getToken();
        const user = await authService.getUser();
        const isAuthenticated = await authService.isAuthenticated();
        const isSessionValid = await authService.isSessionValid();
        const isNative = Capacitor.isNativePlatform();
        
        let vendorProfileStatus = 'Not checked';
        let vendorProfileError = null;
        
        if (token && user?.user_type === 'vendor') {
          try {
            const { response, data } = await apiRequest('/api/vendor-profiles/');
            vendorProfileStatus = `${response.status} - ${response.ok ? 'Success' : 'Failed'}`;
            if (!response.ok) {
              vendorProfileError = data?.error || response.statusText;
            }
          } catch (error) {
            vendorProfileStatus = 'Error';
            vendorProfileError = error.message;
          }
        } else if (token && user?.user_type !== 'vendor') {
          vendorProfileStatus = 'Not a vendor user';
        }

        setDebugInfo({
          isNative,
          platform: Capacitor.getPlatform(),
          token: token ? `${token.substring(0, 10)}...` : 'None',
          user: user ? { id: user.id, user_type: user.user_type, email: user.email } : 'None',
          isAuthenticated,
          isSessionValid,
          vendorProfileStatus,
          vendorProfileError,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        setDebugInfo({
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    collectDebugInfo();
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-xs z-50"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Vendor Debug Info</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(JSON.stringify(debugInfo, null, 2));
            alert('Debug info copied to clipboard');
          }}
          className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-xs w-full"
        >
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
};