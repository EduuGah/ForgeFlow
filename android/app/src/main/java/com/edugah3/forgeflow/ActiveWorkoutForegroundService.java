package com.edugah3.forgeflow;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

public class ActiveWorkoutForegroundService extends Service {
    public static final String ACTION_START = "com.edugah3.forgeflow.ACTIVE_WORKOUT_START";
    public static final String ACTION_UPDATE = "com.edugah3.forgeflow.ACTIVE_WORKOUT_UPDATE";
    public static final String ACTION_STOP = "com.edugah3.forgeflow.ACTIVE_WORKOUT_STOP";
    public static final String EXTRA_WORKOUT_NAME = "workoutName";
    public static final String EXTRA_SUMMARY = "summary";
    public static final String EXTRA_PROGRESS = "progress";
    public static final String EXTRA_STARTED_AT = "startedAt";
    public static final String CHANNEL_ID = "forgeflow-active-workout-foreground";
    public static final int NOTIFICATION_ID = 9301;

    private boolean isForegroundStarted = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_START;

        if (ACTION_STOP.equals(action)) {
            stopForeground(true);
            stopSelf();
            isForegroundStarted = false;
            return START_NOT_STICKY;
        }

        String workoutName = intent != null ? intent.getStringExtra(EXTRA_WORKOUT_NAME) : null;
        String summary = intent != null ? intent.getStringExtra(EXTRA_SUMMARY) : null;
        int progress = intent != null ? intent.getIntExtra(EXTRA_PROGRESS, 0) : 0;
        long startedAt = intent != null ? intent.getLongExtra(EXTRA_STARTED_AT, System.currentTimeMillis()) : System.currentTimeMillis();

        Notification notification = buildNotification(workoutName, summary, progress, startedAt);

        if (!isForegroundStarted || ACTION_START.equals(action)) {
            startForeground(NOTIFICATION_ID, notification);
            isForegroundStarted = true;
        } else {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) manager.notify(NOTIFICATION_ID, notification);
        }

        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private Notification buildNotification(String workoutName, String summary, int progress, long startedAt) {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) pendingFlags |= PendingIntent.FLAG_IMMUTABLE;

        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, openIntent, pendingFlags);

        String safeWorkoutName = workoutName != null && !workoutName.trim().isEmpty() ? workoutName : "Treino em andamento";
        String safeSummary = summary != null && !summary.trim().isEmpty() ? summary : "Toque para voltar ao ForgeFlow";
        int safeProgress = Math.max(0, Math.min(100, progress));

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("ForgeFlow · " + safeWorkoutName)
            .setContentText(safeSummary)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(safeSummary))
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setAutoCancel(false)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setWhen(startedAt > 0 ? startedAt : System.currentTimeMillis())
            .setUsesChronometer(true)
            .setShowWhen(true);

        if (safeProgress > 0) builder.setProgress(100, safeProgress, false);

        return builder.build();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Treino ativo ForgeFlow",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Notificação fixa enquanto existe treino em andamento.");
        channel.setShowBadge(false);
        manager.createNotificationChannel(channel);
    }
}
