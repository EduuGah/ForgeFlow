package com.edugah3.forgeflow;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Locale;

@CapacitorPlugin(name = "ForgeFlowMedia")
public class ForgeFlowMediaPlugin extends Plugin {
    private static final String INSTAGRAM_PACKAGE = "com.instagram.android";

    @PluginMethod
    public void saveImageToGallery(PluginCall call) {
        try {
            byte[] bytes = decodeBase64(call.getString("base64"));
            String fileName = sanitizeFileName(call.getString("fileName", "forgeflow-treino.png"));
            String mimeType = call.getString("mimeType", "image/png");
            String album = call.getString("album", "ForgeFlow");

            Uri uri = saveImage(bytes, fileName, mimeType, album);

            JSObject result = new JSObject();
            result.put("saved", true);
            result.put("uri", uri.toString());
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Não foi possível salvar a imagem na galeria.", exception);
        }
    }

    @PluginMethod
    public void shareImageToInstagramStory(PluginCall call) {
        try {
            byte[] bytes = decodeBase64(call.getString("base64"));
            String fileName = sanitizeFileName(call.getString("fileName", "forgeflow-story.png"));
            String mimeType = call.getString("mimeType", "image/png");
            String album = call.getString("album", "ForgeFlow");
            String sourceApplication = call.getString("sourceApplication", "");

            Uri uri = saveImage(bytes, fileName, mimeType, album);

            Activity activity = getActivity();
            Intent intent = new Intent("com.instagram.share.ADD_TO_STORY");
            intent.setDataAndType(uri, mimeType);
            intent.setPackage(INSTAGRAM_PACKAGE);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.putExtra("com.instagram.sharedSticker.backgroundImage", uri);

            if (sourceApplication != null && !sourceApplication.trim().isEmpty()) {
                intent.putExtra("source_application", sourceApplication.trim());
            }

            activity.grantUriPermission(INSTAGRAM_PACKAGE, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(intent);

            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("uri", uri.toString());
            call.resolve(result);
        } catch (ActivityNotFoundException exception) {
            call.reject("Instagram não está instalado ou não aceitou o compartilhamento para Stories.", exception);
        } catch (Exception exception) {
            call.reject("Não foi possível abrir o Instagram Stories com a imagem.", exception);
        }
    }

    private byte[] decodeBase64(String base64) throws Exception {
        if (base64 == null || base64.trim().isEmpty()) {
            throw new Exception("Base64 vazio.");
        }

        String normalized = base64;
        int commaIndex = normalized.indexOf(',');
        if (commaIndex >= 0) {
            normalized = normalized.substring(commaIndex + 1);
        }

        return Base64.decode(normalized, Base64.DEFAULT);
    }

    private String sanitizeFileName(String name) {
        String safeName = name == null ? "forgeflow-treino.png" : name;
        safeName = safeName.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "-");

        if (!safeName.endsWith(".png")) {
            safeName = safeName + ".png";
        }

        return safeName;
    }

    private Uri saveImage(byte[] bytes, String fileName, String mimeType, String album) throws Exception {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            return saveWithMediaStore(bytes, fileName, mimeType, album);
        }

        return saveLegacy(bytes, fileName, mimeType, album);
    }

    private Uri saveWithMediaStore(byte[] bytes, String fileName, String mimeType, String album) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
        values.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + File.separator + album);
        values.put(MediaStore.Images.Media.IS_PENDING, 1);

        Uri collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        Uri uri = resolver.insert(collection, values);

        if (uri == null) {
            throw new Exception("MediaStore não retornou uma URI válida.");
        }

        try (OutputStream outputStream = resolver.openOutputStream(uri)) {
            if (outputStream == null) throw new Exception("Não foi possível abrir o arquivo de saída.");
            outputStream.write(bytes);
        }

        values.clear();
        values.put(MediaStore.Images.Media.IS_PENDING, 0);
        resolver.update(uri, values, null, null);

        return uri;
    }

    @SuppressWarnings("deprecation")
    private Uri saveLegacy(byte[] bytes, String fileName, String mimeType, String album) throws Exception {
        File picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
        File appDir = new File(picturesDir, album);
        if (!appDir.exists() && !appDir.mkdirs()) {
            throw new Exception("Não foi possível criar a pasta ForgeFlow.");
        }

        File file = new File(appDir, fileName);
        try (FileOutputStream outputStream = new FileOutputStream(file)) {
            outputStream.write(bytes);
        }

        Uri uri = Uri.fromFile(file);
        Intent scanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
        scanIntent.setData(uri);
        getContext().sendBroadcast(scanIntent);

        return uri;
    }
}
