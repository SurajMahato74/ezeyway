package com.ezeyway.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class FCMBackgroundService extends BroadcastReceiver {
    private static final String TAG = "FCMBackgroundService";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "🔥 Background receiver triggered!");
        
        if ("com.ezeyway.app.AUTO_OPEN_ORDER".equals(intent.getAction())) {
            Log.d(TAG, "🚀 AUTO-OPENING APP FROM BACKGROUND!");
            
            // Force launch the app
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                                Intent.FLAG_ACTIVITY_SINGLE_TOP |
                                Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT);
            
            // Add auto-open data
            launchIntent.putExtra("autoOpened", true);
            launchIntent.putExtra("fromBackground", true);
            
            context.startActivity(launchIntent);
            
            Log.d(TAG, "✅ App launched from background!");
        }
    }
}