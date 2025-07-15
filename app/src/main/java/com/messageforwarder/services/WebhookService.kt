package com.messageforwarder.services

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.messageforwarder.data.models.ForwardingRule
import com.messageforwarder.data.models.Message
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

/**
 * Service for sending messages to webhook URLs and external APIs.
 * This handles HTTP POST requests for forwarding messages to external services.
 */
class WebhookService : Service() {
    private val tag = "WebhookService"
    private val client = OkHttpClient()
    private val job = SupervisorJob()
    private val scope = CoroutineScope(Dispatchers.IO + job)

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val webhookUrl = intent?.getStringExtra("webhook_url")
        val webhookType = intent?.getStringExtra("webhook_type")
        
        if (webhookUrl != null) {
            // Reconstruct message from intent extras
            val message = Message(
                id = intent.getLongExtra("message_id", 0),
                sender = intent.getStringExtra("message_sender") ?: "",
                content = intent.getStringExtra("message_content") ?: "",
                timestamp = intent.getLongExtra("message_timestamp", System.currentTimeMillis()),
                messageType = com.messageforwarder.data.models.MessageSource.valueOf(
                    intent.getStringExtra("message_type") ?: "ALL_NOTIFICATIONS"
                )
            )
            
            val rule = intent.getStringExtra("rule_name")?.let { ruleName ->
                ForwardingRule(
                    id = intent.getLongExtra("rule_id", 0),
                    name = ruleName,
                    sourceType = message.messageType
                )
            }

            scope.launch {
                when (webhookType) {
                    "discord" -> sendToDiscord(message, webhookUrl)
                    "slack" -> sendToSlack(message, webhookUrl)
                    else -> sendWebhook(message, webhookUrl, rule)
                }
            }
        }

        return START_NOT_STICKY
    }

    private suspend fun sendWebhook(message: Message, webhookUrl: String, rule: ForwardingRule?) {
        try {
            val json = createWebhookPayload(message, rule)
            val requestBody = json.toString().toRequestBody("application/json".toMediaType())
            
            val request = Request.Builder()
                .url(webhookUrl)
                .post(requestBody)
                .addHeader("Content-Type", "application/json")
                .addHeader("User-Agent", "MessageForwarder/1.0")
                .build()

            withContext(Dispatchers.IO) {
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        Log.i(tag, "Webhook sent successfully to $webhookUrl")
                    } else {
                        Log.w(tag, "Webhook failed: ${response.code} - ${response.message}")
                    }
                }
            }
        } catch (e: IOException) {
            Log.e(tag, "Network error sending webhook to $webhookUrl", e)
        } catch (e: Exception) {
            Log.e(tag, "Error sending webhook to $webhookUrl", e)
        }
    }

    private fun createWebhookPayload(message: Message, rule: ForwardingRule?): JSONObject {
        return JSONObject().apply {
            put("message", JSONObject().apply {
                put("id", message.id)
                put("content", message.content)
                put("sender", message.sender)
                put("timestamp", message.timestamp)
                put("source", message.messageType.name)
            })
            
            rule?.let {
                put("rule", JSONObject().apply {
                    put("id", it.id)
                    put("name", it.name)
                })
            }
            
            put("app", JSONObject().apply {
                put("name", "Message Forwarder")
                put("version", "1.0.0")
            })
            
            put("timestamp", System.currentTimeMillis())
        }
    }

    private suspend fun sendToDiscord(message: Message, webhookUrl: String) {
        try {
            val payload = JSONObject().apply {
                put("content", formatMessageForDiscord(message))
                put("username", "Message Forwarder")
            }

            val requestBody = payload.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url(webhookUrl)
                .post(requestBody)
                .build()

            withContext(Dispatchers.IO) {
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        Log.i(tag, "Discord webhook sent successfully")
                    } else {
                        Log.w(tag, "Discord webhook failed: ${response.code}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(tag, "Error sending Discord webhook", e)
        }
    }

    private suspend fun sendToSlack(message: Message, webhookUrl: String) {
        try {
            val payload = JSONObject().apply {
                put("text", formatMessageForSlack(message))
                put("username", "Message Forwarder")
                put("icon_emoji", ":envelope:")
            }

            val requestBody = payload.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url(webhookUrl)
                .post(requestBody)
                .build()

            withContext(Dispatchers.IO) {
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        Log.i(tag, "Slack webhook sent successfully")
                    } else {
                        Log.w(tag, "Slack webhook failed: ${response.code}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(tag, "Error sending Slack webhook", e)
        }
    }

    private fun formatMessageForDiscord(message: Message): String {
        return """
            **${message.messageType.name} Message**
            **From:** ${message.sender}
            **Message:** ${message.content}
            **Time:** ${java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date(message.timestamp))}
        """.trimIndent()
    }

    private fun formatMessageForSlack(message: Message): String {
        return """
            *${message.messageType.name} Message*
            *From:* ${message.sender}
            *Message:* ${message.content}
            *Time:* ${java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date(message.timestamp))}
        """.trimIndent()
    }

    override fun onDestroy() {
        super.onDestroy()
        job.cancel()
    }

    companion object {
        /**
         * Send a message to a generic webhook URL
         */
        fun sendWebhook(context: android.content.Context, message: Message, webhookUrl: String, rule: ForwardingRule? = null) {
            val intent = Intent(context, WebhookService::class.java).apply {
                putExtra("message_id", message.id)
                putExtra("message_content", message.content)
                putExtra("message_sender", message.sender)
                putExtra("message_timestamp", message.timestamp)
                putExtra("message_type", message.messageType.name)
                putExtra("webhook_url", webhookUrl)
                rule?.let {
                    putExtra("rule_id", it.id)
                    putExtra("rule_name", it.name)
                }
            }
            context.startService(intent)
        }

        /**
         * Send a message to Discord webhook
         */
        fun sendToDiscord(context: android.content.Context, message: Message, webhookUrl: String) {
            val intent = Intent(context, WebhookService::class.java).apply {
                putExtra("message_content", message.content)
                putExtra("message_sender", message.sender)
                putExtra("message_timestamp", message.timestamp)
                putExtra("message_type", message.messageType.name)
                putExtra("webhook_url", webhookUrl)
                putExtra("webhook_type", "discord")
            }
            context.startService(intent)
        }

        /**
         * Send a message to Slack webhook
         */
        fun sendToSlack(context: android.content.Context, message: Message, webhookUrl: String) {
            val intent = Intent(context, WebhookService::class.java).apply {
                putExtra("message_content", message.content)
                putExtra("message_sender", message.sender)
                putExtra("message_timestamp", message.timestamp)
                putExtra("message_type", message.messageType.name)
                putExtra("webhook_url", webhookUrl)
                putExtra("webhook_type", "slack")
            }
            context.startService(intent)
        }
    }
}
