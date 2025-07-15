package com.messageforwarder.services

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.messageforwarder.data.models.ForwardingRule
import com.messageforwarder.data.models.Message
import com.messageforwarder.data.models.MessageSource
import com.messageforwarder.data.repositories.RuleRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.Properties
import javax.mail.*
import javax.mail.internet.InternetAddress
import javax.mail.internet.MimeMessage

class ForwardingService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "ForwardingService"
        private val repository = RuleRepository()
        private val okHttpClient = OkHttpClient()

        suspend fun processMessage(context: Context, message: Message) {
            try {
                // Save message to database
                repository.insertMessage(message)
                
                // Get enabled forwarding rules
                val rules = repository.getEnabledRules()
                
                for (rule in rules) {
                    if (shouldForwardMessage(rule, message)) {
                        forwardMessage(rule, message)
                        
                        // Update message as forwarded
                        val forwardedMessage = message.copy(
                            wasForwarded = true,
                            forwardedTo = getForwardDestination(rule)
                        )
                        repository.updateMessage(forwardedMessage)
                        
                        Log.d(TAG, "Message forwarded via rule: ${rule.name}")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error processing message", e)
            }
        }

        private fun shouldForwardMessage(rule: ForwardingRule, message: Message): Boolean {
            // Check source type
            if (rule.sourceType != MessageSource.ALL_NOTIFICATIONS && rule.sourceType != message.messageType) {
                return false
            }

            // Check sender filter
            rule.senderFilter?.let { filter ->
                if (!message.sender.contains(filter, ignoreCase = true) && 
                    !message.sender.matches(Regex(filter))) {
                    return false
                }
            }

            // Check keyword filter
            rule.keywordFilter?.let { keywords ->
                val keywordList = keywords.split(",").map { it.trim() }
                val hasKeyword = keywordList.any { keyword ->
                    message.content.contains(keyword, ignoreCase = true)
                }
                if (!hasKeyword) return false
            }

            return true
        }

        private suspend fun forwardMessage(rule: ForwardingRule, message: Message) {
            val formattedMessage = formatMessage(rule, message)

            // Email forwarding
            rule.forwardToEmail?.let { email ->
                sendEmail(email, "Message Forward", formattedMessage)
            }

            // Webhook forwarding
            rule.forwardToWebhook?.let { webhook ->
                sendWebhook(webhook, formattedMessage, message)
            }

            // Telegram forwarding
            rule.forwardToTelegram?.let { telegram ->
                sendTelegram(telegram, formattedMessage)
            }
        }

        private fun formatMessage(rule: ForwardingRule, message: Message): String {
            val sb = StringBuilder()
            
            if (rule.includeOriginalSender) {
                sb.append("From: ${message.sender}\n")
            }
            
            sb.append("Source: ${message.messageType.name}\n")
            sb.append("Time: ${java.util.Date(message.timestamp)}\n")
            sb.append("Content: ${message.content}")
            
            return sb.toString()
        }

        private fun getForwardDestination(rule: ForwardingRule): String {
            return listOfNotNull(
                rule.forwardToEmail,
                rule.forwardToWebhook,
                rule.forwardToTelegram
            ).joinToString(", ")
        }

        private fun sendEmail(toEmail: String, subject: String, body: String) {
            // Note: For production, you'd need to configure SMTP settings
            // This is a simplified implementation
            try {
                val props = Properties().apply {
                    put("mail.smtp.host", "smtp.gmail.com")
                    put("mail.smtp.port", "587")
                    put("mail.smtp.auth", "true")
                    put("mail.smtp.starttls.enable", "true")
                }

                // This would require user's email credentials
                // In a real app, you'd use OAuth or app-specific passwords
                Log.d(TAG, "Would send email to: $toEmail")
                Log.d(TAG, "Subject: $subject")
                Log.d(TAG, "Body: $body")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error sending email", e)
            }
        }

        private fun sendWebhook(webhookUrl: String, message: String, originalMessage: Message) {
            try {
                val json = """
                    {
                        "text": "$message",
                        "sender": "${originalMessage.sender}",
                        "timestamp": ${originalMessage.timestamp},
                        "source": "${originalMessage.messageType.name}"
                    }
                """.trimIndent()

                val requestBody = json.toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url(webhookUrl)
                    .post(requestBody)
                    .build()

                okHttpClient.newCall(request).enqueue(object : Callback {
                    override fun onFailure(call: Call, e: IOException) {
                        Log.e(TAG, "Webhook failed", e)
                    }

                    override fun onResponse(call: Call, response: Response) {
                        Log.d(TAG, "Webhook sent successfully")
                        response.close()
                    }
                })
            } catch (e: Exception) {
                Log.e(TAG, "Error sending webhook", e)
            }
        }

        private fun sendTelegram(botToken: String, message: String) {
            // Telegram bot implementation would go here
            // Format: "BOT_TOKEN:CHAT_ID"
            try {
                val parts = botToken.split(":")
                if (parts.size >= 2) {
                    val token = parts[0]
                    val chatId = parts[1]
                    
                    Log.d(TAG, "Would send Telegram message to chat: $chatId")
                    Log.d(TAG, "Message: $message")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error sending Telegram message", e)
            }
        }
    }
}