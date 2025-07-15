package com.messageforwarder.data.database

import androidx.lifecycle.LiveData
import androidx.room.*
import com.messageforwarder.data.models.Message

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages ORDER BY timestamp DESC LIMIT 100")
    fun getRecentMessages(): LiveData<List<Message>>

    @Query("SELECT * FROM messages WHERE wasForwarded = 1 ORDER BY timestamp DESC")
    fun getForwardedMessages(): LiveData<List<Message>>

    @Insert
    suspend fun insertMessage(message: Message): Long

    @Update
    suspend fun updateMessage(message: Message)

    @Query("DELETE FROM messages WHERE timestamp < :cutoffTime")
    suspend fun deleteOldMessages(cutoffTime: Long)

    @Query("SELECT COUNT(*) FROM messages WHERE wasForwarded = 1")
    fun getForwardedCount(): LiveData<Int>
}
