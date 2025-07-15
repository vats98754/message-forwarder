package com.messageforwarder.ui.rules

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.chip.Chip
import com.google.android.material.materialswitch.MaterialSwitch
import com.messageforwarder.R
import com.messageforwarder.data.models.ForwardingRule
import com.messageforwarder.data.models.MessageSource

class RuleAdapter(
    private val onRuleAction: (ForwardingRule, Action) -> Unit
) : ListAdapter<ForwardingRule, RuleAdapter.RuleViewHolder>(RuleDiffCallback()) {

    enum class Action { TOGGLE, EDIT, DELETE }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RuleViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_rule, parent, false)
        return RuleViewHolder(view)
    }

    override fun onBindViewHolder(holder: RuleViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class RuleViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val ruleName: TextView = itemView.findViewById(R.id.rule_name)
        private val ruleDescription: TextView = itemView.findViewById(R.id.rule_description)
        private val sourceChip: Chip = itemView.findViewById(R.id.source_chip)
        private val filtersText: TextView = itemView.findViewById(R.id.filters_text)
        private val enabledSwitch: MaterialSwitch = itemView.findViewById(R.id.rule_enabled_switch)

        fun bind(rule: ForwardingRule) {
            ruleName.text = rule.name
            
            // Build description
            val destinations = mutableListOf<String>()
            rule.forwardToEmail?.let { destinations.add("Email") }
            rule.forwardToWebhook?.let { destinations.add("Webhook") }
            rule.forwardToTelegram?.let { destinations.add("Telegram") }
            
            ruleDescription.text = "${rule.sourceType.getDisplayName()} → ${destinations.joinToString(", ")}"
            
            // Set source chip
            sourceChip.text = rule.sourceType.getDisplayName()
            
            // Set filters text
            val filters = mutableListOf<String>()
            rule.senderFilter?.let { filters.add("Sender: $it") }
            rule.keywordFilter?.let { filters.add("Keywords: $it") }
            
            filtersText.text = if (filters.isNotEmpty()) {
                "Filters: ${filters.joinToString(", ")}"
            } else {
                "No filters"
            }
            
            // Set switch state
            enabledSwitch.isChecked = rule.isEnabled
            enabledSwitch.setOnCheckedChangeListener { _, isChecked ->
                onRuleAction(rule, Action.TOGGLE)
            }
            
            // Set click listeners
            itemView.setOnClickListener {
                onRuleAction(rule, Action.EDIT)
            }
            
            itemView.setOnLongClickListener {
                onRuleAction(rule, Action.DELETE)
                true
            }
        }
    }
}

class RuleDiffCallback : DiffUtil.ItemCallback<ForwardingRule>() {
    override fun areItemsTheSame(oldItem: ForwardingRule, newItem: ForwardingRule): Boolean {
        return oldItem.id == newItem.id
    }

    override fun areContentsTheSame(oldItem: ForwardingRule, newItem: ForwardingRule): Boolean {
        return oldItem == newItem
    }
}

private fun MessageSource.getDisplayName(): String = when (this) {
    MessageSource.SMS -> "SMS"
    MessageSource.MMS -> "MMS"
    MessageSource.EMAIL -> "Email"
    MessageSource.WHATSAPP -> "WhatsApp"
    MessageSource.TELEGRAM -> "Telegram"
    MessageSource.INSTAGRAM -> "Instagram"
    MessageSource.FACEBOOK_MESSENGER -> "Messenger"
    MessageSource.DISCORD -> "Discord"
    MessageSource.SLACK -> "Slack"
    MessageSource.ALL_NOTIFICATIONS -> "All Apps"
}
