package com.messageforwarder.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "forwarding_rules")
data class ForwardingRule(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val isEnabled: Boolean = true,
    val sourceType: MessageSource,
    val senderFilter: String? = null, // Regex or exact match for sender
    val keywordFilter: String? = null, // Keywords to match in content
    val forwardToEmail: String? = null,
    val forwardToWebhook: String? = null,
    val forwardToTelegram: String? = null,
    val includeOriginalSender: Boolean = true,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

enum class MessageSource {
    SMS,
    MMS,
    EMAIL,
    WHATSAPP,
    TELEGRAM,
    INSTAGRAM,
    FACEBOOK_MESSENGER,
    DISCORD,
    SLACK,
    ALL_NOTIFICATIONS
}