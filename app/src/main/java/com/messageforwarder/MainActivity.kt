package com.messageforwarder

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.messageforwarder.ui.rules.RuleListFragment
import com.messageforwarder.ui.settings.SettingsFragment

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        setupBottomNavigation()

        if (savedInstanceState == null) {
            // Load the default fragment
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, RuleListFragment())
                .commit()
        }
    }

    private fun setupBottomNavigation() {
        val bottomNav = findViewById<BottomNavigationView>(R.id.bottom_navigation)
        bottomNav.setOnItemSelectedListener { item ->
            val fragment: Fragment = when (item.itemId) {
                R.id.nav_rules -> RuleListFragment()
                R.id.nav_messages -> RuleListFragment() // TODO: Create MessagesFragment
                R.id.nav_settings -> SettingsFragment()
                else -> RuleListFragment()
            }
            
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commit()
            
            true
        }
    }
}