package com.messageforwarder.ui.rules

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import androi        val sourceType = when (sourceChipGroup.checkedChipId) {
            R.id.chip_sms -> MessageSource.SMS
            R.id.chip_whatsapp -> MessageSource.WHATSAPP
            R.id.chip_telegram -> MessageSource.TELEGRAM
            R.id.chip_email -> MessageSource.EMAIL
            R.id.chip_all -> MessageSource.ALL_NOTIFICATIONS
            else -> MessageSource.SMS
        }ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.google.android.material.button.MaterialButton
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.google.android.material.materialswitch.MaterialSwitch
import com.google.android.material.textfield.TextInputEditText
import com.messageforwarder.R
import com.messageforwarder.data.models.ForwardingRule
import com.messageforwarder.data.models.MessageSource

class RuleEditFragment : Fragment() {

    private lateinit var viewModel: RuleEditViewModel
    private var ruleId: Long? = null

    // Views
    private lateinit var ruleNameInput: TextInputEditText
    private lateinit var sourceChipGroup: ChipGroup
    private lateinit var senderFilterInput: TextInputEditText
    private lateinit var keywordsInput: TextInputEditText
    private lateinit var emailInput: TextInputEditText
    private lateinit var webhookInput: TextInputEditText
    private lateinit var telegramInput: TextInputEditText
    private lateinit var includeSenderSwitch: MaterialSwitch
    private lateinit var saveRuleBtn: MaterialButton

    companion object {
        private const val ARG_RULE_ID = "rule_id"

        fun newInstance(ruleId: Long?): RuleEditFragment {
            val fragment = RuleEditFragment()
            val args = Bundle()
            ruleId?.let { args.putLong(ARG_RULE_ID, it) }
            fragment.arguments = args
            return fragment
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ruleId = arguments?.getLong(ARG_RULE_ID)?.takeIf { it != 0L }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_rule_edit, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        initializeViews(view)
        initializeViewModel()
        setupClickListeners()
        
        ruleId?.let { id ->
            viewModel.loadRule(id)
            observeRule()
        } ?: run {
            // Select SMS by default for new rules
            view.findViewById<Chip>(R.id.chip_sms).isChecked = true
        }
    }

    private fun initializeViews(view: View) {
        ruleNameInput = view.findViewById(R.id.rule_name_input)
        sourceChipGroup = view.findViewById(R.id.source_chip_group)
        senderFilterInput = view.findViewById(R.id.sender_filter_input)
        keywordsInput = view.findViewById(R.id.keywords_input)
        emailInput = view.findViewById(R.id.email_input)
        webhookInput = view.findViewById(R.id.webhook_input)
        telegramInput = view.findViewById(R.id.telegram_input)
        includeSenderSwitch = view.findViewById(R.id.include_sender_switch)
        saveRuleBtn = view.findViewById(R.id.save_rule_btn)
    }

    private fun initializeViewModel() {
        viewModel = ViewModelProvider(this)[RuleEditViewModel::class.java]
    }

    private fun setupClickListeners() {
        saveRuleBtn.setOnClickListener {
            saveRule()
        }
    }

    private fun observeRule() {
        viewModel.currentRule.observe(viewLifecycleOwner) { rule ->
            rule?.let { populateFields(it) }
        }
    }

    private fun populateFields(rule: ForwardingRule) {
        ruleNameInput.setText(rule.name)
        
        // Set source selection
        val chipId = when (rule.sourceType) {
            MessageSource.SMS -> R.id.chip_sms
            MessageSource.WHATSAPP -> R.id.chip_whatsapp
            MessageSource.TELEGRAM -> R.id.chip_telegram
            MessageSource.ALL_NOTIFICATIONS -> R.id.chip_all
            else -> R.id.chip_sms
        }
        requireView().findViewById<Chip>(chipId).isChecked = true
        
        senderFilterInput.setText(rule.senderFilter ?: "")
        keywordsInput.setText(rule.keywordFilter ?: "")
        emailInput.setText(rule.forwardToEmail ?: "")
        webhookInput.setText(rule.forwardToWebhook ?: "")
        telegramInput.setText(rule.forwardToTelegram ?: "")
        includeSenderSwitch.isChecked = rule.includeOriginalSender
    }

    private fun saveRule() {
        val name = ruleNameInput.text?.toString()?.trim()
        if (name.isNullOrEmpty()) {
            Toast.makeText(context, "Please enter a rule name", Toast.LENGTH_SHORT).show()
            return
        }

        val selectedSourceId = sourceChipGroup.checkedChipId
        if (selectedSourceId == View.NO_ID) {
            Toast.makeText(context, "Please select a message source", Toast.LENGTH_SHORT).show()
            return
        }

        val sourceType = when (selectedSourceId) {
            R.id.chip_sms -> MessageSource.SMS
            R.id.chip_whatsapp -> MessageSource.WHATSAPP
            R.id.chip_telegram -> MessageSource.TELEGRAM
            R.id.chip_all -> MessageSource.ALL_NOTIFICATIONS
            else -> MessageSource.SMS
        }

        val email = emailInput.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }
        val webhook = webhookInput.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }
        val telegram = telegramInput.text?.toString()?.trim()?.takeIf { it.isNotEmpty() }

        if (email == null && webhook == null && telegram == null) {
            Toast.makeText(context, "Please specify at least one forwarding destination", Toast.LENGTH_SHORT).show()
            return
        }

        val rule = ForwardingRule(
            id = ruleId ?: 0,
            name = name,
            sourceType = sourceType,
            senderFilter = senderFilterInput.text?.toString()?.trim()?.takeIf { it.isNotEmpty() },
            keywordFilter = keywordsInput.text?.toString()?.trim()?.takeIf { it.isNotEmpty() },
            forwardToEmail = email,
            forwardToWebhook = webhook,
            forwardToTelegram = telegram,
            includeOriginalSender = includeSenderSwitch.isChecked
        )

        viewModel.saveRule(rule) { success ->
            if (success) {
                Toast.makeText(context, getString(R.string.rule_saved), Toast.LENGTH_SHORT).show()
                parentFragmentManager.popBackStack()
            } else {
                Toast.makeText(context, "Failed to save rule", Toast.LENGTH_SHORT).show()
            }
        }
    }
}