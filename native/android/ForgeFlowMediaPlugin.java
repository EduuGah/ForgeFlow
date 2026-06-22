package com.edugah3.forgeflow;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
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
            String mimeType = normalizeMimeType(call.getString("mimeType", "image/png"));
            byte[] bytes = decodeBase64(call.getString("base64"));
            String fileName = sanitizeFileName(call.getString("fileName", defaultFileName(mimeType)), mimeType);
            String album = sanitizeAlbum(call.getString("album", "ForgeFlow"));

            Uri uri = saveImage(bytes, fileName, mimeType, album);

            JSObject result = new JSObject();
            result.put("saved", true);
            result.put("uri", uri.toString());
            result.put("mimeType", mimeType);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Não foi possível salvar a imagem na galeria: " + exception.getMessage(), exception);
        }
    }

    @PluginMethod
    public void shareImageToInstagramStory(PluginCall call) {
        try {
            String mimeType = normalizeMimeType(call.getString("mimeType", "image/png"));
            byte[] bytes = decodeBase64(call.getString("base64"));
            String fileName = sanitizeFileName(call.getString("fileName", defaultFileName(mimeType)), mimeType);
            String album = sanitizeAlbum(call.getString("album", "ForgeFlow"));
            String sourceApplication = call.getString("sourceApplication", "");

            Uri uri = saveImage(bytes, fileName, mimeType, album);

            Activity activity = getActivity();
            Intent intent = new Intent("com.instagram.share.ADD_TO_STORY");
            intent.setDataAndType(uri, mimeType);
            intent.setPackage(INSTAGRAM_PACKAGE);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.setClipData(ClipData.newRawUri("ForgeFlow workout", uri));
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            intent.putExtra("com.instagram.sharedSticker.backgroundImage", uri);
            intent.putExtra("com.instagram.sharedSticker.backgroundTopColor", "#0B0D12");
            intent.putExtra("com.instagram.sharedSticker.backgroundBottomColor", "#EF4444");

            if (sourceApplication != null && !sourceApplication.trim().isEmpty()) {
                intent.putExtra("source_application", sourceApplication.trim());
            }

            activity.grantUriPermission(INSTAGRAM_PACKAGE, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(intent);

            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("uri", uri.toString());
            result.put("mimeType", mimeType);
            call.resolve(result);
        } catch (ActivityNotFoundException exception) {
            call.reject("Instagram não está instalado ou não aceitou o compartilhamento para Stories.", exception);
        } catch (Exception exception) {
            call.reject("Não foi possível abrir o Instagram Stories com a imagem: " + exception.getMessage(), exception);
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

        byte[] bytes = Base64.decode(normalized, Base64.DEFAULT);
        if (bytes.length == 0) {
            throw new Exception("Imagem vazia após decodificação.");
        }

        return bytes;
    }

    private String normalizeMimeType(String mimeType) {
        String safeMime = mimeType == null ? "image/png" : mimeType.toLowerCase(Locale.ROOT).trim();
        if (safeMime.equals("image/jpg")) return "image/jpeg";
        if (safeMime.equals("image/jpeg") || safeMime.equals("image/png") || safeMime.equals("image/webp")) return safeMime;
        return "image/png";
    }

    private String defaultFileName(String mimeType) {
        return "forgeflow-treino." + extensionForMimeType(mimeType);
    }

    private String extensionForMimeType(String mimeType) {
        if ("image/jpeg".equals(mimeType)) return "jpg";
        if ("image/webp".equals(mimeType)) return "webp";
        return "png";
    }

    private String sanitizeFileName(String name, String mimeType) {
        String extension = extensionForMimeType(mimeType);
        String safeName = name == null ? defaultFileName(mimeType) : name;
        safeName = safeName.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9._-]", "-");
        safeName = safeName.replaceAll("\\.(png|jpg|jpeg|webp)$", "");

        if (safeName.trim().isEmpty()) {
            safeName = "forgeflow-treino";
        }

        return safeName + "." + extension;
    }

    private String sanitizeAlbum(String album) {
        String safeAlbum = album == null ? "ForgeFlow" : album.trim().replaceAll("[/\\\\]+", "-");
        return safeAlbum.isEmpty() ? "ForgeFlow" : safeAlbum;
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
        long nowSeconds = System.currentTimeMillis() / 1000L;

        values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
        values.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
        values.put(MediaStore.Images.Media.DATE_ADDED, nowSeconds);
        values.put(MediaStore.Images.Media.DATE_MODIFIED, nowSeconds);
        values.put(MediaStore.Images.Media.DATE_TAKEN, System.currentTimeMillis());
        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + File.separator + album);
        values.put(MediaStore.Images.Media.IS_PENDING, 1);

        Uri collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
        Uri uri = resolver.insert(collection, values);

        if (uri == null) {
            uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        }

        if (uri == null) {
            throw new Exception("MediaStore não retornou uma URI válida.");
        }

        try (OutputStream outputStream = resolver.openOutputStream(uri, "w")) {
            if (outputStream == null) throw new Exception("Não foi possível abrir o arquivo de saída.");
            outputStream.write(bytes);
            outputStream.flush();
        }

        values.clear();
        values.put(MediaStore.Images.Media.IS_PENDING, 0);
        resolver.update(uri, values, null, null);
        resolver.notifyChange(uri, null);

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
            outputStream.flush();
        }

        Uri uri = Uri.fromFile(file);
        Intent scanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
        scanIntent.setData(uri);
        getContext().sendBroadcast(scanIntent);

        return uri;
    }
}
