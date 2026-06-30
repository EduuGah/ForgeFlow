package com.edugah3.forgeflow;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
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
    public static final String EXTRA_CURRENT_EXERCISE_NAME = "currentExerciseName";
    public static final String EXTRA_CURRENT_SET_LABEL = "currentSetLabel";
    public static final String EXTRA_COMPLETED_SETS = "completedSets";
    public static final String EXTRA_TOTAL_SETS = "totalSets";
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
        String currentExerciseName = intent != null ? intent.getStringExtra(EXTRA_CURRENT_EXERCISE_NAME) : null;
        String currentSetLabel = intent != null ? intent.getStringExtra(EXTRA_CURRENT_SET_LABEL) : null;
        int completedSets = intent != null ? intent.getIntExtra(EXTRA_COMPLETED_SETS, 0) : 0;
        int totalSets = intent != null ? intent.getIntExtra(EXTRA_TOTAL_SETS, 0) : 0;
        int progress = intent != null ? intent.getIntExtra(EXTRA_PROGRESS, 0) : 0;
        long startedAt = intent != null ? intent.getLongExtra(EXTRA_STARTED_AT, System.currentTimeMillis()) : System.currentTimeMillis();

        Notification notification = buildNotification(
            workoutName,
            summary,
            currentExerciseName,
            currentSetLabel,
            completedSets,
            totalSets,
            progress,
            startedAt
        );

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

    private Notification buildNotification(
        String workoutName,
        String summary,
        String currentExerciseName,
        String currentSetLabel,
        int completedSets,
        int totalSets,
        int progress,
        long startedAt
    ) {
        Intent openIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("forgeflow://workout/active?source=notification"), this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openIntent.putExtra("forgeflowRoute", "/start-workout");
        openIntent.putExtra("forgeflowSource", "active-workout-notification");

        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) pendingFlags |= PendingIntent.FLAG_IMMUTABLE;

        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, openIntent, pendingFlags);

        String safeWorkoutName = hasText(workoutName) ? workoutName.trim() : "Treino em andamento";
        String safeExerciseName = hasText(currentExerciseName) ? currentExerciseName.trim() : "";
        String safeSetLabel = hasText(currentSetLabel) ? currentSetLabel.trim() : "";
        int safeProgress = Math.max(0, Math.min(100, progress));
        int safeCompletedSets = Math.max(0, completedSets);
        int safeTotalSets = Math.max(0, totalSets);

        String setLine = safeSetLabel;
        if (!hasText(setLine) && safeTotalSets > 0) {
            setLine = safeCompletedSets + "/" + safeTotalSets + " series";
        }

        String compactStatus = hasText(safeExerciseName)
            ? (hasText(setLine) ? setLine + " - " + safeExerciseName : safeExerciseName)
            : "Toque para voltar ao ForgeFlow";
        String progressLine = safeProgress + "% concluido";
        String setsLine = safeTotalSets > 0 ? safeCompletedSets + "/" + safeTotalSets + " series" : "Series em andamento";
        String title = hasText(safeExerciseName) ? safeExerciseName : safeWorkoutName;
        String detailText = hasText(summary)
            ? summary.trim()
            : safeWorkoutName + " - " + compactStatus + " - " + setsLine + " - " + progressLine;

        Bitmap largeIcon = BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_forgeflow)
            .setLargeIcon(largeIcon)
            .setContentTitle("ForgeFlow - " + title)
            .setContentText(compactStatus + " - " + progressLine)
            .setSubText(progressLine)
            .setContentInfo(safeProgress + "%")
            .setStyle(new NotificationCompat.BigTextStyle().bigText(detailText))
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setAutoCancel(false)
            .setSilent(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setColor(0xFF0EA5E9)
            .setColorized(false)
            .setWhen(startedAt > 0 ? startedAt : System.currentTimeMillis())
            .setUsesChronometer(true)
            .setShowWhen(true)
            .setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL)
            .addAction(R.drawable.ic_stat_forgeflow, "Abrir detalhes", pendingIntent);

        builder.setProgress(100, safeProgress, false);

        return builder.build();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
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
        channel.setDescription("Notificacao fixa enquanto existe treino em andamento.");
        channel.setShowBadge(false);
        manager.createNotificationChannel(channel);
    }
}
