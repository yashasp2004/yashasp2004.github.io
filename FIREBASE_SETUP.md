# FIREBASE SETUP GUIDE - MILK TRACEABILITY SYSTEM

## Step-by-Step Firebase Configuration (100% FREE)

### 1. Create Firebase Project (5 minutes)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Click "Add project" or "Create a project"

2. **Project Details**
   - Project name: `milk-traceability` (or your choice)
   - Click "Continue"
   
3. **Google Analytics** (Optional)
   - Toggle OFF (not needed for this project)
   - Click "Create project"
   - Wait for project creation (~30 seconds)
   - Click "Continue"

### 2. Enable Firestore Database (3 minutes)

1. **Navigate to Firestore**
   - In left sidebar: Build → Firestore Database
   - Click "Create database"

2. **Security Rules**
   - Choose "Start in **test mode**" (we'll secure it later)
   - Click "Next"

3. **Location**
   - Select closest location (e.g., `asia-south1` for India)
   - Click "Enable"
   - Wait for provisioning (~1 minute)

4. **Create Collections** (do this manually or let the app create them)
   - Click "+ Start collection"
   - Collection ID: `collections`
   - Add a sample document (will be replaced by real data):
     - Document ID: Auto-ID
     - Fields:
       - `timestamp`: timestamp (now)
       - `farmerId`: string (`FP001`)
       - `farmerName`: string (`Test Farmer`)
       - `quantity`: number (`10`)
       - `fatContent`: number (`4.5`)
       - `deviceId`: string (`DEV001`)
       - `status`: string (`Verified`)
   - Click "Save"

5. **Repeat for other collections:**
   - `farmers` (leave empty for now)
   - `devices` (leave empty for now)

### 3. Enable Authentication (2 minutes)

1. **Navigate to Authentication**
   - In left sidebar: Build → Authentication
   - Click "Get started"

2. **Enable Email/Password**
   - Click "Email/Password" provider
   - Toggle "Email/Password" to **Enabled**
   - Leave "Email link" disabled
   - Click "Save"

3. **Create First User** (Admin Account)
   - Go to "Users" tab
   - Click "Add user"
   - Email: `admin@milktrack.com` (or your email)
   - Password: Create a strong password (min 6 chars)
   - Click "Add user"

### 4. Get Web App Configuration (3 minutes)

1. **Register Web App**
   - Go to Project Overview (home icon in left sidebar)
   - Click the **</>** (web) icon
   - App nickname: `Milk Dashboard`
   - Do NOT check "Firebase Hosting"
   - Click "Register app"

2. **Copy Configuration**
   - You'll see code like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...yourkey...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   };
   ```
   - **COPY THIS ENTIRE OBJECT**
   - Click "Continue to console"

3. **Update Your Code**
   - Open `firebase-config.js` in your project
   - Replace the placeholder config (lines 24-30) with YOUR config:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
     // ... paste all your values
   };
   ```
   - Save the file

### 5. Update Firestore Security Rules (3 minutes)

1. **Navigate to Rules**
   - Firestore Database → Rules tab

2. **Replace Default Rules**
   - Delete existing rules
   - Paste this:
   ```rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Collections - authenticated users can read/write
       match /collections/{document} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
         allow update, delete: if request.auth.uid != null; // Optional: restrict
       }
       
       // Farmers - authenticated users can read/write
       match /farmers/{document} {
         allow read: if request.auth != null;
         allow create, update: if request.auth != null;
         allow delete: if false; // Prevent deletions
       }
       
       // Devices - authenticated users can read, only server can write
       match /devices/{document} {
         allow read: if request.auth != null;
         allow create, update: if request.auth != null; // For now, allow writes
         allow delete: if false;
       }
     }
   }
   ```
   - Click "Publish"

### 6. Test Your Setup (2 minutes)

1. **Open Your Dashboard**
   - Open `index.html` in a browser
   - Click the floating milk button (bottom-right)

2. **Login**
   - Email: The email you created in Authentication
   - Password: The password you set
   - Click "Login to Dashboard"

3. **Verify Connection**
   - Open browser console (F12)
   - You should see: "Firebase initialized successfully"
   - You should see: "Using Firebase backend"
   - Try adding a collection - it should appear in Firebase console

4. **Check Firestore**
   - Go back to Firebase Console → Firestore Database
   - You should see new documents in `collections`, `farmers`, and `devices`

---

## For ESP32 Devices: Cloud Function Setup

### Option A: Direct Firestore Write (Not Recommended - Security Risk)

ESP32 can write directly to Firestore using REST API, but this exposes your API key.

### Option B: Cloud Function (Recommended - Secure)

Use Firebase Cloud Functions to create a secure endpoint for ESP32 devices.

#### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 2. Login and Initialize

```bash
firebase login
cd /path/to/your/project
firebase init functions
```

- Select your project
- Choose JavaScript or TypeScript
- Install dependencies: Yes

#### 3. Create Device Ingest Function

Edit `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Device authentication key (set via: firebase functions:config:set devices.key="your_secret_key")
exports.deviceIngest = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-device-key');
    return res.status(204).send('');
  }

  // Validate device key
  const DEVICE_KEY = functions.config().devices?.key || 'demo-key-12345';
  const providedKey = req.get('x-device-key');
  
  if (!providedKey || providedKey !== DEVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid device key' });
  }

  // Validate payload
  const { farmerId, farmerName, quantity, fatContent, deviceId, status } = req.body;
  
  if (!farmerId || !farmerName || !quantity || !deviceId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Add collection
    const collectionRef = await db.collection('collections').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      farmerId,
      farmerName,
      quantity: parseFloat(quantity),
      fatContent: parseFloat(fatContent || 0),
      deviceId,
      status: status || 'Verified',
      createdAt: new Date().toISOString()
    });

    // Update farmer stats
    const farmerRef = db.collection('farmers').doc(farmerId);
    const farmerDoc = await farmerRef.get();
    
    if (farmerDoc.exists) {
      await farmerRef.update({
        totalDeposits: admin.firestore.FieldValue.increment(1),
        totalQuantity: admin.firestore.FieldValue.increment(parseFloat(quantity)),
        lastDeposit: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await farmerRef.set({
        id: farmerId,
        name: farmerName,
        fingerprintStatus: 'Registered',
        totalDeposits: 1,
        totalQuantity: parseFloat(quantity),
        lastDeposit: admin.firestore.FieldValue.serverTimestamp(),
        registeredAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Update device stats
    await db.collection('devices').doc(deviceId).set({
      deviceId,
      lastActivity: admin.firestore.FieldValue.serverTimestamp(),
      online: true
    }, { merge: true });

    return res.status(200).json({ 
      success: true, 
      id: collectionRef.id,
      message: 'Collection recorded'
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### 4. Set Device Key

```bash
firebase functions:config:set devices.key="your-super-secret-key-here"
```

#### 5. Deploy Function

```bash
firebase deploy --only functions
```

Copy the function URL from output (e.g., `https://us-central1-YOUR-PROJECT.cloudfunctions.net/deviceIngest`)

#### 6. Update ESP32 Code

In your ESP32 code, set:
```cpp
const char* functionUrl = "https://us-central1-YOUR-PROJECT.cloudfunctions.net/deviceIngest";
const char* deviceKey = "your-super-secret-key-here";
```

---

## Costs & Limits (FREE Tier)

**Spark Plan (No Credit Card)**:
- ✅ Firestore: 1GB storage, 50K reads/day, 20K writes/day
- ✅ Cloud Functions: 125K invocations/month, 40K GB-sec
- ✅ Authentication: Unlimited
- ✅ **TOTAL COST: ₹0/month**

**For 4 devices, 50 farmers, ~500-1000 collections/day:**
- Estimated writes: ~1,500/day (collections + farmers + devices)
- Estimated reads: ~5,000/day (dashboard refreshes)
- **Verdict: Well within free limits**

**When to Upgrade (Blaze Plan)**:
- If you exceed 20K writes/day (~60+ active devices)
- If you exceed 50K reads/day (heavy dashboard usage)
- Blaze costs: ~$0.06 per 100K reads, ~$0.18 per 100K writes

---

## Troubleshooting

### "Permission denied" errors
- Check Firestore Rules (step 5)
- Make sure user is authenticated
- Verify timestamps are server-generated

### "API key invalid"
- Double-check firebase-config.js has correct values
- Regenerate web app config in Firebase console

### ESP32 can't connect
- Verify Cloud Function is deployed
- Check device key matches
- Test function URL in Postman/curl first

### Data not appearing
- Check browser console for errors
- Verify Firebase SDK loaded (check Network tab)
- Check Firestore console for actual data

---

## Next Steps

1. ✅ Configure Firebase (follow steps above)
2. ✅ Update `firebase-config.js` with your credentials
3. ✅ Create admin user in Firebase Authentication
4. ✅ Test dashboard login and data entry
5. ⏭️ Deploy Cloud Function for ESP32 (optional, for production)
6. ⏭️ Update ESP32 firmware with Cloud Function URL

**Demo Mode**: If you don't configure Firebase, the dashboard will work in localStorage mode (offline, data not synced).
