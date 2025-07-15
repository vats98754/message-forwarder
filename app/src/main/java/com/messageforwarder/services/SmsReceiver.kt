package com.messageforwarder.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.messageforwarder.data.models.Message
import com.messageforwarder.data.models.MessageSource
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val smsMessages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            
            for (sms in smsMessages) {
                val message = Message(
                    sender = sms.originatingAddress ?: "Unknown",
                    content = sms.messageBody ?: "",
                    timestamp = System.currentTimeMillis(),
                    messageType = MessageSource.SMS
                )
                
                CoroutineScope(Dispatchers.IO).launch {
                    ForwardingService.processMessage(context, message)
                }
            }
        }
    }
}
