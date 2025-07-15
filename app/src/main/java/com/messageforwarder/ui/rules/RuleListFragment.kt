package com.messageforwarder.ui.rules

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.card.MaterialCardView
import com.google.android.material.snackbar.Snackbar
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import android.widget.TextView
import com.messageforwarder.R
import com.messageforwarder.data.models.ForwardingRule
import com.messageforwarder.utils.PermissionHandler

class RuleListFragment : Fragment() {

    private lateinit var viewModel: RuleListViewModel
    private lateinit var adapter: RuleAdapter
    private lateinit var permissionHandler: PermissionHandler
    
    private lateinit var recyclerView: RecyclerView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var permissionCard: MaterialCardView
    private lateinit var permissionStatus: TextView
    private lateinit var setupPermissionsBtn: MaterialButton
    private lateinit var rulesCount: TextView
    private lateinit var forwardedCount: TextView
    private lateinit var fabAddRule: FloatingActionButton
    private lateinit var emptyState: LinearLayout
    private lateinit var createFirstRuleBtn: MaterialButton

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_rule_list, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        initializeViews(view)
        initializeViewModel()
        setupRecyclerView()
        setupPermissionHandling()
        setupClickListeners()
        observeData()
        
        checkPermissions()
    }

    private fun initializeViews(view: View) {
        recyclerView = view.findViewById(R.id.rules_recycler_view)
        swipeRefresh = view.findViewById(R.id.swipe_refresh)
        permissionCard = view.findViewById(R.id.permission_card)
        permissionStatus = view.findViewById(R.id.permission_status)
        setupPermissionsBtn = view.findViewById(R.id.setup_permissions_btn)
        rulesCount = view.findViewById(R.id.rules_count)
        forwardedCount = view.findViewById(R.id.forwarded_count)
        fabAddRule = view.findViewById(R.id.fab_add_rule)
        emptyState = view.findViewById(R.id.empty_state)
        createFirstRuleBtn = view.findViewById(R.id.create_first_rule_btn)
    }

    private fun initializeViewModel() {
        viewModel = ViewModelProvider(this)[RuleListViewModel::class.java]
        permissionHandler = PermissionHandler(requireActivity())
    }

    private fun setupRecyclerView() {
        adapter = RuleAdapter { rule, action ->
            when (action) {
                RuleAdapter.Action.TOGGLE -> {
                    viewModel.toggleRule(rule.id, !rule.isEnabled)
                }
                RuleAdapter.Action.EDIT -> {
                    openRuleEdit(rule.id)
                }
                RuleAdapter.Action.DELETE -> {
                    viewModel.deleteRule(rule)
                    Snackbar.make(requireView(), "Rule deleted", Snackbar.LENGTH_SHORT).show()
                }
            }
        }
        
        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = adapter
    }

    private fun setupPermissionHandling() {
        setupPermissionsBtn.setOnClickListener {
            if (!permissionHandler.hasAllPermissions()) {
                permissionHandler.requestAllPermissions { granted ->
                    if (granted) {
                        checkNotificationPermission()
                    } else {
                        permissionHandler.openAppSettings()
                    }
                }
            } else {
                checkNotificationPermission()
            }
        }
    }

    private fun checkNotificationPermission() {
        if (!permissionHandler.isNotificationListenerEnabled()) {
            permissionHandler.requestNotificationListenerPermission()
        } else {
            checkPermissions()
        }
    }

    private fun setupClickListeners() {
        fabAddRule.setOnClickListener {
            openRuleEdit(null)
        }
        
        createFirstRuleBtn.setOnClickListener {
            openRuleEdit(null)
        }
        
        swipeRefresh.setOnRefreshListener {
            viewModel.refreshData()
            swipeRefresh.isRefreshing = false
        }
    }

    private fun observeData() {
        viewModel.rules.observe(viewLifecycleOwner) { rules ->
            adapter.submitList(rules)
            rulesCount.text = rules.count { it.isEnabled }.toString()
            
            // Show/hide empty state
            if (rules.isEmpty()) {
                emptyState.visibility = View.VISIBLE
                recyclerView.visibility = View.GONE
                fabAddRule.hide()
            } else {
                emptyState.visibility = View.GONE
                recyclerView.visibility = View.VISIBLE
                fabAddRule.show()
            }
        }

        viewModel.forwardedCount.observe(viewLifecycleOwner) { count ->
            forwardedCount.text = count.toString()
        }
    }

    private fun checkPermissions() {
        val status = permissionHandler.getPermissionStatus()
        
        when {
            status.isFullyEnabled -> {
                permissionStatus.text = getString(R.string.all_permissions_granted)
                permissionCard.visibility = View.GONE
            }
            !status.hasBasicPermissions -> {
                permissionStatus.text = getString(R.string.permission_required)
                setupPermissionsBtn.text = getString(R.string.grant_permissions)
                permissionCard.visibility = View.VISIBLE
            }
            !status.hasNotificationAccess -> {
                permissionStatus.text = getString(R.string.notification_access_required)
                setupPermissionsBtn.text = getString(R.string.setup_notification_access)
                permissionCard.visibility = View.VISIBLE
            }
        }
    }

    private fun openRuleEdit(ruleId: Long?) {
        val fragment = RuleEditFragment.newInstance(ruleId)
        parentFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .addToBackStack(null)
            .commit()
    }

    override fun onResume() {
        super.onResume()
        checkPermissions()
    }
}