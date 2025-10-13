package com.ezeyway.app;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class OverlayService extends Service {
    private static final String TAG = "OverlayService";
    private WindowManager windowManager;
    private View overlayView;
    private MediaPlayer mediaPlayer;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String orderId = intent.getStringExtra("orderId");
            String orderNumber = intent.getStringExtra("orderNumber");
            String amount = intent.getStringExtra("amount");
            
            showOverlay(orderId, orderNumber, amount);
            startRinging();
        }
        return START_NOT_STICKY;
    }

    private void showOverlay(String orderId, String orderNumber, String amount) {
        try {
            windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

            // Create overlay layout
            LinearLayout layout = new LinearLayout(this);
            layout.setOrientation(LinearLayout.VERTICAL);
            layout.setBackgroundColor(0xFFFF4444);
            layout.setPadding(50, 50, 50, 50);
            layout.setGravity(Gravity.CENTER);

            // Title
            TextView title = new TextView(this);
            title.setText("🚨 NEW ORDER ALERT! 🚨");
            title.setTextSize(24);
            title.setTextColor(0xFFFFFFFF);
            title.setGravity(Gravity.CENTER);
            layout.addView(title);

            // Order details
            TextView details = new TextView(this);
            details.setText("Order #" + orderNumber + "\nAmount: $" + amount + "\n\nTAP TO ACCEPT!");
            details.setTextSize(18);
            details.setTextColor(0xFFFFFFFF);
            details.setGravity(Gravity.CENTER);
            layout.addView(details);

            // Accept button
            Button acceptBtn = new Button(this);
            acceptBtn.setText("ACCEPT ORDER");
            acceptBtn.setBackgroundColor(0xFF00AA00);
            acceptBtn.setTextColor(0xFFFFFFFF);
            acceptBtn.setOnClickListener(v -> {
                acceptOrder(orderId, orderNumber, amount);
            });
            layout.addView(acceptBtn);

            // Dismiss button
            Button dismissBtn = new Button(this);
            dismissBtn.setText("DISMISS");
            dismissBtn.setBackgroundColor(0xFF666666);
            dismissBtn.setTextColor(0xFFFFFFFF);
            dismissBtn.setOnClickListener(v -> {
                dismissOverlay();
            });
            layout.addView(dismissBtn);

            overlayView = layout;

            // Window parameters for overlay
            int layoutFlag;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
            } else {
                layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
            }

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
                PixelFormat.TRANSLUCENT
            );

            params.gravity = Gravity.CENTER;
            windowManager.addView(overlayView, params);
            
            Log.d(TAG, "🚨 OVERLAY DISPLAYED!");

        } catch (Exception e) {
            Log.e(TAG, "Failed to show overlay: " + e.getMessage());
        }
    }

    private void startRinging() {
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            mediaPlayer = MediaPlayer.create(this, alarmUri);
            mediaPlayer.setLooping(true);
            mediaPlayer.start();
            Log.d(TAG, "🔊 Ringing started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start ringing: " + e.getMessage());
        }
    }

    private void acceptOrder(String orderId, String orderNumber, String amount) {
        stopRinging();
        dismissOverlay();

        // Launch main app
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("autoOpened", true);
        intent.putExtra("orderId", orderId);
        intent.putExtra("orderNumber", orderNumber);
        intent.putExtra("amount", amount);
        startActivity(intent);

        stopSelf();
    }

    private void dismissOverlay() {
        stopRinging();
        if (overlayView != null && windowManager != null) {
            windowManager.removeView(overlayView);
            overlayView = null;
        }
        stopSelf();
    }

    private void stopRinging() {
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        dismissOverlay();
    }
}