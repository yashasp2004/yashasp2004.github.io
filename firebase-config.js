// Firebase Configuration and Integration
// Replace with your Firebase project credentials from console.firebase.google.com

// ============================================================================
// STEP 1: CREATE FIREBASE PROJECT
// ============================================================================
// 1. Go to https://console.firebase.google.com
// 2. Click "Add project" → Enter name "milk-traceability" → Continue
// 3. Disable Google Analytics (optional) → Create project
// 4. In left menu: Build → Firestore Database → Create database
//    - Choose "Start in test mode" (we'll add security rules later)
//    - Select location closest to you
// 5. In left menu: Build → Authentication → Get started
//    - Enable "Email/Password" sign-in method
// 6. In Project Overview → Click "</>" Web icon → Register app
//    - App nickname: "Milk Dashboard"
//    - Copy the firebaseConfig object below
//
// ============================================================================

// PASTE YOUR FIREBASE CONFIG HERE (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCqV_9Dtxs9eZoorzrQkdEfK4fQL0nofVk",
  authDomain: "myolk-7694b.firebaseapp.com",
  projectId: "myolk-7694b",
  storageBucket: "myolk-7694b.firebasestorage.app",
  messagingSenderId: "1066242615241",
  appId: "1:1066242615241:web:7dbfc1dd15146e8528aa18",
  measurementId: "G-LQBL11T1KQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

// Login with email/password
async function firebaseLogin(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    console.log('Logged in:', user.email);
    return { success: true, user: user };
  } catch (error) {
    console.error('Login error:', error.code, error.message);
    return { success: false, error: error.message };
  }
}

// Register new user (admin only - for creating operator accounts)
async function firebaseRegister(email, password) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    console.log('User created:', userCredential.user.email);
    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

// Logout
async function firebaseLogout() {
  try {
    await auth.signOut();
    console.log('Logged out');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

// Check authentication state
function onAuthStateChanged(callback) {
  auth.onAuthStateChanged(callback);
}

// ============================================================================
// FIRESTORE DATA OPERATIONS
// ============================================================================

// Add new milk collection
async function addCollection(data) {
  try {
    const docRef = await db.collection('collections').add({
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      farmerId: data.farmerId,
      farmerName: data.farmerName,
      quantity: parseFloat(data.quantity),
      fatContent: parseFloat(data.fatContent),
      phValue: data.phValue !== undefined ? parseFloat(data.phValue) : null,
      temperature: data.temperature !== undefined ? parseFloat(data.temperature) : null,
      deviceId: data.deviceId,
      status: data.status || 'Verified',
      createdAt: new Date().toISOString()
    });
    
    // Update farmer stats
    await updateFarmerStats(data.farmerId, data.farmerName, data.quantity);
    
    // Update device stats
    await updateDeviceStats(data.deviceId);
    
    console.log('Collection added with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding collection:', error);
    return { success: false, error: error.message };
  }
}

// Update farmer statistics
async function updateFarmerStats(farmerId, farmerName, quantity) {
  const farmerRef = db.collection('farmers').doc(farmerId);
  
  try {
    const doc = await farmerRef.get();
    
    if (doc.exists) {
      // Update existing farmer
      await farmerRef.update({
        totalDeposits: firebase.firestore.FieldValue.increment(1),
        totalQuantity: firebase.firestore.FieldValue.increment(parseFloat(quantity)),
        lastDeposit: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Create new farmer record
      await farmerRef.set({
        id: farmerId,
        name: farmerName,
        fingerprintStatus: 'Registered',
        totalDeposits: 1,
        totalQuantity: parseFloat(quantity),
        lastDeposit: firebase.firestore.FieldValue.serverTimestamp(),
        registeredAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating farmer stats:', error);
  }
}

// Update device statistics
async function updateDeviceStats(deviceId) {
  const deviceRef = db.collection('devices').doc(deviceId);
  
  try {
    await deviceRef.set({
      deviceId: deviceId,
      lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
      online: true
    }, { merge: true });
  } catch (error) {
    console.error('Error updating device stats:', error);
  }
}

// Listen to collections in real-time
function listenToCollections(callback, limit = 50) {
  return db.collection('collections')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .onSnapshot((snapshot) => {
      const collections = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        collections.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : data.createdAt
        });
      });
      callback(collections);
    }, (error) => {
      console.error('Error listening to collections:', error);
    });
}

// Listen to farmers in real-time
function listenToFarmers(callback) {
  return db.collection('farmers')
    .orderBy('totalQuantity', 'desc')
    .onSnapshot((snapshot) => {
      const farmers = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        farmers.push({
          id: doc.id,
          ...data,
          lastDeposit: data.lastDeposit ? data.lastDeposit.toDate().toISOString() : null
        });
      });
      callback(farmers);
    }, (error) => {
      console.error('Error listening to farmers:', error);
    });
}

// Listen to devices in real-time
function listenToDevices(callback) {
  return db.collection('devices')
    .onSnapshot((snapshot) => {
      const devices = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        devices.push({
          id: doc.id,
          ...data,
          lastActivity: data.lastActivity ? data.lastActivity.toDate().toISOString() : null
        });
      });
      callback(devices);
    }, (error) => {
      console.error('Error listening to devices:', error);
    });
}

// Get today's statistics
async function getTodayStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    const snapshot = await db.collection('collections')
      .where('timestamp', '>=', today)
      .get();
    
    let totalMilk = 0;
    let totalFat = 0;
    const uniqueFarmers = new Set();
    const uniqueDevices = new Set();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      totalMilk += data.quantity || 0;
      totalFat += data.fatContent || 0;
      uniqueFarmers.add(data.farmerId);
      uniqueDevices.add(data.deviceId);
    });
    
    return {
      totalMilk: totalMilk.toFixed(1),
      avgFat: snapshot.size > 0 ? (totalFat / snapshot.size).toFixed(1) : 0,
      activeFarmers: uniqueFarmers.size,
      activeDevices: uniqueDevices.size,
      totalCollections: snapshot.size
    };
  } catch (error) {
    console.error('Error getting today stats:', error);
    return {
      totalMilk: 0,
      avgFat: 0,
      activeFarmers: 0,
      activeDevices: 0,
      totalCollections: 0
    };
  }
}

// Export data to CSV
async function exportCollectionsToCSV() {
  try {
    const snapshot = await db.collection('collections')
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();
    
    const collections = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      collections.push({
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : data.createdAt,
        farmerId: data.farmerId,
        farmerName: data.farmerName,
        quantity: data.quantity,
        fatContent: data.fatContent,
        deviceId: data.deviceId,
        status: data.status
      });
    });
    
    return collections;
  } catch (error) {
    console.error('Error exporting data:', error);
    return [];
  }
}

// Clear all collections (admin only)
async function clearAllCollections() {
  if (!confirm('⚠️ WARNING: This will DELETE ALL COLLECTIONS. Are you absolutely sure?')) {
    return;
  }
  
  try {
    const batch = db.batch();
    const snapshot = await db.collection('collections').get();
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('All collections deleted');
    return true;
  } catch (error) {
    console.error('Error clearing collections:', error);
    return false;
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

console.log('Firebase initialized successfully');
console.log('Auth:', auth);
console.log('Firestore:', db);

// Export functions for use in dashboard.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    firebaseLogin,
    firebaseRegister,
    firebaseLogout,
    onAuthStateChanged,
    addCollection,
    listenToCollections,
    listenToFarmers,
    listenToDevices,
    getTodayStats,
    exportCollectionsToCSV,
    clearAllCollections
  };
}
