package com.messageforwarder.ui.rules

import androidx.lifecycle.LiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.messageforwarder.data.models.ForwardingRule
import com.messageforwarder.data.repositories.RuleRepository
import kotlinx.coroutines.launch

class RuleListViewModel : ViewModel() {
    private val repository = RuleRepository()

    val rules: LiveData<List<ForwardingRule>> = repository.getAllRules()
    val forwardedCount: LiveData<Int> = repository.getForwardedCount()

    fun toggleRule(id: Long, isEnabled: Boolean) {
        viewModelScope.launch {
            repository.toggleRule(id, isEnabled)
        }
    }

    fun deleteRule(rule: ForwardingRule) {
        viewModelScope.launch {
            repository.deleteRule(rule)
        }
    }

    fun refreshData() {
        // Data is automatically refreshed via LiveData
    }
}
