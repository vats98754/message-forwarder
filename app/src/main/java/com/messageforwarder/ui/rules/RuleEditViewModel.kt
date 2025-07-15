package com.messageforwarder.ui.rules

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.messageforwarder.data.models.ForwardingRule
import com.messageforwarder.data.repositories.RuleRepository
import kotlinx.coroutines.launch

class RuleEditViewModel : ViewModel() {
    private val repository = RuleRepository()

    private val _currentRule = MutableLiveData<ForwardingRule?>()
    val currentRule: LiveData<ForwardingRule?> = _currentRule

    fun loadRule(id: Long) {
        viewModelScope.launch {
            val rule = repository.getRuleById(id)
            _currentRule.value = rule
        }
    }

    fun saveRule(rule: ForwardingRule, callback: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                if (rule.id == 0L) {
                    repository.insertRule(rule)
                } else {
                    repository.updateRule(rule)
                }
                callback(true)
            } catch (e: Exception) {
                callback(false)
            }
        }
    }
}
