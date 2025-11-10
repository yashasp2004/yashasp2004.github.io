// Dashboard JavaScript

// Check authentication
function checkAuth() {
    const user = localStorage.getItem('milktrack_user');
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return JSON.parse(user);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('milktrack_user');
        window.location.href = 'index.html';
    }
}

// Initialize dashboard
let collectionsData = [];
let farmersData = {};

function initDashboard() {
    const user = checkAuth();
    if (user) {
        document.getElementById('user-name').textContent = user.name;
    }
    
    // Load existing data from localStorage
    const savedData = localStorage.getItem('milktrack_collections');
    if (savedData) {
        collectionsData = JSON.parse(savedData);
        updateAllStats();
        renderFeed();
        renderFarmers();
    }
    
    // Set up form handler
    const form = document.getElementById('manual-entry-form');
    if (form) {
        form.addEventListener('submit', handleCollection);
    }
    
    // Auto-generate random fat content when quantity changes
    const quantityInput = document.getElementById('milk-quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', function() {
            const fatInput = document.getElementById('fat-content');
            // Simulate fat sensor: random value between 3.5% and 5.5%
            const simulatedFat = (3.5 + Math.random() * 2).toFixed(1);
            fatInput.value = simulatedFat;
        });
    }
}

// Handle collection submission
function handleCollection(event) {
    event.preventDefault();
    
    const farmerId = document.getElementById('farmer-id').value;
    const farmerName = document.getElementById('farmer-name').value;
    const quantity = parseFloat(document.getElementById('milk-quantity').value);
    const fatContent = parseFloat(document.getElementById('fat-content').value);
    const deviceId = document.getElementById('device-id').value;
    
    const collection = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        farmerId: farmerId,
        farmerName: farmerName,
        quantity: quantity,
        fatContent: fatContent,
        deviceId: deviceId,
        status: 'Verified'
    };
    
    // Add to collections
    collectionsData.unshift(collection);
    
    // Update farmer data
    if (!farmersData[farmerId]) {
        farmersData[farmerId] = {
            id: farmerId,
            name: farmerName,
            totalDeposits: 0,
            totalQuantity: 0,
            lastDeposit: null,
            fingerprintStatus: 'Registered'
        };
    }
    farmersData[farmerId].totalDeposits++;
    farmersData[farmerId].totalQuantity += quantity;
    farmersData[farmerId].lastDeposit = new Date().toISOString();
    
    // Save to localStorage
    localStorage.setItem('milktrack_collections', JSON.stringify(collectionsData));
    localStorage.setItem('milktrack_farmers', JSON.stringify(farmersData));
    
    // Update UI
    updateAllStats();
    renderFeed();
    renderFarmers();
    
    // Reset form
    event.target.reset();
    document.getElementById('fat-content').value = '';
    
    // Show success message
    showNotification('Collection recorded successfully!', 'success');
}

// Update all statistics
function updateAllStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayCollections = collectionsData.filter(c => 
        c.timestamp.startsWith(today)
    );
    
    // Total milk today
    const totalMilk = todayCollections.reduce((sum, c) => sum + c.quantity, 0);
    document.getElementById('total-milk').textContent = totalMilk.toFixed(1) + ' L';
    
    // Active farmers (unique farmers today)
    const uniqueFarmers = new Set(todayCollections.map(c => c.farmerId));
    document.getElementById('active-farmers').textContent = uniqueFarmers.size;
    
    // Active devices
    const uniqueDevices = new Set(todayCollections.map(c => c.deviceId));
    document.getElementById('active-devices').textContent = uniqueDevices.size + '/4';
    
    // Average fat content
    const avgFat = todayCollections.length > 0
        ? todayCollections.reduce((sum, c) => sum + c.fatContent, 0) / todayCollections.length
        : 0;
    document.getElementById('avg-fat').textContent = avgFat.toFixed(1) + '%';
    
    // Update analytics
    if (document.getElementById('analytics-total-collections')) {
        document.getElementById('analytics-total-collections').textContent = todayCollections.length;
        document.getElementById('analytics-total-milk').textContent = totalMilk.toFixed(1) + ' L';
        document.getElementById('analytics-avg-per-farmer').textContent = 
            (uniqueFarmers.size > 0 ? (totalMilk / uniqueFarmers.size).toFixed(1) : 0) + ' L';
        document.getElementById('analytics-avg-fat').textContent = avgFat.toFixed(1) + '%';
        
        if (todayCollections.length > 0) {
            const maxFat = Math.max(...todayCollections.map(c => c.fatContent));
            const minFat = Math.min(...todayCollections.map(c => c.fatContent));
            document.getElementById('analytics-max-fat').textContent = maxFat.toFixed(1) + '%';
            document.getElementById('analytics-min-fat').textContent = minFat.toFixed(1) + '%';
            
            // Quality grade
            const grade = avgFat >= 4.5 ? 'A+' : avgFat >= 4.0 ? 'A' : avgFat >= 3.5 ? 'B' : 'C';
            document.getElementById('analytics-grade').textContent = grade;
        }
        
        // Peak collection time
        if (todayCollections.length > 0) {
            const hours = todayCollections.map(c => new Date(c.timestamp).getHours());
            const peakHour = hours.sort((a,b) =>
                hours.filter(h => h === a).length - hours.filter(h => h === b).length
            ).pop();
            document.getElementById('analytics-peak-time').textContent = peakHour + ':00';
        }
    }
    
    // Update device stats
    for (let i = 1; i <= 4; i++) {
        const devId = `DEV00${i}`;
        const devCollections = todayCollections.filter(c => c.deviceId === devId);
        const devElement = document.getElementById(`dev${i}-collections`);
        const devActivity = document.getElementById(`dev${i}-activity`);
        const devFps = document.getElementById(`dev${i}-fps`);
        
        if (devElement) {
            devElement.textContent = devCollections.length;
        }
        if (devActivity && devCollections.length > 0) {
            const lastTime = new Date(devCollections[0].timestamp);
            devActivity.textContent = formatTimeAgo(lastTime);
        }
        if (devFps) {
            const uniqueFarmersForDevice = new Set(devCollections.map(c => c.farmerId));
            devFps.textContent = uniqueFarmersForDevice.size;
        }
    }
}

// Render feed table
function renderFeed() {
    const tbody = document.getElementById('feed-tbody');
    if (!tbody) return;
    
    if (collectionsData.length === 0) {
        tbody.innerHTML = `
            <tr class="no-data">
                <td colspan="7">
                    <i class="fas fa-info-circle"></i> No collections yet. Add your first entry above!
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = collectionsData.slice(0, 50).map(c => `
        <tr>
            <td>${formatDateTime(c.timestamp)}</td>
            <td><span class="badge">${c.farmerId}</span></td>
            <td>${c.farmerName}</td>
            <td><strong>${c.quantity.toFixed(1)}</strong></td>
            <td>${c.fatContent.toFixed(1)}%</td>
            <td><span class="device-badge">${c.deviceId}</span></td>
            <td><span class="status-badge ${c.status.toLowerCase()}">${c.status}</span></td>
        </tr>
    `).join('');
}

// Render farmers table
function renderFarmers() {
    const tbody = document.getElementById('farmers-tbody');
    if (!tbody) return;
    
    const farmers = Object.values(farmersData);
    
    if (farmers.length === 0) {
        tbody.innerHTML = `
            <tr class="no-data">
                <td colspan="6"><i class="fas fa-info-circle"></i> No farmers registered yet</td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = farmers.map(f => `
        <tr>
            <td><span class="badge">${f.id}</span></td>
            <td>${f.name}</td>
            <td><span class="status-badge verified">${f.fingerprintStatus}</span></td>
            <td>${f.totalDeposits}</td>
            <td><strong>${f.totalQuantity.toFixed(1)} L</strong></td>
            <td>${formatDateTime(f.lastDeposit)}</td>
        </tr>
    `).join('');
}

// Utility functions
function formatDateTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    return Math.floor(hours / 24) + 'd ago';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Clear feed function
function clearFeed() {
    if (confirm('Are you sure you want to clear all collections? This cannot be undone.')) {
        collectionsData = [];
        farmersData = {};
        localStorage.removeItem('milktrack_collections');
        localStorage.removeItem('milktrack_farmers');
        updateAllStats();
        renderFeed();
        renderFarmers();
        showNotification('All data cleared', 'info');
    }
}

// Refresh feed
function refreshFeed() {
    updateAllStats();
    renderFeed();
    renderFarmers();
    showNotification('Data refreshed', 'success');
}

// Export data to CSV
function exportData() {
    if (collectionsData.length === 0) {
        alert('No data to export');
        return;
    }
    
    const csv = [
        ['Timestamp', 'Farmer ID', 'Farmer Name', 'Quantity (L)', 'Fat %', 'Device ID', 'Status'],
        ...collectionsData.map(c => [
            c.timestamp,
            c.farmerId,
            c.farmerName,
            c.quantity,
            c.fatContent,
            c.deviceId,
            c.status
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milk-collections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully', 'success');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initDashboard);

// Smooth scrolling for navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
            
            // Update active link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        }
    });
});
