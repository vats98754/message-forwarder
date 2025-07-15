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

class MmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.WAP_PUSH_RECEIVED_ACTION) {
            val data = intent.getByteArrayExtra("data")
            val message = Message(
                sender = "MMS Sender", // MMS sender extraction is complex
                content = "MMS Message received",
                timestamp = System.currentTimeMillis(),
                messageType = MessageSource.MMS
            )
            
            CoroutineScope(Dispatchers.IO).launch {
                ForwardingService.processMessage(context, message)
            }
        }
    }
}
