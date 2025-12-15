// Dashboard JavaScript

// Global variables
let collectionsData = [];
let farmersData = {};
let useFirebase = false;
let unsubscribeCollections = null;
let unsubscribeFarmers = null;
let unsubscribeDevices = null;
let trendChart = null;
let qualityChart = null;

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
    
    // Auto-generate random sensor values when quantity changes
    const quantityInput = document.getElementById('milk-quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', function() {
            const fatInput = document.getElementById('fat-content');
            const phInput = document.getElementById('ph-value');
            const tempInput = document.getElementById('temperature');
            
            // Simulate fat sensor: random value between 3.5% and 5.5%
            const simulatedFat = (3.5 + Math.random() * 2).toFixed(1);
            fatInput.value = simulatedFat;
            
            // Simulate pH sensor: random value between 6.5 and 6.8 (normal milk pH)
            const simulatedPH = (6.5 + Math.random() * 0.3).toFixed(2);
            phInput.value = simulatedPH;
            
            // Simulate temperature sensor: random value between 20°C and 30°C
            const simulatedTemp = (20 + Math.random() * 10).toFixed(1);
            tempInput.value = simulatedTemp;
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
            updateTrendChart();
            updateQualityChart();
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
        updateTrendChart();
        updateQualityChart();
    }
}

// Handle collection submission
async function handleCollection(event) {
    event.preventDefault();
    
    const farmerId = document.getElementById('farmer-id').value;
    const farmerName = document.getElementById('farmer-name').value;
    const quantity = parseFloat(document.getElementById('milk-quantity').value);
    const fatContent = parseFloat(document.getElementById('fat-content').value);
    const phValue = parseFloat(document.getElementById('ph-value').value);
    const temperature = parseFloat(document.getElementById('temperature').value);
    const deviceId = document.getElementById('device-id').value;
    
    const collection = {
        farmerId: farmerId,
        farmerName: farmerName,
        quantity: quantity,
        fatContent: fatContent,
        phValue: phValue,
        temperature: temperature,
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
        updateTrendChart();
        updateQualityChart();
        
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
        
        // Also update analytics and charts with current collectionsData
        updateAnalyticsSection();
        
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
    
    // Calculate average pH
    const collectionsWithPH = todayCollections.filter(c => c.phValue !== undefined && c.phValue !== null);
    const avgPH = collectionsWithPH.length > 0
        ? collectionsWithPH.reduce((sum, c) => sum + c.phValue, 0) / collectionsWithPH.length
        : 0;
    document.getElementById('avg-ph').textContent = avgPH > 0 ? avgPH.toFixed(2) : 'N/A';
    
    // Calculate average temperature
    const collectionsWithTemp = todayCollections.filter(c => c.temperature !== undefined && c.temperature !== null);
    const avgTemp = collectionsWithTemp.length > 0
        ? collectionsWithTemp.reduce((sum, c) => sum + c.temperature, 0) / collectionsWithTemp.length
        : 0;
    document.getElementById('avg-temp').textContent = avgTemp > 0 ? avgTemp.toFixed(1) + '°C' : 'N/A';
    
    // Update analytics section
    updateAnalyticsSection();
    
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

// Update analytics section (works for both Firebase and localStorage)
function updateAnalyticsSection() {
    // Calculate TODAY'S statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + (24 * 60 * 60 * 1000);
    
    const todayCollections = collectionsData.filter(c => {
        if (!c.timestamp && !c.createdAt) return false;
        
        let timestampMs;
        if (c.timestamp) {
            if (typeof c.timestamp === 'string') {
                timestampMs = new Date(c.timestamp).getTime();
            } else if (c.timestamp.toDate) {
                timestampMs = c.timestamp.toDate().getTime();
            }
        }
        
        if (!timestampMs && c.createdAt) {
            timestampMs = new Date(c.createdAt).getTime();
        }
        
        if (!timestampMs) return false;
        
        return timestampMs >= todayStart && timestampMs < todayEnd;
    });
    
    // Update TODAY'S statistics
    if (todayCollections.length > 0) {
        const todayMilk = todayCollections.reduce((sum, c) => sum + c.quantity, 0);
        const todayFarmers = new Set(todayCollections.map(c => c.farmerId));
        const todayAvgFat = todayCollections.reduce((sum, c) => sum + c.fatContent, 0) / todayCollections.length;
        
        document.getElementById('analytics-today-collections').textContent = todayCollections.length;
        document.getElementById('analytics-today-milk').textContent = todayMilk.toFixed(1) + ' L';
        document.getElementById('analytics-today-farmers').textContent = todayFarmers.size;
        document.getElementById('analytics-today-fat').textContent = todayAvgFat.toFixed(1) + '%';
    } else {
        document.getElementById('analytics-today-collections').textContent = '0';
        document.getElementById('analytics-today-milk').textContent = '0 L';
        document.getElementById('analytics-today-farmers').textContent = '0';
        document.getElementById('analytics-today-fat').textContent = '0%';
    }
    
    // Calculate ALL-TIME statistics
    const allCollections = collectionsData;
    
    if (allCollections.length > 0) {
        const totalMilk = allCollections.reduce((sum, c) => sum + c.quantity, 0);
        const uniqueFarmers = new Set(allCollections.map(c => c.farmerId));
        const avgFat = allCollections.reduce((sum, c) => sum + c.fatContent, 0) / allCollections.length;
        const maxFat = Math.max(...allCollections.map(c => c.fatContent));
        const minFat = Math.min(...allCollections.map(c => c.fatContent));
        const grade = getQualityGrade(avgFat);
        
        // Update all-time analytics
        document.getElementById('analytics-total-collections').textContent = allCollections.length;
        document.getElementById('analytics-total-milk').textContent = totalMilk.toFixed(1) + ' L';
        document.getElementById('analytics-avg-per-farmer').textContent = 
            (uniqueFarmers.size > 0 ? (totalMilk / uniqueFarmers.size).toFixed(1) : 0) + ' L';
        document.getElementById('analytics-avg-fat').textContent = avgFat.toFixed(1) + '%';
        document.getElementById('analytics-max-fat').textContent = maxFat.toFixed(1) + '%';
        document.getElementById('analytics-min-fat').textContent = minFat.toFixed(1) + '%';
        document.getElementById('analytics-grade').textContent = grade;
        
        // Peak time (all-time)
        const hours = allCollections.map(c => {
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
        
        // Top performers (all-time)
        updateTopPerformers(allCollections);
    } else {
        // No data - show zeros
        document.getElementById('analytics-total-collections').textContent = '0';
        document.getElementById('analytics-total-milk').textContent = '0 L';
        document.getElementById('analytics-avg-per-farmer').textContent = '0 L';
        document.getElementById('analytics-avg-fat').textContent = '0%';
        document.getElementById('analytics-max-fat').textContent = '0%';
        document.getElementById('analytics-min-fat').textContent = '0%';
        document.getElementById('analytics-grade').textContent = '-';
        document.getElementById('analytics-peak-time').textContent = '-';
        
        const topPerformersEl = document.getElementById('top-performers');
        if (topPerformersEl) {
            topPerformersEl.innerHTML = '<p class="muted"><i class="fas fa-trophy"></i> No data available yet</p>';
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
                <td colspan="9">
                    <i class="fas fa-info-circle"></i> No collections yet. Add your first entry above!
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by timestamp - latest first
    const sortedCollections = [...collectionsData].sort((a, b) => {
        let timeA, timeB;
        
        // Handle different timestamp formats
        if (a.timestamp) {
            timeA = a.timestamp.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
        } else if (a.createdAt) {
            timeA = new Date(a.createdAt).getTime();
        }
        
        if (b.timestamp) {
            timeB = b.timestamp.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
        } else if (b.createdAt) {
            timeB = new Date(b.createdAt).getTime();
        }
        
        return timeB - timeA; // Latest first
    });
    
    tbody.innerHTML = sortedCollections.slice(0, 50).map(c => `
        <tr>
            <td>${formatDateTime(c.timestamp)}</td>
            <td><span class="badge">${c.farmerId}</span></td>
            <td>${c.farmerName}</td>
            <td><strong>${c.quantity.toFixed(1)}</strong></td>
            <td>${c.fatContent.toFixed(1)}%</td>
            <td>${c.phValue !== undefined ? c.phValue.toFixed(2) : 'N/A'}</td>
            <td>${c.temperature !== undefined ? c.temperature.toFixed(1) : 'N/A'}</td>
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
    
    // Sort by last deposit - latest first
    const sortedFarmers = farmers.sort((a, b) => {
        if (!a.lastDeposit) return 1;
        if (!b.lastDeposit) return -1;
        return new Date(b.lastDeposit).getTime() - new Date(a.lastDeposit).getTime();
    });
    
    tbody.innerHTML = sortedFarmers.map(f => `
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
function updateTopPerformers(collections) {
    const topPerformersEl = document.getElementById('top-performers');
    if (!topPerformersEl) return;
    
    if (collections.length === 0) {
        topPerformersEl.innerHTML = '<p class="muted"><i class="fas fa-trophy"></i> No data available yet</p>';
        return;
    }
    
    // Calculate farmer totals for all-time
    const farmerTotals = {};
    collections.forEach(c => {
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

// Calculate quality grade based on fat percentage
function getQualityGrade(fatPercent) {
    if (fatPercent >= 8.0) return 'A+';      // 8% and above - Premium
    if (fatPercent >= 6.5) return 'A';       // 6.5% - 7.9% - Excellent
    if (fatPercent >= 5.5) return 'B+';      // 5.5% - 6.4% - Very Good
    if (fatPercent >= 4.5) return 'B';       // 4.5% - 5.4% - Good
    if (fatPercent >= 3.5) return 'C+';      // 3.5% - 4.4% - Above Average
    if (fatPercent >= 2.5) return 'C';       // 2.5% - 3.4% - Average
    return 'F';                               // Below 2.5% - Fail
}

// Get color for quality grade
function getGradeColor(grade) {
    const colors = {
        'A+': '#00ff88',  // Bright green
        'A': '#00dd77',   // Green
        'B+': '#00aeff',  // Bright blue
        'B': '#0088dd',   // Blue
        'C+': '#ff8800',  // Orange
        'C': '#ff6600',   // Dark orange
        'F': '#ff0066'    // Red
    };
    return colors[grade] || '#999';
}

// Initialize and update Collection Trend Chart (7 Days)
function updateTrendChart() {
    const canvas = document.getElementById('trendCanvas');
    if (!canvas) return;
    
    // Get last 7 days
    const today = new Date();
    const last7Days = [];
    const dailyTotals = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        
        last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Calculate total milk for this day
        const dayStart = date.getTime();
        const dayEnd = dayStart + (24 * 60 * 60 * 1000);
        
        const dayCollections = collectionsData.filter(c => {
            if (!c.timestamp && !c.createdAt) return false;
            
            let timestampMs;
            if (c.timestamp) {
                if (typeof c.timestamp === 'string') {
                    timestampMs = new Date(c.timestamp).getTime();
                } else if (c.timestamp.toDate) {
                    timestampMs = c.timestamp.toDate().getTime();
                }
            }
            
            if (!timestampMs && c.createdAt) {
                timestampMs = new Date(c.createdAt).getTime();
            }
            
            if (!timestampMs) return false;
            
            return timestampMs >= dayStart && timestampMs < dayEnd;
        });
        
        const totalMilk = dayCollections.reduce((sum, c) => sum + c.quantity, 0);
        dailyTotals.push(totalMilk);
    }
    
    // Destroy existing chart if it exists
    if (trendChart) {
        trendChart.destroy();
    }
    
    // Create new chart
    const ctx = canvas.getContext('2d');
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Milk Collected (Liters)',
                data: dailyTotals,
                borderColor: '#00ff88',
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#00ff88',
                pointBorderColor: '#0a0a0a',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#a0a0a0',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 10, 10, 0.9)',
                    titleColor: '#00ff88',
                    bodyColor: '#ffffff',
                    borderColor: '#00ff88',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y.toFixed(1) + ' Liters';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return value + 'L';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#666'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                }
            }
        }
    });
}

// Initialize and update Quality Distribution Chart
function updateQualityChart() {
    const canvas = document.getElementById('qualityCanvas');
    if (!canvas) return;
    
    // Get last 7 days
    const today = new Date();
    const last7Days = [];
    const avgFatPerDay = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        
        last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Calculate average fat content for this day
        const dayStart = date.getTime();
        const dayEnd = dayStart + (24 * 60 * 60 * 1000);
        
        const dayCollections = collectionsData.filter(c => {
            if (!c.timestamp && !c.createdAt) return false;
            
            let timestampMs;
            if (c.timestamp) {
                if (typeof c.timestamp === 'string') {
                    timestampMs = new Date(c.timestamp).getTime();
                } else if (c.timestamp.toDate) {
                    timestampMs = c.timestamp.toDate().getTime();
                }
            }
            
            if (!timestampMs && c.createdAt) {
                timestampMs = new Date(c.createdAt).getTime();
            }
            
            if (!timestampMs) return false;
            
            return timestampMs >= dayStart && timestampMs < dayEnd;
        });
        
        // Calculate average fat for the day
        if (dayCollections.length > 0) {
            const avgFat = dayCollections.reduce((sum, c) => sum + c.fatContent, 0) / dayCollections.length;
            avgFatPerDay.push(avgFat);
        } else {
            avgFatPerDay.push(0);
        }
    }
    
    // Destroy existing chart if it exists
    if (qualityChart) {
        qualityChart.destroy();
    }
    
    // Create new chart
    const ctx = canvas.getContext('2d');
    qualityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Average Fat %',
                data: avgFatPerDay,
                backgroundColor: avgFatPerDay.map(fat => getGradeColor(getQualityGrade(fat))),
                borderColor: avgFatPerDay.map(fat => getGradeColor(getQualityGrade(fat))),
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#a0a0a0',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 10, 10, 0.9)',
                    titleColor: '#00ff88',
                    bodyColor: '#ffffff',
                    borderColor: '#00ff88',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            if (value === 0) return 'No data';
                            const grade = getQualityGrade(value);
                            const gradeNames = {
                                'A+': 'Premium',
                                'A': 'Excellent',
                                'B+': 'Very Good',
                                'B': 'Good',
                                'C+': 'Above Average',
                                'C': 'Average',
                                'F': 'Fail'
                            };
                            return value.toFixed(2) + '% (Grade: ' + grade + ' - ' + gradeNames[grade] + ')';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 17,
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#666'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                }
            }
        }
    });
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
        updateTrendChart();
        updateQualityChart();
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
