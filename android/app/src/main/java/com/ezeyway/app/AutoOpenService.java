package com.ezeyway.app;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.RingtoneManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class AutoOpenService extends FirebaseMessagingService {
    private static final String TAG = "AutoOpenService";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "🚨 FCM RECEIVED!");
        
        java.util.Map<String, String> data = remoteMessage.getData();
        
        String orderId = data.getOrDefault("orderId", "999");
        String orderNumber = data.getOrDefault("orderNumber", "TEST-ORDER");
        String customerName = data.getOrDefault("customerName", "Customer");
        String amount = data.getOrDefault("amount", "100");
        String items = data.getOrDefault("items", "Order items");
        String address = data.getOrDefault("address", "Delivery address");
        
        // Show rich notification with Accept/Reject buttons
        RichOrderNotification.showRichNotification(
            this, orderId, orderNumber, customerName, amount, "", items, address
        );
        
        // Trigger aggressive auto-open
        AggressiveAutoOpenJob.scheduleJob(this, data.toString());
    }
    
    private void createUrgentNotification(java.util.Map<String, String> data) {
        try {
            String orderId = data.get("orderId");
            String orderNumber = data.get("orderNumber");
            String amount = data.get("amount");
            
            Log.d(TAG, "📊 Processing notification data:");
            Log.d(TAG, "   orderId: " + orderId);
            Log.d(TAG, "   orderNumber: " + orderNumber);
            Log.d(TAG, "   amount: " + amount);
            
            // Use default values if data is missing
            if (orderId == null) orderId = "999";
            if (orderNumber == null) orderNumber = "TEST-ORDER";
            if (amount == null) amount = "100";
            
            // Launch overlay service that appears over everything
            Intent overlayIntent = new Intent(this, OverlayService.class);
            overlayIntent.putExtra("orderId", orderId);
            overlayIntent.putExtra("orderNumber", orderNumber);
            overlayIntent.putExtra("amount", amount);
            
            startService(overlayIntent);
            Log.d(TAG, "🚨 OVERLAY SERVICE LAUNCHED for order " + orderId);
            
            // Also create notification as backup
            Intent mainIntent = new Intent(this, MainActivity.class);
            mainIntent.putExtra("orderId", orderId);
            mainIntent.putExtra("orderNumber", orderNumber);
            mainIntent.putExtra("amount", amount);
            
            PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, mainIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, "order_notifications")
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle("🔥 NEW ORDER ALERT!")
                .setContentText("Order #" + orderNumber + " - $" + amount)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setFullScreenIntent(pendingIntent, true);
            
            NotificationManager notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            notificationManager.notify(Integer.parseInt(orderId), builder.build());
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to create alert: " + e.getMessage());
        }
    }
}