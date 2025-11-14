# Firebase Setup Checklist

## ✅ Pre-Setup
- [ ] Firebase project created
- [ ] Google Cloud Platform account setup
- [ ] Project files downloaded to local computer

---

## 🔥 Firebase Configuration

### Step 1: Get Firebase Credentials
- [ ] Opened Firebase Console (https://console.firebase.google.com)
- [ ] Selected my project
- [ ] Clicked on **</>** (Web) icon
- [ ] Registered app with name: "Milk Traceability Dashboard"
- [ ] Copied `firebaseConfig` object

### Step 2: Update Code
- [ ] Opened `firebase-config.js` in editor
- [ ] Located lines 24-30 (the `firebaseConfig` object)
- [ ] Replaced placeholder values with MY actual Firebase config
- [ ] Saved the file
- [ ] Double-checked all values are correct (no "XXX" or "your-project")

**My Firebase Config Values:**
```
Project ID: ___________________
Auth Domain: ___________________
API Key: ___________________
```

---

## 🗄️ Firestore Database Setup

### Step 3: Enable Firestore
- [ ] In Firebase Console → Build → Firestore Database
- [ ] Clicked "Create database"
- [ ] Selected "Start in test mode"
- [ ] Chose location: ___________________
- [ ] Clicked "Enable"
- [ ] Waited for provisioning to complete

### Step 4: Create Collections (Optional)
- [ ] Created `collections` collection
- [ ] Added test document
- [ ] Created `farmers` collection (can be empty)
- [ ] Created `devices` collection (can be empty)

### Step 5: Update Security Rules
- [ ] Went to Firestore Database → Rules tab
- [ ] Replaced default rules with authentication-required rules
- [ ] Clicked "Publish"
- [ ] Verified rules are active

---

## 🔐 Authentication Setup

### Step 6: Enable Authentication
- [ ] In Firebase Console → Build → Authentication
- [ ] Clicked "Get started"
- [ ] Enabled "Email/Password" provider
- [ ] Saved provider settings

### Step 7: Create Admin User
- [ ] Went to Authentication → Users tab
- [ ] Clicked "Add user"
- [ ] Created admin account:
  - Email: ___________________
  - Password: ___________________ (saved securely!)
- [ ] Clicked "Add user"

---

## 🧪 Testing

### Step 8: Test Web Dashboard
- [ ] Opened `index.html` in web browser
- [ ] Clicked floating milk button (bottom-right)
- [ ] Login modal appeared
- [ ] Logged in with admin credentials
- [ ] Successfully redirected to dashboard

### Step 9: Verify Firebase Connection
- [ ] Opened browser console (F12)
- [ ] Saw message: "Firebase initialized successfully"
- [ ] Saw message: "Using Firebase backend"
- [ ] NO errors in console

### Step 10: Test Data Entry
- [ ] Filled out "Record New Collection" form:
  - Farmer ID: FP001
  - Farmer Name: Test Farmer
  - Quantity: 15.5
  - Device: DEV001
- [ ] Clicked "Record Collection"
- [ ] Saw success notification
- [ ] Data appeared in feed table

### Step 11: Verify in Firebase Console
- [ ] Opened Firebase Console → Firestore Database
- [ ] Saw new document in `collections` collection
- [ ] Saw new document in `farmers` collection
- [ ] Saw new document in `devices` collection
- [ ] Timestamp is correct

### Step 12: Test Real-time Sync
- [ ] Opened dashboard in second browser/tab
- [ ] Added collection in first browser
- [ ] Data appeared automatically in second browser
- [ ] Stats updated in both browsers

---

## 🌐 Cloud Functions (Optional - For ESP32)

### Step 13: Install Firebase CLI
- [ ] Installed Node.js (if needed)
- [ ] Ran: `npm install -g firebase-tools`
- [ ] Ran: `firebase login`
- [ ] Successfully authenticated

### Step 14: Initialize Functions
- [ ] Navigated to project folder
- [ ] Ran: `firebase init functions`
- [ ] Selected JavaScript
- [ ] Installed dependencies
- [ ] `functions/` folder created

### Step 15: Create Device Endpoint
- [ ] Edited `functions/index.js`
- [ ] Added `deviceIngest` function code
- [ ] Saved file

### Step 16: Configure & Deploy
- [ ] Generated strong secret key: ___________________
- [ ] Ran: `firebase functions:config:set devices.key="SECRET"`
- [ ] Ran: `firebase deploy --only functions`
- [ ] Deployment succeeded
- [ ] Copied function URL: ___________________

### Step 17: Update ESP32 Firmware
- [ ] Opened `esp32-firmware/milk_device.ino`
- [ ] Updated `cloudFunctionUrl` with MY function URL
- [ ] Updated `deviceKey` with MY secret key
- [ ] Saved file

### Step 18: Test ESP32
- [ ] Uploaded firmware to ESP32
- [ ] ESP32 connected to WiFi
- [ ] Tested milk collection
- [ ] Data appeared in Firestore
- [ ] Data appeared in web dashboard

---

## 🚀 Deployment (Optional)

### Step 19: Deploy to Firebase Hosting
- [ ] Ran: `firebase init hosting`
- [ ] Selected current directory as public folder
- [ ] Ran: `firebase deploy --only hosting`
- [ ] Got hosting URL: ___________________
- [ ] Tested live site
- [ ] Login works on live site

### Step 20: Custom Domain (Optional)
- [ ] Added custom domain in Firebase Console
- [ ] Updated DNS records
- [ ] Verified domain
- [ ] SSL certificate provisioned
- [ ] Site accessible at: ___________________

---

## 🎉 Success Criteria

All these should be working:

- ✅ Can login to dashboard with Firebase credentials
- ✅ Dashboard shows "Using Firebase backend"
- ✅ Can add milk collections via web interface
- ✅ Data saves to Firestore in real-time
- ✅ Multiple browsers sync automatically
- ✅ Stats update automatically
- ✅ Device status cards work
- ✅ Farmers list populates
- ✅ Export to CSV works
- ✅ (ESP32) Devices can send data to Firebase
- ✅ (ESP32) Cloud Function validates requests
- ✅ No console errors

---

## ❌ Troubleshooting

If something doesn't work:

### "Using localStorage (demo mode)" message
**Fix:** 
- [ ] Checked `firebase-config.js` has real values (not XXX)
- [ ] Logged in with Firebase Auth user (not demo account)

### "Permission denied" in Firestore
**Fix:**
- [ ] Checked Firestore Rules allow authenticated reads/writes
- [ ] Verified user is logged in
- [ ] Checked browser console for auth errors

### Data doesn't appear
**Fix:**
- [ ] Checked browser console for errors
- [ ] Verified internet connection
- [ ] Checked Firestore Console shows data
- [ ] Tried refreshing browser

### ESP32 can't connect
**Fix:**
- [ ] Verified Cloud Function URL is correct
- [ ] Checked device key matches
- [ ] Tested function with curl/Postman first
- [ ] Checked ESP32 WiFi connection

---

## 📝 Notes & Issues

(Write any issues you encountered and how you fixed them)

___________________________________________________

___________________________________________________

___________________________________________________

---

## ✅ Completion

Setup completed on: ___________________

Verified by: ___________________

Ready for production: [ ] Yes [ ] No

---

**Next Steps:**
1. [ ] Read HARDWARE_PARTS_LIST.md for components
2. [ ] Read PIN_CONNECTIONS.md for wiring
3. [ ] Read FIRMWARE_INSTALLATION.md for ESP32 setup
4. [ ] Start collecting real milk data!
