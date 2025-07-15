package com.messageforwarder.services

import android.app.Notification
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import com.messageforwarder.data.models.Message
import com.messageforwarder.data.models.MessageSource
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class NotificationListenerService : NotificationListenerService() {

    companion object {
        private val SUPPORTED_PACKAGES = mapOf(
            "com.whatsapp" to MessageSource.WHATSAPP,
            "org.telegram.messenger" to MessageSource.TELEGRAM,
            "com.instagram.android" to MessageSource.INSTAGRAM,
            "com.facebook.orca" to MessageSource.FACEBOOK_MESSENGER,
            "com.discord" to MessageSource.DISCORD,
            "com.Slack" to MessageSource.SLACK
        )
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName
        val messageSource = SUPPORTED_PACKAGES[packageName] ?: return
        
        val notification = sbn.notification
        val extras = notification.extras
        
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: text
        
        if (text.isNotEmpty() || bigText.isNotEmpty()) {
            val message = Message(
                sender = title,
                content = if (bigText.isNotEmpty()) bigText else text,
                timestamp = sbn.postTime,
                messageType = messageSource,
                originalPackage = packageName
            )
            
            CoroutineScope(Dispatchers.IO).launch {
                ForwardingService.processMessage(this@NotificationListenerService, message)
            }
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // Handle notification removal if needed
    }
}