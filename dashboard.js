// Dashboard JavaScript

// Global variables
let collectionsData = [];
let farmersData = {};
let useFirebase = false;
let unsubscribeCollections = null;
let unsubscribeFarmers = null;
let unsubscribeDevices = null;

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
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Unsubscribe from Firebase listeners
        if (unsubscribeCollections) unsubscribeCollections();
        if (unsubscribeFarmers) unsubscribeFarmers();
        if (unsubscribeDevices) unsubscribeDevices();
        
        // Firebase logout if using Firebase
        if (useFirebase && typeof firebaseLogout === 'function') {
            await firebaseLogout();
        }
        
        localStorage.removeItem('milktrack_user');
        window.location.href = 'index.html';
    }
}

// Initialize dashboard
function initDashboard() {
    const user = checkAuth();
    if (user) {
        document.getElementById('user-name').textContent = user.name || user.email.split('@')[0];
    }
    
    // Check if Firebase is configured and initialized
    useFirebase = typeof firebase !== 'undefined' && 
                  typeof db !== 'undefined' &&
                  !user.demo;
    
    if (useFirebase) {
        console.log('Using Firebase backend');
        initFirebaseListeners();
        loadFirebaseStats();
    } else {
        console.log('Using localStorage (demo mode)');
        initLocalStorage();
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

// Initialize Firebase real-time listeners
function initFirebaseListeners() {
    // Listen to collections
    if (typeof listenToCollections === 'function') {
        unsubscribeCollections = listenToCollections((collections) => {
            collectionsData = collections;
            renderFeed();
            updateAllStats();
            updateDeviceCards([]); // Update devices based on collections
        });
    }
    
    // Listen to farmers
    if (typeof listenToFarmers === 'function') {
        unsubscribeFarmers = listenToFarmers((farmers) => {
            farmersData = {};
            farmers.forEach(f => {
                farmersData[f.id] = f;
            });
            renderFarmers();
        });
    }
    
    // Listen to devices
    if (typeof listenToDevices === 'function') {
        unsubscribeDevices = listenToDevices((devices) => {
            updateDeviceCards(devices);
        });
    }
}

// Load Firebase statistics
async function loadFirebaseStats() {
    if (typeof getTodayStats === 'function') {
        const stats = await getTodayStats();
        document.getElementById('total-milk').textContent = stats.totalMilk + ' L';
        document.getElementById('active-farmers').textContent = stats.activeFarmers;
        document.getElementById('active-devices').textContent = stats.activeDevices;
        document.getElementById('avg-fat').textContent = stats.avgFat + '%';
    }
}

// Initialize localStorage mode
function initLocalStorage() {
    // Load existing data from localStorage
    const savedData = localStorage.getItem('milktrack_collections');
    if (savedData) {
        collectionsData = JSON.parse(savedData);
        updateAllStats();
        renderFeed();
        renderFarmers();
    }
}

// Handle collection submission
async function handleCollection(event) {
    event.preventDefault();
    
    const farmerId = document.getElementById('farmer-id').value;
    const farmerName = document.getElementById('farmer-name').value;
    const quantity = parseFloat(document.getElementById('milk-quantity').value);
    const fatContent = parseFloat(document.getElementById('fat-content').value);
    const deviceId = document.getElementById('device-id').value;
    
    const collection = {
        farmerId: farmerId,
        farmerName: farmerName,
        quantity: quantity,
        fatContent: fatContent,
        deviceId: deviceId,
        status: 'Verified'
    };
    
    if (useFirebase && typeof addCollection === 'function') {
        // Firebase mode
        const result = await addCollection(collection);
        if (result.success) {
            showNotification('Collection recorded successfully!', 'success');
            // Data will update automatically via listeners
        } else {
            showNotification('Error: ' + result.error, 'error');
        }
    } else {
        // localStorage mode
        collection.id = Date.now();
        collection.timestamp = new Date().toISOString();
        
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
        
        showNotification('Collection recorded successfully!', 'success');
    }
    
    // Reset form
    event.target.reset();
    document.getElementById('fat-content').value = '';
}

// Update device cards from Firebase data
function updateDeviceCards(devices) {
    const devicesGrid = document.getElementById('devices-grid');
    if (!devicesGrid) return;
    
    // Get today's collections for stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + (24 * 60 * 60 * 1000);
    
    const todayCollections = collectionsData.filter(c => {
        if (!c.timestamp && !c.createdAt) return false;
        
        // Handle both string timestamps and Firestore Timestamp objects
        let timestampMs;
        
        // Try timestamp field first
        if (c.timestamp) {
            if (typeof c.timestamp === 'string') {
                timestampMs = new Date(c.timestamp).getTime();
            } else if (c.timestamp.toDate) {
                // Firestore Timestamp object
                timestampMs = c.timestamp.toDate().getTime();
            }
        }
        
        // Fallback to createdAt if timestamp didn't work
        if (!timestampMs && c.createdAt) {
            timestampMs = new Date(c.createdAt).getTime();
        }
        
        if (!timestampMs) return false;
        
        return timestampMs >= todayStart && timestampMs < todayEnd;
    });
    
    // Get unique devices from today's collections
    const uniqueDeviceIds = [...new Set(todayCollections.map(c => c.deviceId))];
    
    if (uniqueDeviceIds.length === 0) {
        devicesGrid.innerHTML = `
            <div class="no-data" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-info-circle"></i> No active devices. Devices appear here when they send data.
            </div>
        `;
        document.getElementById('active-devices').textContent = '0';
        return;
    }
    
    // Render devices based on collections
    devicesGrid.innerHTML = uniqueDeviceIds.map(deviceId => {
        const deviceCollections = todayCollections.filter(c => c.deviceId === deviceId);
        const uniqueFarmers = new Set(deviceCollections.map(c => c.farmerId));
        
        // Get last activity from collections
        let lastActivity = 'Never';
        if (deviceCollections.length > 0) {
            const latestCollection = deviceCollections[0];
            let timestamp;
            
            if (latestCollection.timestamp) {
                timestamp = latestCollection.timestamp.toDate ? 
                    latestCollection.timestamp.toDate() : 
                    new Date(latestCollection.timestamp);
            } else if (latestCollection.createdAt) {
                timestamp = new Date(latestCollection.createdAt);
            }
            
            if (timestamp) {
                lastActivity = formatTimeAgo(timestamp);
            }
        }
        
        return `
            <div class="device-card online">
                <div class="device-header">
                    <h3><i class="fas fa-microchip"></i> ${deviceId}</h3>
                    <span class="device-status online"><i class="fas fa-circle"></i> Online</span>
                </div>
                <div class="device-stats">
                    <div class="device-stat">
                        <span>Collections Today:</span>
                        <strong>${deviceCollections.length}</strong>
                    </div>
                    <div class="device-stat">
                        <span>Last Activity:</span>
                        <strong>${lastActivity}</strong>
                    </div>
                    <div class="device-stat">
                        <span>Unique Farmers:</span>
                        <strong>${uniqueFarmers.size}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Update active devices count
    document.getElementById('active-devices').textContent = uniqueDeviceIds.length;
}

// Update all statistics
function updateAllStats() {
    if (useFirebase) {
        // Firebase mode - stats are updated via listeners
        loadFirebaseStats();
        
        // Also update analytics with current collectionsData
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        const todayEnd = todayStart + (24 * 60 * 60 * 1000);
        
        const todayCollections = collectionsData.filter(c => {
            if (!c.timestamp && !c.createdAt) return false;
            
            // Handle both string timestamps and Firestore Timestamp objects
            let timestampMs;
            
            // Try timestamp field first
            if (c.timestamp) {
                if (typeof c.timestamp === 'string') {
                    timestampMs = new Date(c.timestamp).getTime();
                } else if (c.timestamp.toDate) {
                    // Firestore Timestamp object
                    timestampMs = c.timestamp.toDate().getTime();
                }
            }
            
            // Fallback to createdAt if timestamp didn't work
            if (!timestampMs && c.createdAt) {
                timestampMs = new Date(c.createdAt).getTime();
            }
            
            if (!timestampMs) return false;
            
            return timestampMs >= todayStart && timestampMs < todayEnd;
        });
        
        if (todayCollections.length > 0) {
            const totalMilk = todayCollections.reduce((sum, c) => sum + c.quantity, 0);
            const uniqueFarmers = new Set(todayCollections.map(c => c.farmerId));
            const avgFat = todayCollections.reduce((sum, c) => sum + c.fatContent, 0) / todayCollections.length;
            const maxFat = Math.max(...todayCollections.map(c => c.fatContent));
            const minFat = Math.min(...todayCollections.map(c => c.fatContent));
            const grade = avgFat >= 4.5 ? 'A+' : avgFat >= 4.0 ? 'A' : avgFat >= 3.5 ? 'B' : 'C';
            
            // Update analytics
            document.getElementById('analytics-total-collections').textContent = todayCollections.length;
            document.getElementById('analytics-total-milk').textContent = totalMilk.toFixed(1) + ' L';
            document.getElementById('analytics-avg-per-farmer').textContent = 
                (uniqueFarmers.size > 0 ? (totalMilk / uniqueFarmers.size).toFixed(1) : 0) + ' L';
            document.getElementById('analytics-avg-fat').textContent = avgFat.toFixed(1) + '%';
            document.getElementById('analytics-max-fat').textContent = maxFat.toFixed(1) + '%';
            document.getElementById('analytics-min-fat').textContent = minFat.toFixed(1) + '%';
            document.getElementById('analytics-grade').textContent = grade;
            
            // Peak time
            const hours = todayCollections.map(c => {
                let timestamp;
                if (c.timestamp) {
                    timestamp = c.timestamp.toDate ? c.timestamp.toDate() : new Date(c.timestamp);
                } else if (c.createdAt) {
                    timestamp = new Date(c.createdAt);
                }
                return timestamp ? timestamp.getHours() : 0;
            });
            const peakHour = hours.sort((a,b) =>
                hours.filter(h => h === a).length - hours.filter(h => h === b).length
            ).pop();
            document.getElementById('analytics-peak-time').textContent = peakHour + ':00';
            
            // Top performers
            updateTopPerformers(todayCollections);
        }
        
        return;
    }
    
    // localStorage mode
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
        } else {
            document.getElementById('analytics-max-fat').textContent = '0%';
            document.getElementById('analytics-min-fat').textContent = '0%';
            document.getElementById('analytics-grade').textContent = '-';
            document.getElementById('analytics-peak-time').textContent = '-';
        }
        
        // Peak collection time
        if (todayCollections.length > 0) {
            const hours = todayCollections.map(c => new Date(c.timestamp).getHours());
            const peakHour = hours.sort((a,b) =>
                hours.filter(h => h === a).length - hours.filter(h => h === b).length
            ).pop();
            document.getElementById('analytics-peak-time').textContent = peakHour + ':00';
        }
        
        // Update Top Performers
        updateTopPerformers(todayCollections);
    }
    
    // Update device stats in localStorage mode
    const devicesGrid = document.getElementById('devices-grid');
    if (devicesGrid) {
        // Get unique devices from collections
        const uniqueDevices = [...new Set(todayCollections.map(c => c.deviceId))];
        
        if (uniqueDevices.length === 0) {
            devicesGrid.innerHTML = `
                <div class="no-data" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fas fa-info-circle"></i> No active devices. Devices appear here when they send data.
                </div>
            `;
        } else {
            devicesGrid.innerHTML = uniqueDevices.map(deviceId => {
                const devCollections = todayCollections.filter(c => c.deviceId === deviceId);
                const uniqueFarmersForDevice = new Set(devCollections.map(c => c.farmerId));
                const lastActivity = devCollections.length > 0 ? formatTimeAgo(new Date(devCollections[0].timestamp)) : 'Never';
                
                return `
                    <div class="device-card online">
                        <div class="device-header">
                            <h3><i class="fas fa-microchip"></i> ${deviceId}</h3>
                            <span class="device-status online"><i class="fas fa-circle"></i> Online</span>
                        </div>
                        <div class="device-stats">
                            <div class="device-stat">
                                <span>Collections Today:</span>
                                <strong>${devCollections.length}</strong>
                            </div>
                            <div class="device-stat">
                                <span>Last Activity:</span>
                                <strong>${lastActivity}</strong>
                            </div>
                            <div class="device-stat">
                                <span>Unique Farmers:</span>
                                <strong>${uniqueFarmersForDevice.size}</strong>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Update active devices count
        document.getElementById('active-devices').textContent = uniqueDevices.length;
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

// Update Top Performers section
function updateTopPerformers(todayCollections) {
    const topPerformersEl = document.getElementById('top-performers');
    if (!topPerformersEl) return;
    
    if (todayCollections.length === 0) {
        topPerformersEl.innerHTML = '<p class="muted"><i class="fas fa-trophy"></i> No data available yet</p>';
        return;
    }
    
    // Calculate farmer totals
    const farmerTotals = {};
    todayCollections.forEach(c => {
        if (!farmerTotals[c.farmerId]) {
            farmerTotals[c.farmerId] = {
                name: c.farmerName,
                totalQuantity: 0,
                collections: 0
            };
        }
        farmerTotals[c.farmerId].totalQuantity += c.quantity;
        farmerTotals[c.farmerId].collections += 1;
    });
    
    // Sort by total quantity and get top 3
    const topFarmers = Object.entries(farmerTotals)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 3);
    
    // Render top performers
    const medals = ['🥇', '🥈', '🥉'];
    topPerformersEl.innerHTML = topFarmers.map((farmer, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
            <div>
                <span style="font-size: 20px; margin-right: 8px;">${medals[index]}</span>
                <strong>${farmer.name}</strong>
                <span style="color: #666; font-size: 12px; margin-left: 8px;">${farmer.id}</span>
            </div>
            <div style="text-align: right;">
                <strong style="color: #667eea;">${farmer.totalQuantity.toFixed(1)} L</strong>
                <div style="font-size: 11px; color: #999;">${farmer.collections} collection${farmer.collections > 1 ? 's' : ''}</div>
            </div>
        </div>
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
async function clearFeed() {
    if (useFirebase && typeof clearAllCollections === 'function') {
        // Firebase mode
        const confirmed = await clearAllCollections();
        if (confirmed) {
            showNotification('All data cleared from Firebase', 'info');
        }
    } else {
        // localStorage mode
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
}

// Refresh feed
function refreshFeed() {
    if (useFirebase) {
        loadFirebaseStats();
        showNotification('Data refreshed from Firebase', 'success');
    } else {
        updateAllStats();
        renderFeed();
        renderFarmers();
        showNotification('Data refreshed', 'success');
    }
}

// Export data to CSV
async function exportData() {
    let dataToExport = collectionsData;
    
    if (useFirebase && typeof exportCollectionsToCSV === 'function') {
        // Firebase mode - fetch all data
        dataToExport = await exportCollectionsToCSV();
    }
    
    if (dataToExport.length === 0) {
        alert('No data to export');
        return;
    }
    
    const csv = [
        ['Timestamp', 'Farmer ID', 'Farmer Name', 'Quantity (L)', 'Fat %', 'Device ID', 'Status'],
        ...dataToExport.map(c => [
            c.timestamp,
            c.farmerId,
            c.farmerName,
            c.quantity,
            c.fatContent || c.fatPercent,
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
