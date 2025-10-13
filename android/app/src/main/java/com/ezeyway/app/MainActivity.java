package com.ezeyway.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.community.fcm.FCMPlugin;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register FCM plugin
        registerPlugin(FCMPlugin.class);
        
        // Create notification channel for orders
        createNotificationChannel();
        
        // Force app to show on top when auto-opened
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                           WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                           WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                           WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                           WindowManager.LayoutParams.FLAG_FULLSCREEN);
        
        // Request overlay permission
        requestOverlayPermission();
        
        // Add JavaScript interface for debugging
        getBridge().getWebView().addJavascriptInterface(new AndroidInterface(), "AndroidInterface");
        
        // Handle auto-opened intent
        handleAutoOpenIntent(getIntent());
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "order_notifications",
                "Order Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for new orders");
            channel.enableVibration(true);
            channel.setShowBadge(true);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
            Log.d(TAG, "✅ Notification channel created");
        }
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Log.d(TAG, "📱 New intent received");
        handleAutoOpenIntent(intent);
    }
    
    private void handleAutoOpenIntent(Intent intent) {
        Log.d(TAG, "🔍 Checking intent for auto-open data...");
        
        if (intent != null) {
            Log.d(TAG, "📊 Intent extras: " + intent.getExtras());
            
            if (intent.hasExtra("autoOpened") || intent.hasExtra("forceOpened")) {
                Log.d(TAG, "🚀 App FORCE auto-opened!");
                
                // Bring app to front aggressively
                getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED);
                
                String orderId = intent.getStringExtra("orderId");
                String orderNumber = intent.getStringExtra("orderNumber");
                String amount = intent.getStringExtra("amount");
                boolean fromService = intent.getBooleanExtra("fromService", false);
                boolean forceOpened = intent.getBooleanExtra("forceOpened", false);
                
                Log.d(TAG, "📊 Order data - ID: " + orderId + ", Number: " + orderNumber + ", Amount: " + amount + ", ForceOpened: " + forceOpened);
                
                // Store data for web app to pick up
                if (orderId != null) {
                    String orderData = "{\"orderId\":" + orderId + 
                                     ",\"orderNumber\":\"" + orderNumber + "\"" +
                                     ",\"amount\":\"" + amount + "\"" +
                                     ",\"autoOpened\":true" +
                                     ",\"forceOpened\":" + forceOpened +
                                     ",\"fromBackground\":true" +
                                     ",\"fromService\":" + fromService +
                                     ",\"timestamp\":" + System.currentTimeMillis() + "}";
                    
                    Log.d(TAG, "💾 Storing order data: " + orderData);
                    
                    // Execute JavaScript to handle auto-opened order
                    getBridge().getWebView().post(() -> {
                        String js = "localStorage.setItem('autoOpenOrder', '" + orderData + "'); " +
                                   "window.dispatchEvent(new CustomEvent('autoOpenedFromBackground', {detail: " + orderData + "})); " +
                                   "console.log('📱 FORCE AUTO-OPEN DATA RECEIVED:', " + orderData + ");";
                        getBridge().getWebView().evaluateJavascript(js, null);
                        Log.d(TAG, "✅ Order data sent to web app");
                    });
                } else {
                    Log.w(TAG, "⚠️ No orderId found in auto-open intent");
                }
            } else {
                Log.d(TAG, "🔍 No auto-open flag found in intent");
            }
        } else {
            Log.d(TAG, "🔍 Intent is null");
        }
    }
    
    private void requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(this)) {
                Log.d(TAG, "🔐 Requesting overlay permission");
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
                startActivityForResult(intent, 1234);
            } else {
                Log.d(TAG, "✅ Overlay permission already granted");
            }
        }
    }
    
    public class AndroidInterface {
        @JavascriptInterface
        public void checkOverlayPermission() {
            Log.d(TAG, "🔍 Checking overlay permission...");
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                boolean canDrawOverlays = Settings.canDrawOverlays(MainActivity.this);
                Log.d(TAG, "🔐 Overlay permission: " + canDrawOverlays);
                
                // Test launching overlay service directly
                if (canDrawOverlays) {
                    Intent overlayIntent = new Intent(MainActivity.this, OverlayService.class);
                    overlayIntent.putExtra("orderId", "999");
                    overlayIntent.putExtra("orderNumber", "DEBUG-TEST");
                    overlayIntent.putExtra("amount", "100");
                    startService(overlayIntent);
                    Log.d(TAG, "🚨 DEBUG: Overlay service launched directly!");
                } else {
                    Log.w(TAG, "⚠️ Overlay permission not granted!");
                    requestOverlayPermission();
                }
            }
        }
        
        @JavascriptInterface
        public void testDirectOverlay() {
            Log.d(TAG, "🚨 Testing direct overlay launch...");
            Intent overlayIntent = new Intent(MainActivity.this, OverlayService.class);
            overlayIntent.putExtra("orderId", "888");
            overlayIntent.putExtra("orderNumber", "DIRECT-TEST");
            overlayIntent.putExtra("amount", "200");
            startService(overlayIntent);
        }
    }
}
