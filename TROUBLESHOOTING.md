# 🔧 Troubleshooting Guide

Common issues and their solutions for the Milk Traceability System.

---

## 🔥 Firebase Connection Issues

### Issue: "Firebase is not defined" error
**Symptoms:**
- Browser console shows: `Uncaught ReferenceError: firebase is not defined`
- Dashboard doesn't load

**Solutions:**
1. **Check Script Order** - Firebase SDK must load BEFORE firebase-config.js
   ```html
   <!-- These MUST come first -->
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
   
   <!-- Then your config -->
   <script src="firebase-config.js"></script>
   ```

2. **Check Internet Connection** - Firebase CDN requires internet
3. **Clear Browser Cache** - Ctrl+F5 (hard refresh)
4. **Try Different Browser** - Test in Chrome/Firefox

---

### Issue: "Using localStorage (demo mode)" message
**Symptoms:**
- Console shows: "Using localStorage (demo mode)"
- Data doesn't sync to Firebase
- Changes don't appear in Firebase Console

**Causes:**
1. Firebase config not updated in `firebase-config.js`
2. Logged in with demo credentials

**Solutions:**

**Solution 1: Check firebase-config.js**
```javascript
// ❌ WRONG - Still has placeholder values
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  // ...
};

// ✅ CORRECT - Real values from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyC7Gh2KpL9nMx4Tv8Qq1Wr5Et6Ys3Df2Ij",
  authDomain: "milk-track-12345.firebaseapp.com",
  projectId: "milk-track-12345",
  // ...
};
```

**Solution 2: Don't use demo account**
- Demo credentials: `admin@milktrack.com` / `admin123`
- These bypass Firebase (for offline testing)
- Use credentials you created in Firebase Authentication instead

**Verify Fix:**
```javascript
// Open browser console and check:
console.log(firebase.app().options);
// Should show YOUR project ID, not "your-project-id"
```

---

### Issue: "auth/invalid-api-key" error
**Symptoms:**
- Console shows: `Firebase: Error (auth/invalid-api-key)`
- Can't login

**Solutions:**
1. **Re-copy API key from Firebase Console**
   - Go to Project Settings → General → Your apps
   - Copy config again
   - Make sure no extra spaces/quotes

2. **Check API key restrictions in Google Cloud**
   - Go to: https://console.cloud.google.com
   - APIs & Services → Credentials
   - Find your API key
   - Remove restrictions or add your domain

---

## 🗄️ Firestore Issues

### Issue: "Permission denied" errors
**Symptoms:**
- Console shows: `FirebaseError: Missing or insufficient permissions`
- Can't read/write data
- Dashboard shows no data

**Solutions:**

**Solution 1: Update Firestore Rules**
```javascript
// Go to: Firebase Console → Firestore → Rules

// ❌ WRONG - Production mode (denies all)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

// ✅ CORRECT - Allows authenticated users
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Solution 2: Make sure you're logged in**
```javascript
// Check in browser console:
firebase.auth().currentUser
// Should show user object, not null
```

**Solution 3: Check Authentication enabled**
- Firebase Console → Authentication
- Email/Password provider should be **Enabled**

---

### Issue: Data not syncing between browsers
**Symptoms:**
- Add data in Browser A
- Doesn't appear in Browser B
- No real-time updates

**Solutions:**

1. **Check both browsers are logged in** with Firebase account
2. **Verify real-time listeners are active**
   ```javascript
   // In browser console, you should see:
   "Listening to collections"
   "Listening to farmers"
   "Listening to devices"
   ```

3. **Check Firestore Rules allow reads**
   ```javascript
   allow read: if request.auth != null;
   ```

4. **Refresh browsers** (Ctrl+R)

5. **Check Firebase quota not exceeded**
   - Firebase Console → Usage
   - Should be well below limits

---

### Issue: Timestamps showing as null
**Symptoms:**
- `timestamp: null` in data
- Can't sort by time

**Solutions:**

**Use server timestamp, not client time:**
```javascript
// ❌ WRONG
timestamp: new Date().toISOString()

// ✅ CORRECT
timestamp: firebase.firestore.FieldValue.serverTimestamp()
```

**Convert for display:**
```javascript
// In listeners:
const data = doc.data();
const timestamp = data.timestamp ? data.timestamp.toDate() : new Date();
```

---

## 🔐 Authentication Issues

### Issue: Can't login / "auth/user-not-found"
**Symptoms:**
- Error: `There is no user record corresponding to this identifier`
- Login fails

**Solutions:**

1. **Verify user exists in Firebase**
   - Firebase Console → Authentication → Users
   - Should see your email listed

2. **Re-create user if needed**
   - Click "Add user"
   - Use same email/password

3. **Check email spelling** - Must match exactly

---

### Issue: "auth/wrong-password"
**Symptoms:**
- Error: `The password is invalid`
- Can't login even with correct password

**Solutions:**

1. **Try password reset**
   - Firebase Console → Authentication → Users
   - Click menu (⋮) next to user → Reset password

2. **Re-create user account**
   - Delete old user
   - Create new with same email

3. **Check Caps Lock** is off

---

## 🌐 Cloud Functions Issues (ESP32)

### Issue: 401 Unauthorized from ESP32
**Symptoms:**
- ESP32 gets HTTP 401 response
- Data not reaching Firebase
- Serial monitor shows: "Unauthorized"

**Solutions:**

1. **Verify device key matches**
   ```bash
   # Get configured key:
   firebase functions:config:get
   
   # Should match key in ESP32 code:
   const char* deviceKey = "YOUR-SECRET-KEY";
   ```

2. **Set device key if not set**
   ```bash
   firebase functions:config:set devices.key="YOUR-SECRET-KEY"
   firebase deploy --only functions
   ```

3. **Check header format in ESP32**
   ```cpp
   // Must be exactly:
   http.addHeader("x-device-key", deviceKey);
   ```

---

### Issue: Cloud Function not found (404)
**Symptoms:**
- ESP32 gets HTTP 404
- URL doesn't work
- Serial monitor shows: "Not Found"

**Solutions:**

1. **Verify function deployed**
   ```bash
   firebase functions:list
   # Should show: deviceIngest
   ```

2. **Re-deploy function**
   ```bash
   firebase deploy --only functions
   ```

3. **Check URL in ESP32 code**
   ```cpp
   // Should be from deploy output:
   const char* cloudFunctionUrl = "https://us-central1-YOUR-PROJECT.cloudfunctions.net/deviceIngest";
   ```

4. **Test function with curl**
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "x-device-key: YOUR-SECRET-KEY" \
     -d '{"farmerId":"FP001","farmerName":"Test","quantity":10,"deviceId":"DEV001"}' \
     https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/deviceIngest
   ```

---

### Issue: "Billing account required" error
**Symptoms:**
- Can't deploy Cloud Functions
- Error: `Cloud Functions deployment requires billing account`

**Solutions:**

1. **Upgrade to Blaze Plan** (still has free tier!)
   - Firebase Console → Upgrade
   - Add billing account
   - Don't worry - free tier covers normal usage

2. **Alternative: Use Firestore REST API** (not recommended for production)
   - ESP32 writes directly to Firestore
   - Less secure (exposes credentials)
   - See alternative code in ESP32_API_ENDPOINTS.md

---

## 💻 Dashboard Issues

### Issue: Dashboard blank / white screen
**Symptoms:**
- Dashboard loads but shows nothing
- No errors in console

**Solutions:**

1. **Check authentication**
   ```javascript
   // Console should show:
   localStorage.getItem('milktrack_user')
   // Should NOT be null
   ```

2. **Clear localStorage and re-login**
   ```javascript
   localStorage.clear();
   // Then reload and login again
   ```

3. **Check HTML files** - Make sure dashboard.html exists

---

### Issue: Stats showing 0 even with data
**Symptoms:**
- Added collections
- Feed shows data
- But stats show: "0 L", "0 farmers", etc.

**Solutions:**

1. **Check date filters**
   ```javascript
   // Make sure collections are from TODAY
   const today = new Date().toISOString().split('T')[0];
   ```

2. **Manually trigger stats update**
   ```javascript
   // In browser console:
   updateAllStats();
   ```

3. **Check timestamp format** in Firestore
   - Should be Firestore Timestamp type
   - Not string

---

### Issue: Export CSV doesn't work
**Symptoms:**
- Click "Export CSV" button
- Nothing happens

**Solutions:**

1. **Check if there's data**
   ```javascript
   // Console:
   console.log(collectionsData.length);
   // Should be > 0
   ```

2. **Check browser pop-up blocker**
   - Allow pop-ups for this site

3. **Try manual export**
   ```javascript
   // Console:
   exportData();
   ```

---

## 📱 ESP32 Hardware Issues

### Issue: ESP32 can't connect to WiFi
**Symptoms:**
- Serial: "Connecting to WiFi..."
- Never connects
- Timeout

**Solutions:**

1. **Check WiFi credentials**
   ```cpp
   const char* ssid = "YOUR_WIFI_NAME";  // Case-sensitive!
   const char* password = "YOUR_PASSWORD"; // Exact password
   ```

2. **Check WiFi band** - ESP32 only supports 2.4GHz (not 5GHz)

3. **Move closer to router** - Signal might be weak

4. **Check WiFi security** - WPA2 recommended

---

### Issue: Fingerprint sensor not detecting
**Symptoms:**
- Can't enroll fingerprints
- Always fails to match

**Solutions:**

1. **Check wiring** - See PIN_CONNECTIONS.md

2. **Test sensor independently**
   ```cpp
   // In setup():
   if (finger.verifyPassword()) {
     Serial.println("Sensor OK!");
   } else {
     Serial.println("Sensor FAILED!");
   }
   ```

3. **Clean sensor** - Use soft cloth

4. **Try different finger** - Some fingers scan better

---

### Issue: Load cell always reads 0
**Symptoms:**
- Weight always shows 0.0 kg
- No matter what's on scale

**Solutions:**

1. **Check HX711 wiring** - See PIN_CONNECTIONS.md

2. **Calibrate load cell**
   ```cpp
   scale.set_scale(CALIBRATION_FACTOR); // Adjust this value
   scale.tare(); // Reset to zero
   ```

3. **Test with known weight**

4. **Check power supply** - HX711 needs stable 5V

---

## 🌍 Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ⚠️ Internet Explorer - NOT supported

### If using unsupported browser:
- Upgrade to latest version
- Or switch to Chrome/Firefox

---

## 🐛 General Debugging Tips

### 1. Always Check Browser Console
```
Press F12 → Console tab
Look for red error messages
```

### 2. Check Firebase Console
```
Firestore → Data (see actual data)
Authentication → Users (verify logged in)
Usage → Check quotas
```

### 3. Test in Incognito Mode
```
Ctrl+Shift+N (Chrome)
Ctrl+Shift+P (Firefox)
Isolates from extensions/cache
```

### 4. Enable Verbose Logging
```javascript
// Add to firebase-config.js:
firebase.firestore.setLogLevel('debug');
```

### 5. Check Network Tab
```
F12 → Network tab
See actual API requests/responses
Look for 4xx/5xx errors
```

---

## 📞 Still Having Issues?

If nothing above helps:

1. **Check SETUP_CHECKLIST.md** - Did you complete all steps?
2. **Re-read SETUP_GUIDE.md** - Might have missed something
3. **Review ARCHITECTURE.md** - Understand the system flow
4. **Firebase Status**: https://status.firebase.google.com
5. **Firebase Support**: https://firebase.google.com/support

---

## ✅ Prevention Checklist

Avoid issues by:

- [ ] Using SETUP_CHECKLIST.md during setup
- [ ] Testing each step before moving to next
- [ ] Saving credentials securely
- [ ] Checking browser console regularly
- [ ] Keeping Firebase SDK versions up to date
- [ ] Backing up firebase-config.js after editing
- [ ] Testing in multiple browsers
- [ ] Using version control (Git)

---

_Last Updated: November 12, 2025_
