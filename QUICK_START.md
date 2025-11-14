# 🚀 Quick Start Guide - 5 Minutes to Get Running

## Step 1: Get Firebase Config (2 minutes)

1. Go to: https://console.firebase.google.com
2. Select your project
3. Click **</>** (Web icon) → Register app
4. **Copy the config object** that looks like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "yourproject.firebaseapp.com",
     projectId: "yourproject",
     // ... etc
   };
   ```

## Step 2: Update Your Code (1 minute)

1. Open `firebase-config.js` in your project
2. Find **lines 24-30**
3. **Replace** the placeholder config with YOUR config from Step 1
4. **Save** the file

## Step 3: Enable Firestore & Auth (2 minutes)

### Firestore:
1. Firebase Console → Build → **Firestore Database**
2. **Create database** → **Test mode** → Choose location → **Enable**

### Authentication:
1. Firebase Console → Build → **Authentication**
2. **Get started** → Enable **Email/Password**
3. Users tab → **Add user**:
   - Email: `admin@milktrack.com`
   - Password: (choose a strong password)
   - **Save these credentials!**

## Step 4: Update Security Rules (1 minute)

1. Firestore Database → **Rules** tab
2. Replace with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
3. Click **Publish**

## Step 5: Test! 🎉

1. Open `index.html` in a browser
2. Click the **floating milk button** (bottom-right)
3. **Login** with your credentials from Step 3
4. Try **adding a milk collection**
5. Check **Firebase Console** → Firestore - you should see data!

---

## ✅ Success Indicators

- Browser console shows: `"Firebase initialized successfully"`
- Dashboard shows: `"Using Firebase backend"`
- Data appears in Firestore Console in real-time
- Stats update automatically

---

## ❌ Common Issues

**"Using localStorage (demo mode)"**
- Check `firebase-config.js` has real credentials (not placeholder values)
- Make sure you didn't login with `admin@milktrack.com` / `admin123` (that's demo mode)

**"Permission denied"**
- Check Firestore Rules (Step 4)
- Make sure you're logged in

**"Firebase is not defined"**
- Clear browser cache
- Make sure HTML files have Firebase SDK scripts loaded

---

## 📖 For More Details

See `SETUP_GUIDE.md` for:
- ESP32 device setup
- Cloud Functions deployment
- Production deployment
- Advanced security rules

---

**That's it! You're now using Firebase with real-time sync! 🚀**
