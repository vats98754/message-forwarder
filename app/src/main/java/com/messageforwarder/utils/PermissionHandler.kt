package com.messageforwarder.utils

import android.Manifest
import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.karumi.dexter.Dexter
import com.karumi.dexter.MultiplePermissionsReport
import com.karumi.dexter.PermissionToken
import com.karumi.dexter.listener.PermissionRequest
import com.karumi.dexter.listener.multi.MultiplePermissionsListener

class PermissionHandler(private val activity: Activity) {

    companion object {
        const val NOTIFICATION_LISTENER_REQUEST = 1001
        
        private val REQUIRED_PERMISSIONS = listOfNotNull(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS,
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE,
            Manifest.permission.READ_PHONE_STATE,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                Manifest.permission.POST_NOTIFICATIONS
            } else null
        )
    }

    fun requestAllPermissions(callback: (Boolean) -> Unit) {
        Dexter.withContext(activity)
            .withPermissions(REQUIRED_PERMISSIONS)
            .withListener(object : MultiplePermissionsListener {
                override fun onPermissionsChecked(report: MultiplePermissionsReport) {
                    callback(report.areAllPermissionsGranted())
                }

                override fun onPermissionRationaleShouldBeShown(
                    permissions: List<PermissionRequest>,
                    token: PermissionToken
                ) {
                    token.continuePermissionRequest()
                }
            }).check()
    }

    fun hasAllPermissions(): Boolean {
        return REQUIRED_PERMISSIONS.all { permission ->
            ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED
        }
    }

    fun isNotificationListenerEnabled(): Boolean {
        val packageName = activity.packageName
        val flat = Settings.Secure.getString(
            activity.contentResolver,
            "enabled_notification_listeners"
        )
        return flat?.contains(packageName) == true
    }

    fun requestNotificationListenerPermission() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        activity.startActivityForResult(intent, NOTIFICATION_LISTENER_REQUEST)
    }

    fun openAppSettings() {
        val intent = Intent().apply {
            action = Settings.ACTION_APPLICATION_DETAILS_SETTINGS
            data = android.net.Uri.fromParts("package", activity.packageName, null)
        }
        activity.startActivity(intent)
    }

    fun getPermissionStatus(): PermissionStatus {
        val hasBasicPermissions = hasAllPermissions()
        val hasNotificationAccess = isNotificationListenerEnabled()
        
        return PermissionStatus(
            hasBasicPermissions = hasBasicPermissions,
            hasNotificationAccess = hasNotificationAccess,
            isFullyEnabled = hasBasicPermissions && hasNotificationAccess
        )
    }
}

data class PermissionStatus(
    val hasBasicPermissions: Boolean,
    val hasNotificationAccess: Boolean,
    val isFullyEnabled: Boolean
)