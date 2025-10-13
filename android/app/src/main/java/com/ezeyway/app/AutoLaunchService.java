package com.ezeyway.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class AutoLaunchService extends Service {
    private static final String TAG = "AutoLaunchService";
    private static final String CHANNEL_ID = "AUTO_LAUNCH_CHANNEL";
    private static final int NOTIFICATION_ID = 9999;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "🚀 AutoLaunchService created");
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "🚀 AutoLaunchService FORCE STARTING!");
        
        // Start as foreground service immediately
        startForeground(NOTIFICATION_ID, createNotification());
        
        // Force launch app multiple times to ensure it opens
        for (int i = 0; i < 3; i++) {
            try {
                Intent launchIntent = new Intent(this, MainActivity.class);
                launchIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TOP |
                    Intent.FLAG_ACTIVITY_SINGLE_TOP |
                    Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT |
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                );
                
                if (intent != null) {
                    launchIntent.putExtra("autoOpened", true);
                    launchIntent.putExtra("forceOpened", true);
                    launchIntent.putExtra("orderId", intent.getStringExtra("orderId"));
                    launchIntent.putExtra("orderNumber", intent.getStringExtra("orderNumber"));
                    launchIntent.putExtra("amount", intent.getStringExtra("amount"));
                    launchIntent.putExtra("fromService", true);
                }
                
                startActivity(launchIntent);
                Log.d(TAG, "✅ Force launch attempt " + (i + 1));
                
                Thread.sleep(100); // Small delay between attempts
            } catch (Exception e) {
                Log.e(TAG, "❌ Launch attempt " + (i + 1) + " failed: " + e.getMessage());
            }
        }
        
        // Stop service after launching
        stopSelf();
        
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Auto Launch Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Service for auto-launching app on orders");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Processing Order")
            .setContentText("Opening app for new order...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .build();
    }
}