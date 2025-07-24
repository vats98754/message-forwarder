// Modern Message Forwarder Frontend - Message Forge
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize the app
  await initializeApp();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load services status
  await loadServices();
  
  // Check authentication status
  await checkAuthStatus();
  
  // Load existing routes
  await loadRoutes();
});

// Check if we're in demo mode (GitHub Pages)
const isDemoMode = !window.location.hostname.includes('localhost') && 
                   !window.location.hostname.includes('127.0.0.1');

async function initializeApp() {
  console.log('Message Forge initialized');
  
  if (isDemoMode) {
    // Show demo banner with orange theme
    const banner = document.createElement('div');
    banner.className = 'glass rounded-lg p-4 mb-6 border border-orange-400';
    banner.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="text-orange-400">⚠️</span>
        <div>
          <h3 class="font-semibold text-orange-400">Demo Mode</h3>
          <p class="text-sm text-gray-300">This is a frontend demo. APIs are simulated.</p>
        </div>
      </div>
    `;
    document.querySelector('.container').insertBefore(banner, document.querySelector('header').nextSibling);
  }
}

async function loadServices() {
  try {
    let services;
    
    if (isDemoMode) {
      // Simulate services for demo
      services = [
        { name: 'Email', enabled: true },
        { name: 'SMS', enabled: false },
        { name: 'Discord', enabled: true },
        { name: 'Telegram', enabled: true },
        { name: 'Slack', enabled: false },
        { name: 'Textbelt', enabled: true }
      ];
    } else {
      const response = await fetch('/api/services');
      services = await response.json();
    }
    
    const servicesGrid = document.getElementById('services-grid');
    const testServiceSelect = document.getElementById('test-service');
    const sourceServiceSelect = document.getElementById('source-service');
    const targetServiceSelect = document.getElementById('target-service');
    
    // Clear existing content
    servicesGrid.innerHTML = '';
    testServiceSelect.innerHTML = '<option value="">Select a service...</option>';
    sourceServiceSelect.innerHTML = '<option value="">Select source service...</option>';
    targetServiceSelect.innerHTML = '<option value="">Select target service...</option>';
    
    services.forEach(service => {
      // Create service card with orange theme
      const serviceCard = document.createElement('div');
      serviceCard.className = `glass rounded-lg p-4 text-center transition-all hover:scale-105 ${
        service.enabled ? 'border-orange-400' : 'border-gray-600'
      }`;
      serviceCard.style.border = service.enabled ? '1px solid rgba(251, 146, 60, 0.5)' : '1px solid rgba(156, 163, 175, 0.5)';
      
      serviceCard.innerHTML = `
        <div class="flex flex-col items-center space-y-2">
          <div class="w-8 h-8 rounded-full ${
            service.enabled ? 'bg-orange-500' : 'bg-gray-500'
          } flex items-center justify-center">
            <span class="text-black font-bold text-sm">${service.name[0]}</span>
          </div>
          <span class="text-xs font-medium">${service.name}</span>
          <div class="w-2 h-2 rounded-full ${
            service.enabled ? 'bg-orange-500 animate-pulse' : 'bg-gray-500'
          }"></div>
        </div>
      `;
      servicesGrid.appendChild(serviceCard);
      
      // Add to all select dropdowns if enabled
      if (service.enabled) {
        const testOption = document.createElement('option');
        testOption.value = service.name;
        testOption.textContent = service.name;
        testServiceSelect.appendChild(testOption);
        
        const sourceOption = document.createElement('option');
        sourceOption.value = service.name;
        sourceOption.textContent = service.name;
        sourceServiceSelect.appendChild(sourceOption);
        
        const targetOption = document.createElement('option');
        targetOption.value = service.name;
        targetOption.textContent = service.name;
        targetServiceSelect.appendChild(targetOption);
      }
    });
  } catch (error) {
    console.error('Failed to load services:', error);
    showStatus('test-status', 'Failed to load services', 'error');
  }
}

async function checkAuthStatus() {
  try {
    let data;
    
    if (isDemoMode) {
      // Simulate authentication for demo
      data = { authenticated: false };
    } else {
      const response = await fetch('/api/user');
      data = await response.json();
    }
    
    const authBtn = document.getElementById('auth-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    
    if (data.authenticated) {
      authBtn.style.display = 'none';
      userInfo.classList.remove('hidden');
      userName.textContent = data.user?.profile?.displayName || 'User';
    } else {
      authBtn.style.display = 'block';
      userInfo.classList.add('hidden');
    }
  } catch (error) {
    console.error('Failed to check auth status:', error);
  }
}

function setupEventListeners() {
  // Auth button
  document.getElementById('auth-btn').addEventListener('click', () => {
    if (isDemoMode) {
      alert('Authentication is not available in demo mode. Clone the repo and run locally!');
    } else {
      window.location.href = '/auth/google';
    }
  });
  
  // Logout button
  document.getElementById('logout-btn').addEventListener('click', () => {
    if (!isDemoMode) {
      window.location.href = '/logout';
    }
  });
  
  // Service connection buttons
  const connectButtons = document.querySelectorAll('.connect-btn');
  connectButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const service = e.target.dataset.service;
      if (isDemoMode) {
        alert(`Demo: Would connect to ${service}. Run locally for real OAuth!`);
      } else {
        window.location.href = `/auth/${service.toLowerCase()}`;
      }
    });
  });
  
  // Route form
  document.getElementById('route-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const routeData = {
      source: formData.get('source-service'),
      target: formData.get('target-service'),
      filter: formData.get('filter') || null
    };
    
    try {
      let success;
      
      if (isDemoMode) {
        // Simulate route creation
        success = true;
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        const response = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(routeData)
        });
        success = response.ok;
      }
      
      if (success) {
        showStatus('route-status', 'Route created successfully!', 'success');
        e.target.reset();
        await loadRoutes();
      } else {
        showStatus('route-status', 'Failed to create route', 'error');
      }
    } catch (error) {
      console.error('Route creation failed:', error);
      showStatus('route-status', 'Error creating route', 'error');
    }
  });
  
  // Test form
  document.getElementById('test-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleTestSubmit();
  });
  
  // Broadcast form
  document.getElementById('broadcast-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleBroadcastSubmit();
  });
}

async function handleTestSubmit() {
  const from = document.getElementById('test-from').value;
  const message = document.getElementById('test-message').value;
  const service = document.getElementById('test-service').value;
  
  if (!from || !message || !service) {
    showStatus('test-status', 'Please fill in all fields', 'error');
    return;
  }
  
  showStatus('test-status', 'Sending...', 'info');
  
  if (isDemoMode) {
    // Simulate API call for demo
    setTimeout(() => {
      showStatus('test-status', `✅ Demo: Message would be sent to ${service}!`, 'success');
      document.getElementById('test-form').reset();
    }, 1000);
    return;
  }
  
  try {
    const response = await fetch(`/api/forward/${service}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, from })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showStatus('test-status', `✅ Message sent to ${service}!`, 'success');
      // Clear form
      document.getElementById('test-form').reset();
    } else {
      showStatus('test-status', `❌ ${result.error || 'Failed to send'}`, 'error');
    }
  } catch (error) {
    showStatus('test-status', '❌ Network error', 'error');
  }
}

async function handleBroadcastSubmit() {
  const from = document.getElementById('broadcast-from').value;
  const message = document.getElementById('broadcast-message').value;
  
  if (!from || !message) {
    showStatus('broadcast-status', 'Please fill in all fields', 'error');
    return;
  }
  
  showStatus('broadcast-status', 'Broadcasting...', 'info');
  
  if (isDemoMode) {
    // Simulate API call for demo
    setTimeout(() => {
      showStatus('broadcast-status', '✅ Demo: Broadcast would be sent to all services!', 'success');
      document.getElementById('broadcast-form').reset();
    }, 1500);
    return;
  }
  
  try {
    const response = await fetch('/api/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, from })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showStatus('broadcast-status', '✅ Broadcast sent to all services!', 'success');
      // Clear form
      document.getElementById('broadcast-form').reset();
    } else {
      showStatus('broadcast-status', `❌ ${result.error || 'Broadcast failed'}`, 'error');
    }
  } catch (error) {
    showStatus('broadcast-status', '❌ Network error', 'error');
  }
}

async function loadRoutes() {
  try {
    let routes;
    
    if (isDemoMode) {
      // Simulate routes for demo
      routes = [
        { id: '1', source: 'Email', target: 'Discord', filter: 'urgent' },
        { id: '2', source: 'Discord', target: 'Telegram', filter: null },
        { id: '3', source: 'Email', target: 'SMS', filter: 'emergency' }
      ];
    } else {
      const response = await fetch('/api/routes');
      routes = await response.json();
    }
    
    const routesList = document.getElementById('routes-list');
    
    // Clear existing content
    routesList.innerHTML = '';
    
    if (routes.length === 0) {
      routesList.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <span class="text-4xl">🔗</span>
          <p class="mt-2">No routes configured yet</p>
          <p class="text-sm">Create your first route above!</p>
        </div>
      `;
      return;
    }
    
    routes.forEach(route => {
      const routeCard = document.createElement('div');
      routeCard.className = 'glass rounded-lg p-4 flex items-center justify-between';
      
      routeCard.innerHTML = `
        <div class="flex items-center space-x-4">
          <div class="text-orange-400 font-semibold">${route.source}</div>
          <div class="text-gray-400">→</div>
          <div class="text-orange-400 font-semibold">${route.target}</div>
          ${route.filter ? `<div class="text-xs bg-orange-500 bg-opacity-20 text-orange-300 px-2 py-1 rounded">filter: ${route.filter}</div>` : ''}
        </div>
        <button onclick="deleteRoute('${route.id}')" class="text-red-400 hover:text-red-300 text-sm">✕</button>
      `;
      
      routesList.appendChild(routeCard);
    });
  } catch (error) {
    console.error('Failed to load routes:', error);
    showStatus('route-status', 'Failed to load routes', 'error');
  }
}

async function deleteRoute(routeId) {
  try {
    let success;
    
    if (isDemoMode) {
      success = true;
      await new Promise(resolve => setTimeout(resolve, 300));
    } else {
      const response = await fetch(`/api/routes/${routeId}`, {
        method: 'DELETE'
      });
      success = response.ok;
    }
    
    if (success) {
      showStatus('route-status', 'Route deleted successfully!', 'success');
      await loadRoutes();
    } else {
      showStatus('route-status', 'Failed to delete route', 'error');
    }
  } catch (error) {
    console.error('Route deletion failed:', error);
    showStatus('route-status', 'Error deleting route', 'error');
  }
}

function showStatus(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  
  // Remove existing classes
  element.classList.remove('text-green-400', 'text-red-400', 'text-orange-400', 'text-gray-400');
  
  // Add appropriate class with orange theme
  switch (type) {
    case 'success':
      element.classList.add('text-green-400');
      break;
    case 'error':
      element.classList.add('text-red-400');
      break;
    case 'info':
      element.classList.add('text-orange-400');
      break;
    default:
      element.classList.add('text-gray-400');
  }
  
  // Auto-clear after 5 seconds for non-error messages
  if (type !== 'error') {
    setTimeout(() => {
      element.textContent = '';
    }, 5000);
  }
}
