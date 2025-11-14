# Complete Setup Guide: Connecting Firebase & Google Cloud to Your Milk Traceability Project

## 📋 Prerequisites Checklist
- ✅ Firebase project created
- ✅ Google Cloud Platform account setup
- ✅ Project files downloaded/cloned

---

## 🔥 Part 1: Configure Firebase Web App

### Step 1: Get Your Firebase Configuration

1. **Go to Firebase Console**
   ```
   https://console.firebase.google.com
   ```

2. **Select your project** (the one you created)

3. **Add a Web App** (if you haven't already):
   - Click on the **</>** (Web) icon in Project Overview
   - App nickname: `Milk Traceability Dashboard`
   - ✅ Check "Also set up Firebase Hosting" (optional, for deployment)
   - Click **Register app**

4. **Copy Your Configuration**
   - You'll see something like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```
   - **COPY THIS ENTIRE OBJECT** - you'll need it in Step 2

### Step 2: Update firebase-config.js

1. **Open** `firebase-config.js` in your project folder

2. **Replace lines 24-30** with your actual Firebase config:

   **FIND THIS:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   };
   ```

   **REPLACE WITH YOUR ACTUAL CONFIG** (the one you copied in Step 1)

3. **Save the file**

---

## 🔐 Part 2: Enable Firebase Services

### Step 3: Enable Firestore Database

1. **In Firebase Console**, go to:
   - Build → **Firestore Database**
   
2. Click **"Create database"**

3. **Security Rules**: Choose **"Start in test mode"** (we'll secure it later)
   - Click **Next**

4. **Location**: Choose closest region (e.g., `asia-south1` for India, `us-central1` for USA)
   - Click **Enable**
   - Wait for provisioning (~30-60 seconds)

5. **Create Collections** (optional - the app will create them automatically):
   - Click **"+ Start collection"**
   - Collection ID: `collections`
   - Add a test document (Auto-ID):
     ```
     farmerId: "FP001" (string)
     farmerName: "Test Farmer" (string)
     quantity: 10 (number)
     fatContent: 4.5 (number)
     deviceId: "DEV001" (string)
     status: "Verified" (string)
     timestamp: (click clock icon for current timestamp)
     ```
   - Click **Save**

### Step 4: Enable Authentication

1. **In Firebase Console**, go to:
   - Build → **Authentication**
   
2. Click **"Get started"**

3. **Enable Email/Password**:
   - Click on **"Email/Password"** provider
   - Toggle **"Email/Password"** to **Enabled**
   - Leave "Email link (passwordless sign-in)" **disabled**
   - Click **Save**

4. **Create Your Admin Account**:
   - Go to **"Users"** tab
   - Click **"Add user"**
   - Email: `admin@milktrack.com` (or your preferred email)
   - Password: Choose a strong password (min 6 characters)
   - Click **"Add user"**
   - **📝 SAVE THESE CREDENTIALS** - you'll use them to login

### Step 5: Update Firestore Security Rules

1. **In Firestore Database**, go to the **"Rules"** tab

2. **Replace the default rules** with these:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Collections - authenticated users can read/write
       match /collections/{document} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null;
       }
       
       // Farmers - authenticated users can read/write
       match /farmers/{document} {
         allow read: if request.auth != null;
         allow create, update: if request.auth != null;
         allow delete: if false; // Prevent deletions
       }
       
       // Devices - authenticated users can read, admins can write
       match /devices/{document} {
         allow read: if request.auth != null;
         allow create, update: if request.auth != null;
         allow delete: if false;
       }
     }
   }
   ```

3. Click **"Publish"**

---

## 🧪 Part 3: Test Your Setup

### Step 6: Test the Web Application

1. **Open** `index.html` in a web browser
   - You can double-click the file, or
   - Use a local server: `python -m http.server 8000` or `npx serve`

2. **Click the floating milk button** (bottom-right corner with flask icon)

3. **Login** with the credentials you created in Step 4:
   - Email: `admin@milktrack.com`
   - Password: (the password you set)
   - Click **"Login to Dashboard"**

4. **Verify Connection**:
   - Open **Browser Console** (Press F12 → Console tab)
   - You should see:
     ```
     Firebase initialized successfully
     Using Firebase backend
     ```

5. **Test Adding Data**:
   - In the dashboard, go to **"Live Feed"** section
   - Fill out the **"Record New Collection"** form:
     ```
     Farmer ID: FP001
     Farmer Name: Test Farmer
     Quantity: 15.5
     Fat Content: (auto-filled)
     Device ID: DEV001
     ```
   - Click **"Record Collection"**
   - You should see success notification

6. **Verify in Firebase Console**:
   - Go back to Firebase Console → Firestore Database
   - You should see new documents in:
     - `collections` (your new entry)
     - `farmers` (farmer stats)
     - `devices` (device activity)

---

## 🌐 Part 4: Setup Google Cloud Function for ESP32 (OPTIONAL - For Production)

This step is **only needed if you want ESP32 devices to send data to Firebase**. Skip this if you're only using the web dashboard.

### Step 7: Install Firebase CLI

1. **Install Node.js** (if not already installed):
   - Download from: https://nodejs.org
   - Choose LTS version

2. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase**:
   ```bash
   firebase login
   ```
   - This will open a browser window for authentication

### Step 8: Initialize Cloud Functions

1. **Navigate to your project folder**:
   ```bash
   cd /home/wrench/projekt_mjyolk/up/yashasp2004.github.io-main
   ```

2. **Initialize Firebase Functions**:
   ```bash
   firebase init functions
   ```
   
   When prompted:
   - **Select project**: Choose your Firebase project
   - **Language**: JavaScript (or TypeScript if you prefer)
   - **ESLint**: No (or Yes if you want linting)
   - **Install dependencies**: Yes

3. **This will create**:
   - `functions/` folder
   - `functions/index.js` (main file)
   - `functions/package.json`

### Step 9: Create Device Ingest Endpoint

1. **Edit** `functions/index.js` and replace all content with:

   ```javascript
   const functions = require('firebase-functions');
   const admin = require('firebase-admin');
   admin.initializeApp();

   const db = admin.firestore();

   // Device authentication - set via: firebase functions:config:set devices.key="YOUR_SECRET_KEY"
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
         message: 'Collection recorded successfully'
       });
     } catch (error) {
       console.error('Error:', error);
       return res.status(500).json({ error: 'Internal server error' });
     }
   });
   ```

2. **Set Device Authentication Key**:
   ```bash
   firebase functions:config:set devices.key="YOUR-SUPER-SECRET-KEY-HERE"
   ```
   - Replace `YOUR-SUPER-SECRET-KEY-HERE` with a strong random key
   - **Save this key** - you'll need it for ESP32

3. **Deploy the Function**:
   ```bash
   firebase deploy --only functions
   ```
   
   - Wait for deployment (~1-2 minutes)
   - You'll get a URL like: `https://us-central1-YOUR-PROJECT.cloudfunctions.net/deviceIngest`
   - **Copy this URL** - you need it for ESP32 firmware

### Step 10: Update ESP32 Firmware

1. **Open** `esp32-firmware/milk_device.ino`

2. **Find and update these lines**:
   ```cpp
   // Firebase Cloud Function endpoint
   const char* cloudFunctionUrl = "https://us-central1-YOUR-PROJECT.cloudfunctions.net/deviceIngest";
   const char* deviceKey = "YOUR-SUPER-SECRET-KEY-HERE";
   ```

3. **Replace with**:
   - `cloudFunctionUrl`: Your actual Cloud Function URL from Step 9
   - `deviceKey`: The secret key you set in Step 9

4. **Upload to ESP32** (see FIRMWARE_INSTALLATION.md for details)

### Step 11: Test ESP32 → Firebase Connection

1. **Upload firmware** to ESP32

2. **Monitor Serial Output**:
   ```bash
   # In Arduino IDE: Tools → Serial Monitor
   # Or use: screen /dev/ttyUSB0 115200
   ```

3. **Test a milk collection** on the device

4. **Check Firebase Console**:
   - Go to Firestore Database
   - You should see new entry appear in real-time
   - Check web dashboard - data should appear automatically

---

## 🚀 Part 5: Deploy to Production (OPTIONAL)

### Option A: Firebase Hosting (Recommended - Free & Easy)

1. **Initialize Hosting**:
   ```bash
   firebase init hosting
   ```
   
   When prompted:
   - **Public directory**: `.` (current directory)
   - **Single-page app**: No
   - **Overwrite index.html**: No

2. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

3. **Your app will be live at**:
   ```
   https://YOUR-PROJECT-ID.web.app
   ```

### Option B: Custom Domain (with Firebase Hosting)

1. **In Firebase Console**:
   - Hosting → Add custom domain
   - Follow DNS setup instructions

2. **Update CNAME file** with your domain

---

## ✅ Verification Checklist

After completing the setup, verify:

- [ ] `firebase-config.js` has your actual Firebase credentials
- [ ] Firestore Database is created and accessible
- [ ] Authentication is enabled with Email/Password
- [ ] Admin user account created
- [ ] You can login to the dashboard
- [ ] You can add collections via web dashboard
- [ ] Data appears in Firebase Console in real-time
- [ ] Dashboard stats update automatically
- [ ] (Optional) Cloud Function is deployed for ESP32
- [ ] (Optional) ESP32 can send data to Firebase

---

## 🔧 Troubleshooting

### "Firebase is not defined" error
**Solution**: Make sure Firebase SDK scripts are loaded before `firebase-config.js`:
```html
<!-- These MUST come before firebase-config.js -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
```

### "Permission denied" errors in Firestore
**Solution**: 
- Check Firestore Rules (Step 5)
- Make sure you're logged in
- Verify rules published successfully

### "Using localStorage (demo mode)" message
**Cause**: Firebase not configured or user logged in with demo account

**Solution**:
1. Check `firebase-config.js` has real credentials
2. Login with Firebase Auth user (not `admin@milktrack.com` / `admin123`)

### Data not syncing between devices
**Solution**:
- Check browser console for errors
- Verify internet connection
- Check Firestore rules allow real-time listeners
- Make sure you're logged in on both devices

### ESP32 "401 Unauthorized" error
**Solution**:
- Verify device key matches in Cloud Function config and ESP32 code
- Check Cloud Function is deployed: `firebase functions:list`

### Cloud Function deployment fails
**Solution**:
- Upgrade to Blaze plan (Cloud Functions require Blaze, but still free tier available)
- Run: `firebase upgrade`
- Re-deploy: `firebase deploy --only functions`

---

## 💰 Cost Estimation

### Spark Plan (FREE - No Credit Card)
- ✅ Firestore: 1GB storage, 50K reads/day, 20K writes/day
- ✅ Authentication: Unlimited users
- ❌ Cloud Functions: NOT AVAILABLE

### Blaze Plan (Pay-as-you-go - FREE Tier Included)
- ✅ Everything in Spark Plan
- ✅ Cloud Functions: 125K invocations/month FREE, then $0.40/million
- ✅ **Expected cost for 4 devices, 50 farmers**: ₹0/month (within free tier)

**Recommendation**: 
- Use **Spark Plan** if only using web dashboard (no ESP32)
- Upgrade to **Blaze Plan** if using ESP32 devices (still free for small usage)

---

## 📚 Next Steps

1. ✅ Complete this setup guide
2. 📖 Read `FIRMWARE_INSTALLATION.md` for ESP32 setup
3. 📖 Read `HARDWARE_PARTS_LIST.md` for hardware components
4. 📖 Read `PIN_CONNECTIONS.md` for wiring diagram
5. 🧪 Test with sample data
6. 🚀 Deploy to production
7. 📊 Start tracking milk collections!

---

## 🆘 Need Help?

- 📖 **Firebase Docs**: https://firebase.google.com/docs
- 📖 **Firestore Docs**: https://firebase.google.com/docs/firestore
- 📧 **Contact**: Check README.md for support info

---

**Last Updated**: November 12, 2025
