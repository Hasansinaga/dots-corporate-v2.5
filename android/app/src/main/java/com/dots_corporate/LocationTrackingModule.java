package com.dots_corporate;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class LocationTrackingModule extends ReactContextBaseJavaModule {
    private static final String CHANNEL_ID = "location_tracking_channel";
    private static final int NOTIFICATION_ID = 1001;
    private final ReactApplicationContext reactContext;

    public LocationTrackingModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "LocationTrackingModule";
    }

    @ReactMethod
    public void startLocationNotification(Promise promise) {
        try {
            createNotificationChannel();
            showLocationNotification();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to start location notification: " + e.getMessage());
        }
    }

    @ReactMethod
    public void stopLocationNotification(Promise promise) {
        try {
            hideLocationNotification();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", "Failed to stop location notification: " + e.getMessage());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Location Tracking",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows when location tracking is active");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            
            NotificationManager notificationManager = 
                (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private void showLocationNotification() {
        NotificationManager notificationManager = 
            (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (notificationManager == null) return;

        // Create intent untuk membuka app
        Intent intent = reactContext.getPackageManager()
            .getLaunchIntentForPackage(reactContext.getPackageName());
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            reactContext, 
            0, 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Build notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, CHANNEL_ID)
            .setContentTitle("📍 Location Tracking Active")
            .setContentText("Aplikasi sedang melacak lokasi Anda")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(pendingIntent)
            .setCategory(NotificationCompat.CATEGORY_SERVICE);

        // Show notification
        notificationManager.notify(NOTIFICATION_ID, builder.build());
    }

    private void hideLocationNotification() {
        NotificationManager notificationManager = 
            (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (notificationManager != null) {
            notificationManager.cancel(NOTIFICATION_ID);
        }
    }
}
