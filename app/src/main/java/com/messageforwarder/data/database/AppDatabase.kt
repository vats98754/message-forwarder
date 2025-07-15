package com.messageforwarder.data.database

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.messageforwarder.data.models.ForwardingRule
import com.messageforwarder.data.models.Message

@Database(
    entities = [ForwardingRule::class, Message::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun ruleDao(): RuleDao
    abstract fun messageDao(): MessageDao
}
