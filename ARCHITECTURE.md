# System Architecture - How Everything Connects

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FIREBASE (Google Cloud)                      │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Authentication│  │   Firestore  │  │  Cloud Functions       │   │
│  │               │  │   Database   │  │  (Optional for ESP32)  │   │
│  │ • Email/Pass  │  │              │  │                        │   │
│  │ • User Mgmt   │  │ Collections: │  │  /deviceIngest         │   │
│  └───────┬───────┘  │ • collections│  │  - Validates device    │   │
│          │          │ • farmers    │  │  - Writes to Firestore │   │
│          │          │ • devices    │  └────────────┬───────────┘   │
│          │          └──────┬───────┘               │               │
│          │                 │                       │               │
└──────────┼─────────────────┼───────────────────────┼───────────────┘
           │                 │                       │
           │                 │                       │
    ┌──────▼─────────────────▼───────┐       ┌──────▼────────┐
    │    Web Dashboard (Browser)     │       │  ESP32 Devices│
    │  ┌──────────────────────────┐  │       │               │
    │  │   index.html             │  │       │ • Fingerprint │
    │  │   • Login Portal         │  │       │ • Load Cell   │
    │  │   • Floating Milk Button │  │       │ • WiFi Module │
    │  └──────────────────────────┘  │       │ • LCD Display │
    │                                 │       │               │
    │  ┌──────────────────────────┐  │       │ Sends HTTP    │
    │  │   dashboard.html         │  │       │ POST to       │
    │  │   • Live Feed            │  │       │ Cloud Function│
    │  │   • Stats                │  │       └───────────────┘
    │  │   • Farmers List         │  │
    │  │   • Device Status        │  │
    │  │   • Analytics            │  │
    │  └──────────────────────────┘  │
    │                                 │
    │  ┌──────────────────────────┐  │
    │  │   firebase-config.js     │  │
    │  │   • Firebase SDK Init    │◄─────── YOU EDIT THIS FILE
    │  │   • Auth Functions       │  │       (Add your config)
    │  │   • Firestore Functions  │  │
    │  │   • Real-time Listeners  │  │
    │  └──────────────────────────┘  │
    │                                 │
    │  ┌──────────────────────────┐  │
    │  │   dashboard.js           │  │
    │  │   • UI Logic             │  │
    │  │   • Data Rendering       │  │
    │  │   • Stats Calculation    │  │
    │  └──────────────────────────┘  │
    └─────────────────────────────────┘
```

## Data Flow Diagram

### Web Dashboard Flow:
```
User Opens Browser
    │
    ▼
index.html loads
    │
    ├─► Loads Firebase SDKs
    ├─► Loads firebase-config.js ◄── Your credentials here!
    └─► Loads milk-track.js
    │
    ▼
User clicks "Milk Button"
    │
    ▼
Login Modal appears
    │
    ▼
User enters credentials
    │
    ▼
Firebase Auth validates
    │
    ├─► Success ──► Redirect to dashboard.html
    │
    └─► Failure ──► Show error
    │
    ▼
Dashboard loads
    │
    ├─► dashboard.js initializes
    ├─► Detects Firebase configured
    ├─► Sets up real-time listeners
    │   └─► listenToCollections()
    │       listenToFarmers()
    │       listenToDevices()
    │
    ▼
User adds milk collection
    │
    ▼
dashboard.js → addCollection()
    │
    ▼
firebase-config.js → db.collection('collections').add()
    │
    ▼
Firestore Database (Cloud)
    │
    ▼
Real-time listener triggered
    │
    ▼
Dashboard updates automatically! ✨
```

### ESP32 Device Flow (Optional):
```
Farmer scans fingerprint
    │
    ▼
ESP32 validates fingerprint
    │
    ▼
Load cell measures milk
    │
    ▼
Fat sensor reads quality
    │
    ▼
ESP32 prepares JSON:
{
  "farmerId": "FP001",
  "farmerName": "Rajesh Kumar",
  "quantity": 15.5,
  "fatContent": 4.2,
  "deviceId": "DEV001",
  "status": "Verified"
}
    │
    ▼
HTTP POST to Cloud Function
+ Header: x-device-key: SECRET_KEY
    │
    ▼
Cloud Function validates key
    │
    ├─► Invalid ──► 401 Unauthorized
    │
    └─► Valid ──┐
                │
                ▼
        Write to Firestore
        • collections
        • farmers (update stats)
        • devices (update activity)
                │
                ▼
        Return success to ESP32
                │
                ▼
        Dashboard listeners triggered
                │
                ▼
        All connected browsers update! 🎉
```

## File Structure

```
yashasp2004.github.io-main/
├── index.html              ← Landing page with login
├── dashboard.html          ← Main dashboard interface
│
├── firebase-config.js      ← ⚠️ EDIT THIS WITH YOUR CONFIG ⚠️
├── dashboard.js            ← Dashboard logic
├── milk-track.js           ← Login handling
├── script.js               ← General scripts
│
├── styles.css              ← Landing page styles
├── dashboard-styles.css    ← Dashboard styles
│
├── SETUP_GUIDE.md          ← Complete setup instructions
├── QUICK_START.md          ← 5-minute quick start
├── FIREBASE_SETUP.md       ← Original Firebase guide
│
├── esp32-firmware/
│   ├── milk_device.ino     ← ESP32 main firmware
│   └── platformio.ini      ← PlatformIO config
│
└── Documentation/
    ├── ESP32_API_ENDPOINTS.md
    ├── HARDWARE_PARTS_LIST.md
    ├── PIN_CONNECTIONS.md
    ├── FIRMWARE_INSTALLATION.md
    └── PROJECT_SUMMARY.md
```

## What You Need to Edit

### 1. firebase-config.js (REQUIRED)
```javascript
// Line 24-30: Replace with YOUR Firebase config
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",           // ← Change this
  authDomain: "YOUR_PROJECT.firebaseapp.com", // ← Change this
  projectId: "YOUR_PROJECT_ID",            // ← Change this
  storageBucket: "YOUR_PROJECT.appspot.com", // ← Change this
  messagingSenderId: "YOUR_MSG_ID",        // ← Change this
  appId: "YOUR_APP_ID"                     // ← Change this
};
```

### 2. functions/index.js (OPTIONAL - only for ESP32)
```javascript
// No changes needed, just deploy!
// Set device key via: firebase functions:config:set devices.key="SECRET"
```

### 3. esp32-firmware/milk_device.ino (OPTIONAL - only for ESP32)
```cpp
// Update Cloud Function URL and device key
const char* cloudFunctionUrl = "https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/deviceIngest";
const char* deviceKey = "YOUR_SECRET_KEY";
```

## Security Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: Firebase Authentication      │
│  • Email/Password required              │
│  • No access without login              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Layer 2: Firestore Security Rules     │
│  • read/write: if request.auth != null │
│  • Only authenticated users             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Layer 3: Cloud Function Auth          │
│  • x-device-key header required         │
│  • Secret key validation                │
│  • Only authorized devices              │
└─────────────────────────────────────────┘
```

## Real-time Sync

```
Browser A                    Firestore Cloud               Browser B
    │                              │                           │
    │  Add collection              │                           │
    ├─────────────────────────────►│                           │
    │                              │                           │
    │  ◄────── Success ────────────┤                           │
    │                              │                           │
    │                              │  onSnapshot() triggered   │
    │                              ├──────────────────────────►│
    │                              │                           │
    │                              │  ◄── Auto update UI ──────┤
    │                              │                           │
    │  onSnapshot() triggered      │                           │
    │  ◄───────────────────────────┤                           │
    │                              │                           │
    │  Auto update UI              │                           │
    │                              │                           │
    
    Both browsers show the same data in real-time! ✨
```

## Cost Breakdown

### FREE Tier (Spark Plan)
- Web dashboard: **FREE**
- Authentication: **FREE**
- Firestore: **FREE** (up to 50K reads, 20K writes/day)
- Hosting: **FREE** (10GB/month)

**Total for web-only: ₹0/month**

### With ESP32 (Blaze Plan required)
- Everything above: **FREE**
- Cloud Functions: **FREE** (125K calls/month)
- Estimated usage (4 devices): ~3,000 calls/month
- **Total: ₹0/month** (within free tier)

---

**Need help? See SETUP_GUIDE.md or QUICK_START.md**
