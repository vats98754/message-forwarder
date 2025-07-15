package com.messageforwarder.data.repositories

import androidx.lifecycle.LiveData
import com.messageforwarder.MessageForwarderApplication
import com.messageforwarder.data.models.ForwardingRule
import com.messageforwarder.data.models.Message
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class RuleRepository {
    private val ruleDao = MessageForwarderApplication.instance.database.ruleDao()
    private val messageDao = MessageForwarderApplication.instance.database.messageDao()

    fun getAllRules(): LiveData<List<ForwardingRule>> = ruleDao.getAllRules()

    suspend fun getEnabledRules(): List<ForwardingRule> = withContext(Dispatchers.IO) {
        ruleDao.getEnabledRules()
    }

    suspend fun insertRule(rule: ForwardingRule): Long = withContext(Dispatchers.IO) {
        ruleDao.insertRule(rule)
    }

    suspend fun updateRule(rule: ForwardingRule) = withContext(Dispatchers.IO) {
        ruleDao.updateRule(rule.copy(updatedAt = System.currentTimeMillis()))
    }

    suspend fun deleteRule(rule: ForwardingRule) = withContext(Dispatchers.IO) {
        ruleDao.deleteRule(rule)
    }

    suspend fun toggleRule(id: Long, isEnabled: Boolean) = withContext(Dispatchers.IO) {
        ruleDao.toggleRule(id, isEnabled)
    }

    suspend fun getRuleById(id: Long): ForwardingRule? = withContext(Dispatchers.IO) {
        ruleDao.getRuleById(id)
    }

    // Message related methods
    fun getRecentMessages(): LiveData<List<Message>> = messageDao.getRecentMessages()

    fun getForwardedMessages(): LiveData<List<Message>> = messageDao.getForwardedMessages()

    suspend fun insertMessage(message: Message): Long = withContext(Dispatchers.IO) {
        messageDao.insertMessage(message)
    }

    suspend fun updateMessage(message: Message) = withContext(Dispatchers.IO) {
        messageDao.updateMessage(message)
    }

    fun getForwardedCount(): LiveData<Int> = messageDao.getForwardedCount()
}