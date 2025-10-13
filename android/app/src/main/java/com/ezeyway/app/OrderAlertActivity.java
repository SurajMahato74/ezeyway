package com.ezeyway.app;

import android.app.Activity;
import android.content.Intent;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

public class OrderAlertActivity extends Activity {
    private static final String TAG = "OrderAlertActivity";
    private MediaPlayer mediaPlayer;
    private Handler handler = new Handler();
    private Runnable ringRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Make this activity appear over everything
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        
        // Create simple layout programmatically
        createLayout();
        
        // Start continuous ringing
        startContinuousRinging();
        
        Log.d(TAG, "🚨 ORDER ALERT ACTIVITY LAUNCHED!");
    }
    
    private void createLayout() {
        // Create main layout
        android.widget.LinearLayout layout = new android.widget.LinearLayout(this);
        layout.setOrientation(android.widget.LinearLayout.VERTICAL);
        layout.setBackgroundColor(0xFFFF4444); // Red background
        layout.setPadding(50, 100, 50, 100);
        layout.setGravity(android.view.Gravity.CENTER);
        
        // Title
        TextView title = new TextView(this);
        title.setText("🔥 NEW ORDER ALERT! 🔥");
        title.setTextSize(28);
        title.setTextColor(0xFFFFFFFF);
        title.setGravity(android.view.Gravity.CENTER);
        title.setPadding(0, 0, 0, 30);
        layout.addView(title);
        
        // Order details
        String orderId = getIntent().getStringExtra("orderId");
        String orderNumber = getIntent().getStringExtra("orderNumber");
        String amount = getIntent().getStringExtra("amount");
        
        TextView details = new TextView(this);
        details.setText("Order #" + orderNumber + "\nAmount: $" + amount + "\n\nTAP TO ACCEPT!");
        details.setTextSize(20);
        details.setTextColor(0xFFFFFFFF);
        details.setGravity(android.view.Gravity.CENTER);
        details.setPadding(0, 0, 0, 50);
        layout.addView(details);
        
        // Accept button
        Button acceptButton = new Button(this);
        acceptButton.setText("ACCEPT ORDER");
        acceptButton.setTextSize(18);
        acceptButton.setBackgroundColor(0xFF00AA00);
        acceptButton.setTextColor(0xFFFFFFFF);
        acceptButton.setPadding(40, 20, 40, 20);
        acceptButton.setOnClickListener(v -> acceptOrder());
        layout.addView(acceptButton);
        
        // Dismiss button
        Button dismissButton = new Button(this);
        dismissButton.setText("DISMISS");
        dismissButton.setTextSize(16);
        dismissButton.setBackgroundColor(0xFF666666);
        dismissButton.setTextColor(0xFFFFFFFF);
        dismissButton.setPadding(40, 20, 40, 20);
        dismissButton.setOnClickListener(v -> dismissAlert());
        layout.addView(dismissButton);
        
        setContentView(layout);
    }
    
    private void startContinuousRinging() {
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            mediaPlayer = MediaPlayer.create(this, alarmUri);
            mediaPlayer.setLooping(true);
            mediaPlayer.start();
            
            Log.d(TAG, "🔊 Continuous ringing started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start ringing: " + e.getMessage());
        }
    }
    
    private void acceptOrder() {
        stopRinging();
        
        // Launch main app with order data
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("autoOpened", true);
        intent.putExtra("orderId", getIntent().getStringExtra("orderId"));
        intent.putExtra("orderNumber", getIntent().getStringExtra("orderNumber"));
        intent.putExtra("amount", getIntent().getStringExtra("amount"));
        
        startActivity(intent);
        finish();
    }
    
    private void dismissAlert() {
        stopRinging();
        finish();
    }
    
    private void stopRinging() {
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }
        if (handler != null && ringRunnable != null) {
            handler.removeCallbacks(ringRunnable);
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopRinging();
    }
    
    @Override
    public void onBackPressed() {
        // Prevent back button from dismissing
        // User must tap Accept or Dismiss
    }
}