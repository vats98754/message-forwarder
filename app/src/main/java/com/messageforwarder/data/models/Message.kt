package com.messageforwarder.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "messages")
data class Message(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val sender: String,
    val content: String,
    val timestamp: Long,
    val messageType: MessageSource,
    val wasForwarded: Boolean = false,
    val forwardedTo: String? = null,
    val originalPackage: String? = null, // Package name for notifications
    val attachments: String? = null // JSON string of attachments
)

data class MessageAttachment(
    val type: AttachmentType,
    val uri: String,
    val fileName: String? = null,
    val mimeType: String? = null
)

enum class AttachmentType {
    IMAGE,
    VIDEO,
    AUDIO,
    DOCUMENT,
    OTHER
}