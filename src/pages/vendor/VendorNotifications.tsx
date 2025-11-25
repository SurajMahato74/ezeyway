import React from 'react';

const VendorNotifications = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Notification Settings</h3>
          <p className="text-sm text-gray-600">Manage your notification preferences</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Recent Notifications</h3>
          <p className="text-sm text-gray-600">No new notifications</p>
        </div>
      </div>
    </div>
  );
};

export default VendorNotifications;