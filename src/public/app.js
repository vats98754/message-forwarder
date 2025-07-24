// Enhanced Message Forwarder Frontend - Full Functionality
document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
  setupEventListeners();
  await loadServices();
  await checkAuthStatus();
  await loadRoutes();
  handleOAuthCallback(); // Handle OAuth callbacks
});

// Check if we're in demo mode (GitHub Pages)
const isDemoMode = !window.location.hostname.includes('localhost') && 
                   !window.location.hostname.includes('127.0.0.1');

// Global state
let currentUser = null;
let services = [];
let routes = [];

function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const connected = urlParams.get('connected');
  const error = urlParams.get('error');
  
  if (connected) {
    showNotification(`Successfully connected to ${connected}!`, 'success');
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    // Reload services and auth status
    setTimeout(() => {
      loadServices();
      checkAuthStatus();
    }, 1000);
  } else if (error) {
    showNotification(`Connection failed: ${error}`, 'error');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 glass p-4 rounded-lg max-w-sm ${
    type === 'success' ? 'border-green-400 text-green-300' :
    type === 'error' ? 'border-red-400 text-red-300' :
    'border-orange-400 text-orange-300'
  }`;
  notification.innerHTML = `
    <div class="flex items-center">
      <span class="mr-2">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${message}</span>
      <button class="ml-4 text-gray-400 hover:text-white" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

async function initializeApp() {
  console.log('Message Forge initialized with enhanced functionality');
  
  if (isDemoMode) {
    const banner = document.createElement('div');
    banner.className = 'glass rounded-lg p-4 mb-6 border border-orange-400';
    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">🚀</span>
        <div>
          <h3 class="text-orange-400 font-bold">Demo Mode</h3>
          <p class="text-sm text-gray-300">This is a demonstration. For full functionality, <a href="https://github.com/vats98754/message-forwarder" class="text-orange-400 hover:underline">clone and run locally</a>.</p>
        </div>
      </div>
    `;
    document.querySelector('.container').insertBefore(banner, document.querySelector('header'));
  }
}

function setupEventListeners() {
  // Auth button
  document.getElementById('auth-btn')?.addEventListener('click', handleAuth);
  
  // Logout button  
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

  // Global click handler for dynamic elements
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('service-connect')) {
      const serviceName = e.target.dataset.service;
      showServiceConfigModal(serviceName);
    }
    
    if (e.target.classList.contains('service-test')) {
      const serviceName = e.target.dataset.service;
      testService(serviceName);
    }
    
    if (e.target.id === 'create-route-btn') {
      showCreateRouteModal();
    }
    
    if (e.target.classList.contains('delete-route')) {
      const routeId = e.target.dataset.routeId;
      deleteRoute(routeId);
    }
    
    if (e.target.id === 'modal-close' || e.target.classList.contains('modal-backdrop')) {
      closeModal();
    }
  });

  // Test message form
  document.getElementById('test-form')?.addEventListener('submit', handleTestMessage);
}

async function handleAuth() {
  if (isDemoMode) {
    alert('Authentication is not available in demo mode. Clone the repo and run locally!');
    return;
  }
  window.location.href = '/auth/google';
}

async function handleLogout() {
  if (isDemoMode) return;
  window.location.href = '/logout';
}

async function checkAuthStatus() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    
    currentUser = data.authenticated ? data.user : null;
    
    if (data.connections) {
      // Update connected services from auth manager
      data.connections.forEach(conn => {
        const service = services.find(s => s.name.toLowerCase() === conn.type.toLowerCase());
        if (service) {
          service.connected = conn.connected;
        }
      });
      updateServicesUI();
    }
    
    updateAuthUI(data);
  } catch (error) {
    console.error('Failed to check auth status:', error);
    if (!isDemoMode) {
      updateAuthUI({ authenticated: false });
    }
  }
}

function updateAuthUI(data) {
  const authBtn = document.getElementById('auth-btn');
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');
  
  if (data.authenticated && data.user) {
    authBtn.classList.add('hidden');
    userInfo.classList.remove('hidden');
    userName.textContent = data.user.name || data.user.email || 'User';
  } else {
    authBtn.classList.remove('hidden');
    userInfo.classList.add('hidden');
  }
}

async function loadServices() {
  try {
    if (isDemoMode) {
      services = [
        { name: 'Email', enabled: false, connected: false },
        { name: 'SMS', enabled: false, connected: false },
        { name: 'Discord', enabled: false, connected: false },
        { name: 'Telegram', enabled: false, connected: false },
        { name: 'Slack', enabled: false, connected: false },
        { name: 'Textbelt', enabled: false, connected: false }
      ];
    } else {
      const response = await fetch('/api/services');
      services = await response.json();
    }
    
    updateServicesUI();
  } catch (error) {
    console.error('Failed to load services:', error);
  }
}

function updateServicesUI() {
  const servicesGrid = document.getElementById('services-grid');
  if (!servicesGrid) return;
  
  servicesGrid.innerHTML = '';
  
  services.forEach(service => {
    const serviceCard = document.createElement('div');
    serviceCard.className = `service-card glass rounded-lg p-4 border ${
      service.connected ? 'border-orange-400' : 'border-gray-600'
    }`;
    
    const statusIcon = service.connected ? '✅' : service.enabled ? '⚠️' : '❌';
    const statusText = service.connected ? 'Connected' : service.enabled ? 'Configured' : 'Not Connected';
    const statusColor = service.connected ? 'text-green-400' : service.enabled ? 'text-yellow-400' : 'text-gray-400';
    
    serviceCard.innerHTML = `
      <div class="text-center">
        <div class="text-3xl mb-2">${getServiceIcon(service.name)}</div>
        <h3 class="font-semibold text-white mb-1">${service.name}</h3>
        <div class="flex items-center justify-center gap-1 mb-3">
          <span>${statusIcon}</span>
          <span class="text-xs ${statusColor}">${statusText}</span>
        </div>
        <div class="space-y-2">
          <button class="service-connect w-full px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600 rounded transition" 
                  data-service="${service.name}">
            ${service.connected ? 'Reconfigure' : 'Connect'}
          </button>
          ${service.enabled ? `
            <button class="service-test w-full px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 rounded transition" 
                    data-service="${service.name}">
              Test
            </button>
          ` : ''}
        </div>
      </div>
    `;
    
    servicesGrid.appendChild(serviceCard);
  });
  
  updateServiceSelects();
}

function getServiceIcon(serviceName) {
  const icons = {
    'Email': '📧',
    'SMS': '📱',
    'Discord': '🎮',
    'Telegram': '✈️',
    'Slack': '💬',
    'Textbelt': '📲'
  };
  return icons[serviceName] || '🔗';
}

function updateServiceSelects() {
  const selects = [
    document.getElementById('test-service'),
    document.getElementById('source-service'), 
    document.getElementById('target-service')
  ];
  
  selects.forEach(select => {
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select a service...</option>';
    
    services.filter(s => s.connected).forEach(service => {
      const option = document.createElement('option');
      option.value = service.name;
      option.textContent = service.name;
      if (option.value === currentValue) option.selected = true;
      select.appendChild(option);
    });
  });
}

async function showServiceConfigModal(serviceName) {
  if (isDemoMode) {
    alert(`Demo: Would connect to ${serviceName}. Run locally for real OAuth!`);
    return;
  }

  // OAuth services - redirect to OAuth flow
  const oauthServices = ['Discord', 'Google', 'Slack'];
  if (oauthServices.includes(serviceName)) {
    const confirmed = confirm(`Connect to ${serviceName} using OAuth?`);
    if (confirmed) {
      window.location.href = `/auth/${serviceName.toLowerCase()}`;
    }
    return;
  }

  // Manual configuration services
  try {
    const response = await fetch(`/api/services/${serviceName}/config`);
    const configReq = await response.json();
    showModal(`Configure ${serviceName}`, createServiceConfigForm(serviceName, configReq));
  } catch (error) {
    console.error('Failed to get service config:', error);
    showNotification('Failed to load service configuration', 'error');
  }
}

function getDemoServiceConfig(serviceName) {
  const configs = {
    'Email': {
      fields: [
        { name: 'host', type: 'text', label: 'SMTP Host', required: true, placeholder: 'smtp.gmail.com' },
        { name: 'port', type: 'number', label: 'SMTP Port', required: true, placeholder: '587' },
        { name: 'user', type: 'email', label: 'Email Address', required: true },
        { name: 'pass', type: 'password', label: 'Password', required: true },
        { name: 'to', type: 'email', label: 'Forward To Email', required: true }
      ],
      instructions: 'Enter your SMTP credentials to enable email forwarding.'
    },
    'SMS': {
      fields: [
        { name: 'accountSid', type: 'text', label: 'Account SID', required: true },
        { name: 'authToken', type: 'password', label: 'Auth Token', required: true },
        { name: 'fromNumber', type: 'tel', label: 'From Number', required: true },
        { name: 'to', type: 'tel', label: 'Forward To Number', required: true }
      ],
      instructions: 'Enter your Twilio credentials for SMS forwarding.'
    },
    'Discord': {
      fields: [
        { name: 'botToken', type: 'password', label: 'Bot Token', required: true },
        { name: 'channelId', type: 'text', label: 'Channel ID', required: true }
      ],
      instructions: 'Create a Discord bot and get the token and channel ID.'
    },
    'Telegram': {
      fields: [
        { name: 'botToken', type: 'password', label: 'Bot Token', required: true },
        { name: 'chatId', type: 'text', label: 'Chat ID', required: true }
      ],
      instructions: 'Create a Telegram bot with @BotFather and get the chat ID.'
    },
    'Slack': {
      fields: [
        { name: 'botToken', type: 'password', label: 'Bot Token', required: true },
        { name: 'channel', type: 'text', label: 'Channel', required: true }
      ],
      instructions: 'Create a Slack app and get the bot token.'
    },
    'Textbelt': {
      fields: [
        { name: 'apiKey', type: 'password', label: 'API Key', required: true },
        { name: 'to', type: 'tel', label: 'Forward To Number', required: true }
      ],
      instructions: 'Get an API key from textbelt.com.'
    }
  };
  
  return configs[serviceName] || { fields: [], instructions: 'Configuration not available in demo mode.' };
}

function createServiceConfigForm(serviceName, config) {
  return `
    <form id="service-config-form" class="space-y-4">
      <div class="text-sm text-gray-300 bg-gray-800 p-3 rounded">
        ${config.instructions || 'Configure this service by filling out the form below.'}
      </div>
      
      ${config.fields.map(field => `
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">
            ${field.label} ${field.required ? '*' : ''}
          </label>
          <input 
            type="${field.type}" 
            name="${field.name}" 
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
            class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-orange-400 focus:outline-none text-white"
          />
        </div>
      `).join('')}
      
      <div class="flex gap-3 pt-4">
        <button type="submit" class="flex-1 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded font-medium transition">
          ${isDemoMode ? 'Demo Connect' : 'Connect & Test'}
        </button>
        <button type="button" id="modal-close" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition">
          Cancel
        </button>
      </div>
    </form>
  `;
}

function showModal(title, content) {
  const modal = document.createElement('div');
  modal.id = 'modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop';
  
  modal.innerHTML = `
    <div class="glass rounded-lg p-6 max-w-md w-full mx-4 border border-orange-400" onclick="event.stopPropagation()">
      <h2 class="text-xl font-bold text-orange-400 mb-4">${title}</h2>
      ${content}
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle form submission
  const form = modal.querySelector('#service-config-form');
  if (form) {
    form.addEventListener('submit', handleServiceConfig);
  }
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.remove();
  }
}

async function handleServiceConfig(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  const serviceName = document.querySelector('[data-service]')?.dataset.service || 
                     document.querySelector('.service-connect')?.dataset.service;
  
  const config = {};
  for (const [key, value] of formData.entries()) {
    config[key] = value;
  }
  
  try {
    if (isDemoMode) {
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      const service = services.find(s => s.name === serviceName);
      if (service) {
        service.enabled = true;
        service.connected = true;
      }
      updateServicesUI();
      closeModal();
      alert(`Demo: ${serviceName} connected successfully!`);
    } else {
      const response = await fetch(`/api/services/${serviceName}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadServices(); // Reload services to get updated status
        closeModal();
        alert(`${serviceName} connected successfully!`);
      } else {
        alert(`Failed to connect ${serviceName}: ${result.error}`);
      }
    }
  } catch (error) {
    console.error('Service connection error:', error);
    alert(`Failed to connect ${serviceName}: ${error.message}`);
  }
}

async function testService(serviceName) {
  try {
    if (isDemoMode) {
      alert(`Demo: Testing ${serviceName} - Connection OK!`);
      return;
    }
    
    const response = await fetch(`/api/services/${serviceName}/test`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`${serviceName} test successful!`);
    } else {
      alert(`${serviceName} test failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Service test error:', error);
    alert(`Failed to test ${serviceName}: ${error.message}`);
  }
}

async function handleTestMessage(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const service = formData.get('test-service');
  const message = formData.get('test-message');
  
  if (!service || !message) {
    alert('Please select a service and enter a message');
    return;
  }
  
  try {
    if (isDemoMode) {
      alert(`Demo: Would send "${message}" to ${service}`);
      return;
    }
    
    const response = await fetch(`/api/forward/${service}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        from: 'Test Interface'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`Test message sent to ${service}!`);
      e.target.reset();
    } else {
      alert(`Failed to send to ${service}: ${result.error}`);
    }
  } catch (error) {
    console.error('Test message error:', error);
    alert(`Failed to send test message: ${error.message}`);
  }
}

function showCreateRouteModal() {
  const connectedServices = services.filter(s => s.connected);
  
  if (connectedServices.length < 2) {
    alert('You need at least 2 connected services to create a route');
    return;
  }
  
  const serviceOptions = connectedServices.map(s => 
    `<option value="${s.name}">${s.name}</option>`
  ).join('');
  
  const content = `
    <form id="route-create-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Source Service *</label>
        <select name="source" required class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-orange-400 focus:outline-none text-white">
          <option value="">Select source...</option>
          ${serviceOptions}
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Target Service *</label>
        <select name="target" required class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-orange-400 focus:outline-none text-white">
          <option value="">Select target...</option>
          ${serviceOptions}
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Filter (optional)</label>
        <input 
          type="text" 
          name="filter" 
          placeholder="Only forward messages containing this text"
          class="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:border-orange-400 focus:outline-none text-white"
        />
      </div>
      
      <div class="flex gap-3 pt-4">
        <button type="submit" class="flex-1 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded font-medium transition">
          Create Route
        </button>
        <button type="button" id="modal-close" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition">
          Cancel
        </button>
      </div>
    </form>
  `;
  
  showModal('Create New Route', content);
  
  // Handle form submission
  const form = document.querySelector('#route-create-form');
  if (form) {
    form.addEventListener('submit', handleCreateRoute);
  }
}

async function handleCreateRoute(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const routeData = {
    from: formData.get('source'),
    to: formData.get('target'),
    enabled: true
  };
  
  if (routeData.from === routeData.to) {
    showNotification('Source and target services cannot be the same', 'error');
    return;
  }
  
  try {
    if (isDemoMode) {
      const newRoute = {
        id: Date.now().toString(),
        from: routeData.from,
        to: routeData.to,
        enabled: true,
        createdAt: new Date()
      };
      routes.push(newRoute);
      updateRoutesUI();
      closeModal();
      showNotification('Demo: Route created successfully!', 'success');
    } else {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadRoutes();
        closeModal();
        showNotification('Route created successfully!', 'success');
      } else {
        showNotification(`Failed to create route: ${result.error}`, 'error');
      }
    }
  } catch (error) {
    console.error('Route creation error:', error);
    showNotification(`Failed to create route: ${error.message}`, 'error');
  }
}

async function loadRoutes() {
  try {
    if (isDemoMode) {
      routes = routes || [];
    } else {
      const response = await fetch('/api/routes');
      const data = await response.json();
      routes = data.routes || [];
    }
    
    updateRoutesUI();
  } catch (error) {
    console.error('Failed to load routes:', error);
  }
}

function updateRoutesUI() {
  const routesList = document.getElementById('routes-list');
  if (!routesList) return;
  
  if (routes.length === 0) {
    routesList.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <p>No routes configured yet</p>
        <button id="create-route-btn" class="mt-4 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded transition">
          Create First Route
        </button>
      </div>
    `;
    return;
  }
  
  routesList.innerHTML = routes.map(route => `
    <div class="glass rounded-lg p-4 border border-gray-600">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-blue-400 font-medium">${route.from}</span>
          <span class="text-gray-400">→</span>
          <span class="text-green-400 font-medium">${route.to}</span>
          <span class="text-xs ${route.enabled ? 'bg-green-500' : 'bg-gray-500'} px-2 py-1 rounded">
            ${route.enabled ? 'Active' : 'Disabled'}
          </span>
        </div>
        <button class="delete-route text-red-400 hover:text-red-300 transition" data-route-id="${route.id}">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

async function deleteRoute(routeId) {
  if (!confirm('Are you sure you want to delete this route?')) return;
  
  try {
    if (isDemoMode) {
      routes = routes.filter(r => r.id !== routeId);
      updateRoutesUI();
      showNotification('Demo: Route deleted successfully!', 'success');
    } else {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadRoutes();
        showNotification('Route deleted successfully!', 'success');
      } else {
        showNotification(`Failed to delete route: ${result.error}`, 'error');
      }
    }
  } catch (error) {
    console.error('Route deletion error:', error);
    showNotification(`Failed to delete route: ${error.message}`, 'error');
  }
}
