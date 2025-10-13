package com.ezeyway.app;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class RichOrderNotification {
    private static final String TAG = "RichOrderNotification";
    private static MediaPlayer mediaPlayer;
    
    public static void showRichNotification(Context context, String orderId, String orderNumber, 
                                          String customerName, String amount, String imageUrl, 
                                          String items, String address) {
        
        // Create Accept intent
        Intent acceptIntent = new Intent(context, OrderActionReceiver.class);
        acceptIntent.setAction("ACCEPT_ORDER");
        acceptIntent.putExtra("orderId", orderId);
        acceptIntent.putExtra("orderNumber", orderNumber);
        PendingIntent acceptPendingIntent = PendingIntent.getBroadcast(
            context, Integer.parseInt(orderId), acceptIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Create Reject intent
        Intent rejectIntent = new Intent(context, OrderActionReceiver.class);
        rejectIntent.setAction("REJECT_ORDER");
        rejectIntent.putExtra("orderId", orderId);
        rejectIntent.putExtra("orderNumber", orderNumber);
        PendingIntent rejectPendingIntent = PendingIntent.getBroadcast(
            context, Integer.parseInt(orderId) + 1000, rejectIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Build rich notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "order_notifications")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("🔥 NEW ORDER #" + orderNumber)
            .setContentText(customerName + " • $" + amount)
            .setStyle(new NotificationCompat.BigTextStyle()
                .bigText("👤 " + customerName + "\n💰 $" + amount + "\n📦 " + items + "\n📍 " + address))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(false)
            .setOngoing(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "REJECT", rejectPendingIntent)
            .addAction(android.R.drawable.ic_menu_send, "ACCEPT", acceptPendingIntent);
        
        // Skip image loading for now to prevent crashes
        // TODO: Add image loading in background thread
        
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.notify(Integer.parseInt(orderId), builder.build());
        
        // Start continuous ringing
        startContinuousRinging(context);
        
        Log.d(TAG, "🔔 Rich notification shown for order " + orderId);
    }
    

    
    public static void startContinuousRinging(Context context) {
        try {
            if (mediaPlayer != null) {
                mediaPlayer.stop();
                mediaPlayer.release();
            }
            
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            mediaPlayer = MediaPlayer.create(context, alarmUri);
            mediaPlayer.setLooping(true);
            mediaPlayer.start();
            Log.d(TAG, "🔊 Continuous ringing started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start ringing: " + e.getMessage());
        }
    }
    
    public static void stopRinging() {
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
            Log.d(TAG, "🔇 Ringing stopped");
        }
    }
    
    public static class OrderActionReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            String orderId = intent.getStringExtra("orderId");
            String orderNumber = intent.getStringExtra("orderNumber");
            
            Log.d(TAG, "📱 Order action: " + action + " for order " + orderId);
            
            // Stop ringing
            stopRinging();
            
            // Cancel notification
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            notificationManager.cancel(Integer.parseInt(orderId));
            
            if ("ACCEPT_ORDER".equals(action)) {
                Log.d(TAG, "✅ Order " + orderId + " ACCEPTED");
                // TODO: Send accept API call
                
                // Open app
                Intent appIntent = new Intent(context, MainActivity.class);
                appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                appIntent.putExtra("orderId", orderId);
                appIntent.putExtra("orderAccepted", true);
                context.startActivity(appIntent);
                
            } else if ("REJECT_ORDER".equals(action)) {
                Log.d(TAG, "❌ Order " + orderId + " REJECTED");
                // TODO: Send reject API call
            }
        }
    }
}