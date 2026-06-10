package com.edugah3.forgeflow;

import android.content.Intent;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ActiveWorkoutForeground")
public class ActiveWorkoutForegroundPlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        startOrUpdate(call, ActiveWorkoutForegroundService.ACTION_START);
    }

    @PluginMethod
    public void update(PluginCall call) {
        startOrUpdate(call, ActiveWorkoutForegroundService.ACTION_UPDATE);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), ActiveWorkoutForegroundService.class);
        intent.setAction(ActiveWorkoutForegroundService.ACTION_STOP);
        getContext().startService(intent);
        JSObject result = new JSObject();
        result.put("stopped", true);
        call.resolve(result);
    }

    private void startOrUpdate(PluginCall call, String action) {
        String workoutName = call.getString("workoutName", "Treino em andamento");
        String summary = call.getString("summary", "Toque para voltar ao ForgeFlow");
        String currentExerciseName = call.getString("currentExerciseName", "");
        String currentSetLabel = call.getString("currentSetLabel", "");
        int completedSets = call.getInt("completedSets", 0);
        int totalSets = call.getInt("totalSets", 0);
        int progress = call.getInt("progress", 0);
        Long startedAt = call.getLong("startedAt", System.currentTimeMillis());

        Intent intent = new Intent(getContext(), ActiveWorkoutForegroundService.class);
        intent.setAction(action);
        intent.putExtra(ActiveWorkoutForegroundService.EXTRA_WORKOUT_NAME, workoutName);
        intent.putExtra(ActiveWorkoutForegroundService.EXTRA_SUMMARY, summary);
        intent.putExtra(ActiveWorkoutForegroundService.EXTRA_CURRENT_EXERCISE_NAME, currentExerciseName);
        intent.putExtra(ActiveWorkoutForegroundService.EXTRA_CURRENT_SET_LABEL, currentSetLabel);
        intent.putExtra(ActiveWorkoutForegroundService.EXTRA_COMPLETED_SETS, completedSets);
        intent.putExtra(ActiveWorkoutForegroundService.EXTRA_TOTAL_SETS, totalSets);
        intent.putExtra(ActiveWorkoutForegroundService.EXTRA_PROGRESS, progress);
        intent.putExtra(ActiveWorkoutForegroundService.EXTRA_STARTED_AT, startedAt != null ? startedAt : System.currentTimeMillis());

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ContextCompat.startForegroundService(getContext(), intent);
        } else {
            getContext().startService(intent);
        }

        JSObject result = new JSObject();
        result.put("started", true);
        call.resolve(result);
    }
}
