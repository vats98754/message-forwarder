package com.messageforwarder.data.database

import androidx.lifecycle.LiveData
import androidx.room.*
import com.messageforwarder.data.models.ForwardingRule

@Dao
interface RuleDao {
    @Query("SELECT * FROM forwarding_rules ORDER BY createdAt DESC")
    fun getAllRules(): LiveData<List<ForwardingRule>>

    @Query("SELECT * FROM forwarding_rules WHERE isEnabled = 1")
    fun getEnabledRules(): List<ForwardingRule>

    @Query("SELECT * FROM forwarding_rules WHERE id = :id")
    suspend fun getRuleById(id: Long): ForwardingRule?

    @Insert
    suspend fun insertRule(rule: ForwardingRule): Long

    @Update
    suspend fun updateRule(rule: ForwardingRule)

    @Delete
    suspend fun deleteRule(rule: ForwardingRule)

    @Query("UPDATE forwarding_rules SET isEnabled = :isEnabled WHERE id = :id")
    suspend fun toggleRule(id: Long, isEnabled: Boolean)
}
