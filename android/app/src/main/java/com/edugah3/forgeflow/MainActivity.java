package com.edugah3.forgeflow;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ActiveWorkoutForegroundPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
