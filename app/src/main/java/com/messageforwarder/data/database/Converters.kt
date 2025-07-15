package com.messageforwarder.data.database

import androidx.room.TypeConverter
import com.messageforwarder.data.models.MessageSource

class Converters {
    @TypeConverter
    fun fromMessageSource(source: MessageSource): String = source.name

    @TypeConverter
    fun toMessageSource(source: String): MessageSource = MessageSource.valueOf(source)
}
