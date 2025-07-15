package com.messageforwarder.ui.settings

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.google.android.material.card.MaterialCardView
import com.messageforwarder.R
import android.widget.TextView

class SettingsFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_settings, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupVersionInfo(view)
        setupClickListeners(view)
    }

    private fun setupVersionInfo(view: View) {
        val versionText = view.findViewById<TextView>(R.id.version_text)
        versionText.text = "Version 1.0.0 (1)"
    }

    private fun setupClickListeners(view: View) {
        view.findViewById<MaterialCardView>(R.id.github_card).setOnClickListener {
            openUrl("https://github.com/yourusername/message-forwarder")
        }
        
        view.findViewById<MaterialCardView>(R.id.privacy_card).setOnClickListener {
            openUrl("https://github.com/yourusername/message-forwarder/blob/main/PRIVACY.md")
        }
        
        view.findViewById<MaterialCardView>(R.id.licenses_card).setOnClickListener {
            // TODO: Implement open source licenses dialog
        }
    }

    private fun openUrl(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        startActivity(intent)
    }
}