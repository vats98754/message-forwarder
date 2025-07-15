package com.messageforwarder.services

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.messageforwarder.R
import com.messageforwarder.data.models.Message
import com.messageforwarder.data.models.MessageSource
import kotlinx.coroutines.*
import javax.mail.*
import javax.mail.internet.MimeMessage
import java.util.*

/**
 * Service for monitoring email accounts and forwarding emails based on rules.
 * Note: This requires user configuration of email credentials.
 */
class EmailService : Service() {
    private val tag = "EmailService"
    private var job: Job? = null
    private var isMonitoring = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_MONITORING -> startEmailMonitoring()
            ACTION_STOP_MONITORING -> stopEmailMonitoring()
            ACTION_CONFIGURE_ACCOUNT -> configureEmailAccount(intent)
        }
        return START_STICKY
    }

    private fun startEmailMonitoring() {
        if (isMonitoring) return
        
        isMonitoring = true
        job = CoroutineScope(Dispatchers.IO).launch {
            while (isMonitoring) {
                try {
                    checkForNewEmails()
                    delay(30000) // Check every 30 seconds
                } catch (e: Exception) {
                    Log.e(tag, "Error monitoring emails", e)
                    delay(60000) // Wait longer on error
                }
            }
        }
    }

    private fun stopEmailMonitoring() {
        isMonitoring = false
        job?.cancel()
    }

    private fun configureEmailAccount(intent: Intent) {
        // This would be called from settings to configure email credentials
        // For demo purposes, we'll just log the action
        Log.i(tag, "Email account configuration requested")
    }

    private suspend fun checkForNewEmails() {
        // This is a simplified email checking implementation
        // In a real app, you'd want to store email credentials securely
        // and handle multiple email accounts
        
        try {
            val props = Properties().apply {
                put("mail.store.protocol", "imaps")
                put("mail.imaps.host", "imap.gmail.com")
                put("mail.imaps.port", "993")
                put("mail.imaps.ssl.enable", "true")
            }

            // Note: This is just demo code. Real implementation would need:
            // 1. Secure credential storage
            // 2. OAuth2 authentication for Gmail
            // 3. Support for multiple email providers
            // 4. Proper error handling and retry logic
            
            Log.d(tag, "Email monitoring check (demo - no actual connection)")
            
            // Demo: Create a fake email message for testing
            if (Random().nextInt(100) < 5) { // 5% chance for demo
                val demoMessage = Message(
                    sender = "demo@example.com",
                    content = "Demo email: Important message received",
                    timestamp = System.currentTimeMillis(),
                    messageType = MessageSource.EMAIL
                )
                
                // Forward to ForwardingService for processing
                val forwardIntent = Intent(this@EmailService, ForwardingService::class.java).apply {
                    putExtra("message_content", demoMessage.content)
                    putExtra("message_sender", demoMessage.sender)
                    putExtra("message_source", demoMessage.messageType.name)
                }
                startService(forwardIntent)
            }
            
        } catch (e: Exception) {
            Log.e(tag, "Error checking emails", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopEmailMonitoring()
    }

    companion object {
        const val ACTION_START_MONITORING = "START_MONITORING"
        const val ACTION_STOP_MONITORING = "STOP_MONITORING"
        const val ACTION_CONFIGURE_ACCOUNT = "CONFIGURE_ACCOUNT"
    }
}
