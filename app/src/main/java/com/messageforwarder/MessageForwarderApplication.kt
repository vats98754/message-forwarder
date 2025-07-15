package com.messageforwarder

import android.app.Application
import androidx.room.Room
import com.messageforwarder.data.database.AppDatabase

class MessageForwarderApplication : Application() {
    
    val database by lazy {
        Room.databaseBuilder(
            applicationContext,
            AppDatabase::class.java,
            "message_forwarder_database"
        ).build()
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: MessageForwarderApplication
            private set
    }
}
