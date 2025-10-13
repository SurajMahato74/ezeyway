package com.ezeyway.app;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

public class AggressiveAutoOpenJob extends JobService {
    private static final String TAG = "AggressiveAutoOpenJob";
    private static final int JOB_ID = 12345;
    private static String pendingOrderData = null;
    
    public static void scheduleJob(Context context, String orderData) {
        pendingOrderData = orderData;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            JobScheduler jobScheduler = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            
            JobInfo jobInfo = new JobInfo.Builder(JOB_ID, new ComponentName(context, AggressiveAutoOpenJob.class))
                .setMinimumLatency(0)
                .setOverrideDeadline(1000)
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_NONE)
                .setPersisted(false)
                .build();
                
            jobScheduler.schedule(jobInfo);
            Log.d(TAG, "🚀 Aggressive job scheduled");
        }
    }
    
    @Override
    public boolean onStartJob(JobParameters params) {
        Log.d(TAG, "🚀 AGGRESSIVE JOB STARTED - FORCING APP OPEN!");
        
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
            "EzeyWay:AutoOpen"
        );
        wakeLock.acquire(10000);
        
        try {
            for (int i = 0; i < 5; i++) {
                Intent intent = new Intent(this, MainActivity.class);
                intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TOP |
                    Intent.FLAG_ACTIVITY_SINGLE_TOP |
                    Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT |
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT |
                    Intent.FLAG_ACTIVITY_NO_ANIMATION
                );
                
                intent.putExtra("forceOpened", true);
                intent.putExtra("fromJob", true);
                
                if (pendingOrderData != null) {
                    intent.putExtra("orderData", pendingOrderData);
                }
                
                startActivity(intent);
                Log.d(TAG, "✅ Aggressive launch attempt " + (i + 1));
                
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    break;
                }
            }
            
            Intent overlayIntent = new Intent(this, OverlayService.class);
            overlayIntent.putExtra("orderId", "999");
            overlayIntent.putExtra("orderNumber", "JOB-FORCE");
            overlayIntent.putExtra("amount", "100");
            startService(overlayIntent);
            
        } finally {
            wakeLock.release();
        }
        
        jobFinished(params, false);
        return false;
    }
    
    @Override
    public boolean onStopJob(JobParameters params) {
        Log.d(TAG, "🛑 Job stopped");
        return false;
    }
}