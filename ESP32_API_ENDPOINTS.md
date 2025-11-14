# ESP32 API ENDPOINTS & INTEGRATION GUIDE

## 🌐 DEPLOYMENT ARCHITECTURE

**Your Setup (GitHub Pages + Firebase):**

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Pages (Static Hosting)                               │
│  https://yourusername.github.io                             │
│                                                               │
│  - index.html (main page)                                    │
│  - dashboard.html (admin dashboard)                          │
│  - firebase-config.js (Firebase client SDK)                  │
│  - All CSS/JS files                                          │
│                                                               │
│  ↓ Connects to Firebase directly (client-side)              │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Firebase SDK
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Firebase (Google Cloud)                                     │
│                                                               │
│  1. Firestore Database ← Dashboard reads/writes here        │
│  2. Authentication ← Login/logout                            │
│  3. Cloud Functions ← ESP32 writes here                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                         ↑
                         │ HTTPS POST
                         │
┌─────────────────────────────────────────────────────────────┐
│  ESP32 Devices                                               │
│  https://[region]-[project].cloudfunctions.net/deviceIngest │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ GitHub Pages hosts your **static website** (HTML/CSS/JS)
- ✅ Firebase provides **database + backend API** for ESP32
- ✅ Dashboard connects to Firebase using **client-side JavaScript** (already implemented)
- ✅ ESP32 devices connect to Firebase Cloud Functions (not GitHub Pages)

---

## NETWORK CONFIGURATION

### WiFi Connection
```cpp
// ESP32 WiFi credentials
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";

// Static IP (optional, recommended for reliability)
IPAddress local_IP(192, 168, 1, 100);  // Your ESP32 IP
IPAddress gateway(192, 168, 1, 1);     // Your router IP
IPAddress subnet(255, 255, 255, 0);
IPAddress primaryDNS(8, 8, 8, 8);      // Google DNS
IPAddress secondaryDNS(8, 8, 4, 4);
```

---

## ⚠️ IMPORTANT: GitHub Pages Limitations

**What GitHub Pages CAN'T do:**
- ❌ Run server-side code (Node.js, Python, PHP)
- ❌ Host APIs or backend endpoints
- ❌ Execute Cloud Functions
- ❌ Connect directly to databases

**What GitHub Pages CAN do:**
- ✅ Serve static HTML, CSS, JavaScript
- ✅ Run client-side JavaScript (Firebase SDK, fetch API)
- ✅ Connect to external APIs (like Firebase Cloud Functions)

**Your GitHub Pages URL:**
- `https://yourusername.github.io` (or `https://yourusername.github.io/repo-name`)
- This is ONLY for the web dashboard (frontend)
- ESP32 devices will NOT connect to this URL

---

## 💰 IS FIREBASE FREE? (YES! With Limits)

### **Firebase Spark Plan (NO CREDIT CARD REQUIRED)**

| Service | Free Tier Limits | Your Usage (Estimated) | Cost |
|---------|-----------------|------------------------|------|
| **Firestore Database** | 1 GB storage, 50K reads/day, 20K writes/day | ~1,500 writes/day, ~5,000 reads/day | **₹0** |
| **Cloud Functions** | 2M invocations/month, 400K GB-sec, 200K CPU-sec | ~50K invocations/month | **₹0** |
| **Authentication** | Unlimited users | Unlimited | **₹0** |
| **Hosting** | 10 GB storage, 360 MB/day bandwidth | Not needed (using GitHub Pages) | **₹0** |

### **Real-World Usage Calculation:**

**Assumptions:**
- 4 ESP32 devices
- 50 farmers
- Each farmer deposits 2 times/day
- Dashboard refreshes every 30 seconds when open

**Daily Usage:**
- **Writes:** 100 collections + 100 farmer updates + 4 device updates = ~204 writes/day ✅
- **Reads:** Dashboard refreshes ~1,000 times/day = ~3,000 reads/day ✅
- **Cloud Function Calls:** 100 calls/day ✅

**Monthly Usage:**
- Writes: ~6,000/month (FREE limit: 600,000/month) ✅
- Reads: ~90,000/month (FREE limit: 1,500,000/month) ✅
- Cloud Functions: ~3,000/month (FREE limit: 2,000,000/month) ✅

### **Verdict: 100% FREE for your use case! 🎉**

---

### **When Would You Need to Pay?**

**Blaze Plan (Pay-as-you-go) needed only if:**
- ❌ More than 60+ active devices
- ❌ More than 20K writes per day
- ❌ More than 50K reads per day
- ❌ Heavy dashboard traffic (100+ concurrent users)

**Blaze Pricing (if you ever exceed free tier):**
- Firestore Reads: $0.06 per 100K reads
- Firestore Writes: $0.18 per 100K writes
- Cloud Functions: $0.40 per million invocations

**Example Cost for 100 devices (beyond free tier):**
- ~40K writes/day = 1.2M writes/month
- Cost: (1.2M - 600K free) × $0.18/100K = **~$1.08/month (₹90)**

---

### **FREE ALTERNATIVES (If you want to avoid Firebase)**

| Alternative | Cost | Setup Difficulty | Best For |
|-------------|------|------------------|----------|
| **Supabase** | Free tier (500 MB, 50K writes/month) | Easy | Postgres lovers |
| **MongoDB Atlas** | Free tier (512 MB, no write limits) | Medium | NoSQL preference |
| **PocketBase** | Free (self-hosted) | Hard | Own server/Raspberry Pi |
| **Appwrite** | Free (self-hosted) | Hard | Own server/VPS |

**For your project: Firebase is the best FREE option!** ✅

---

## OPTION 1: FIREBASE CLOUD FUNCTION (RECOMMENDED FOR GITHUB PAGES)

### Endpoint Details
```
METHOD:  POST
URL:     https://[REGION]-[PROJECT-ID].cloudfunctions.net/deviceIngest
HEADERS: Content-Type: application/json
         x-device-key: your-super-secret-key-here
```

### Replace These Values:
- `[REGION]`: Your Firebase region (e.g., `us-central1`, `asia-south1`)
- `[PROJECT-ID]`: Your Firebase project ID
- `x-device-key`: Secret key you set during Cloud Function deployment

### Example URL:
```
https://asia-south1-milk-traceability-abc123.cloudfunctions.net/deviceIngest
```

### Request Structure (JSON)
```json
{
  "farmerId": "FP001",
  "farmerName": "Ramesh Kumar",
  "quantity": 15.5,
  "fatContent": 4.2,
  "deviceId": "ESP32_DEV001",
  "status": "Verified"
}
```

### Field Descriptions:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| farmerId | string | ✅ Yes | Fingerprint ID (e.g., "FP001", "FP123") |
| farmerName | string | ✅ Yes | Farmer name retrieved from fingerprint database |
| quantity | number | ✅ Yes | Milk quantity in liters (float) |
| fatContent | number | ✅ Yes | Fat percentage (e.g., 4.2 = 4.2%) |
| deviceId | string | ✅ Yes | Unique ESP32 device identifier |
| status | string | No | "Verified", "Pending", or "Error" (default: "Verified") |

### Success Response:
```json
{
  "success": true,
  "id": "abc123xyz789",
  "message": "Collection recorded"
}
```

### Error Responses:
```json
// 401 Unauthorized (wrong device key)
{
  "error": "Unauthorized: Invalid device key"
}

// 400 Bad Request (missing fields)
{
  "error": "Missing required fields"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

### ESP32 Code Example (Arduino):

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Cloud Function Configuration
const char* functionUrl = "https://asia-south1-milk-traceability-abc123.cloudfunctions.net/deviceIngest";
const char* deviceKey = "your-super-secret-key-here";
const char* deviceId = "ESP32_DEV001";  // Unique per device

bool sendToCloud(String farmerId, String farmerName, float quantity, float fatContent) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return false;
  }

  HTTPClient http;
  http.begin(functionUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", deviceKey);
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["farmerId"] = farmerId;
  doc["farmerName"] = farmerName;
  doc["quantity"] = quantity;
  doc["fatContent"] = fatContent;
  doc["deviceId"] = deviceId;
  doc["status"] = "Verified";
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Sending: " + jsonPayload);
  
  int httpCode = http.POST(jsonPayload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Response code: " + String(httpCode));
    Serial.println("Response: " + response);
    
    http.end();
    return (httpCode == 200);
  } else {
    Serial.println("HTTP Error: " + String(httpCode));
    http.end();
    return false;
  }
}

// Usage in main code:
void loop() {
  // After fingerprint verified and milk measured...
  String farmerId = "FP" + String(fingerprintId);
  String farmerName = getFarmerName(fingerprintId);  // From local storage
  float quantity = 15.5;  // From user input or load cell
  float fatContent = 4.2;  // From conductivity sensor
  
  if (sendToCloud(farmerId, farmerName, quantity, fatContent)) {
    Serial.println("✅ Data sent successfully!");
    // Show success on OLED, LED, buzzer
  } else {
    Serial.println("❌ Failed to send data");
    // Show error, store locally for retry
  }
  
  delay(60000);  // Wait 1 minute before next reading
}
```

---

## OPTION 2: DIRECT FIRESTORE REST API (NOT RECOMMENDED)

⚠️ **Warning:** This exposes your Firebase API key. Use only for prototyping.

### Endpoint:
```
POST https://firestore.googleapis.com/v1/projects/[PROJECT-ID]/databases/(default)/documents/collections?key=[API-KEY]
```

### Request Body:
```json
{
  "fields": {
    "timestamp": {
      "timestampValue": "2024-11-10T10:30:00Z"
    },
    "farmerId": {
      "stringValue": "FP001"
    },
    "farmerName": {
      "stringValue": "Ramesh Kumar"
    },
    "quantity": {
      "doubleValue": 15.5
    },
    "fatContent": {
      "doubleValue": 4.2
    },
    "deviceId": {
      "stringValue": "ESP32_DEV001"
    },
    "status": {
      "stringValue": "Verified"
    }
  }
}
```

### ESP32 Code (Direct Firestore - Not Recommended):
```cpp
// Don't use this in production - API key is exposed!
String firestoreUrl = "https://firestore.googleapis.com/v1/projects/milk-traceability-abc123/databases/(default)/documents/collections?key=AIzaSyXXXXXXXXXXXXXXXXXXX";

// ... similar HTTPClient code but with Firestore-specific JSON structure
```

---

## OPTION 3: CUSTOM SERVER (DIY Backend)

If you prefer to host your own server (Node.js, Python Flask, etc.)

### Example: Node.js Express Server

```javascript
// server.js
const express = require('express');
const admin = require('firebase-admin');
const app = express();

admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json')
});

const db = admin.firestore();

app.use(express.json());

app.post('/api/collect', async (req, res) => {
  const { farmerId, farmerName, quantity, fatContent, deviceId } = req.body;
  
  try {
    await db.collection('collections').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      farmerId,
      farmerName,
      quantity: parseFloat(quantity),
      fatContent: parseFloat(fatContent),
      deviceId,
      status: 'Verified'
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server on port 3000'));
```

### ESP32 Configuration:
```cpp
// If hosted on local network (Raspberry Pi, etc.)
const char* serverUrl = "http://192.168.1.50:3000/api/collect";

// If hosted on cloud (Heroku, AWS, etc.)
const char* serverUrl = "https://your-app.herokuapp.com/api/collect";
```

### Request:
```
POST http://192.168.1.50:3000/api/collect
Content-Type: application/json

{
  "farmerId": "FP001",
  "farmerName": "Ramesh Kumar",
  "quantity": 15.5,
  "fatContent": 4.2,
  "deviceId": "ESP32_DEV001"
}
```

---

## COMPLETE ESP32 ARDUINO CODE TEMPLATE

### Required Libraries:
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>  // Install from Library Manager
```

### Full Working Code:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ========== CONFIGURATION ==========
// WiFi Credentials
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";

// Cloud Function URL (REPLACE WITH YOUR ACTUAL URL)
const char* cloudFunctionUrl = "https://asia-south1-milk-traceability-abc123.cloudfunctions.net/deviceIngest";
const char* deviceKey = "your-super-secret-key-here";

// Device Configuration
const char* deviceId = "ESP32_DEV001";  // Change for each device

// ========== GLOBAL VARIABLES ==========
HTTPClient http;
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 60000;  // 1 minute

// ========== SETUP ==========
void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
  }
}

// ========== SEND DATA FUNCTION ==========
bool sendMilkCollection(String farmerId, String farmerName, float quantity, float fatContent) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected!");
    return false;
  }

  // Create JSON document
  StaticJsonDocument<512> doc;
  doc["farmerId"] = farmerId;
  doc["farmerName"] = farmerName;
  doc["quantity"] = quantity;
  doc["fatContent"] = fatContent;
  doc["deviceId"] = deviceId;
  doc["status"] = "Verified";
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("\n📤 Sending data to cloud...");
  Serial.println("Payload: " + jsonPayload);
  
  // Configure HTTP request
  http.begin(cloudFunctionUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", deviceKey);
  http.setTimeout(10000);  // 10 second timeout
  
  // Send POST request
  int httpCode = http.POST(jsonPayload);
  
  // Handle response
  if (httpCode > 0) {
    Serial.printf("Response code: %d\n", httpCode);
    String response = http.getString();
    Serial.println("Response: " + response);
    
    http.end();
    
    if (httpCode == 200) {
      Serial.println("✅ Data sent successfully!");
      return true;
    } else {
      Serial.println("❌ Server error!");
      return false;
    }
  } else {
    Serial.printf("❌ HTTP Error: %s\n", http.errorToString(httpCode).c_str());
    http.end();
    return false;
  }
}

// ========== MAIN LOOP ==========
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi disconnected. Reconnecting...");
    WiFi.reconnect();
    delay(5000);
    return;
  }
  
  // Example: Send test data every minute
  if (millis() - lastSendTime >= sendInterval) {
    // In real implementation, these would come from:
    // - Fingerprint sensor (farmerId, farmerName)
    // - User input or load cell (quantity)
    // - Conductivity sensor (fatContent)
    
    String farmerId = "FP001";
    String farmerName = "Ramesh Kumar";
    float quantity = 15.5;
    float fatContent = 4.2;
    
    bool success = sendMilkCollection(farmerId, farmerName, quantity, fatContent);
    
    if (success) {
      // Trigger success indicators (green LED, buzzer beep)
      // Save to local SD card as backup
    } else {
      // Trigger error indicators (red LED, error buzzer)
      // Queue for retry later
    }
    
    lastSendTime = millis();
  }
  
  delay(100);
}
```

---

## TESTING THE API

### 1. Test with curl (Linux/Mac Terminal):
```bash
curl -X POST \
  https://asia-south1-milk-traceability-abc123.cloudfunctions.net/deviceIngest \
  -H 'Content-Type: application/json' \
  -H 'x-device-key: your-super-secret-key-here' \
  -d '{
    "farmerId": "FP001",
    "farmerName": "Test Farmer",
    "quantity": 10.5,
    "fatContent": 4.0,
    "deviceId": "TEST_DEVICE",
    "status": "Verified"
  }'
```

### 2. Test with Postman:
```
Method: POST
URL: https://asia-south1-milk-traceability-abc123.cloudfunctions.net/deviceIngest

Headers:
  Content-Type: application/json
  x-device-key: your-super-secret-key-here

Body (raw JSON):
{
  "farmerId": "FP001",
  "farmerName": "Test Farmer",
  "quantity": 10.5,
  "fatContent": 4.0,
  "deviceId": "TEST_DEVICE",
  "status": "Verified"
}
```

### 3. Test with Python:
```python
import requests
import json

url = "https://asia-south1-milk-traceability-abc123.cloudfunctions.net/deviceIngest"
headers = {
    "Content-Type": "application/json",
    "x-device-key": "your-super-secret-key-here"
}
data = {
    "farmerId": "FP001",
    "farmerName": "Test Farmer",
    "quantity": 10.5,
    "fatContent": 4.0,
    "deviceId": "PYTHON_TEST",
    "status": "Verified"
}

response = requests.post(url, headers=headers, json=data)
print(response.status_code)
print(response.json())
```

---

## ERROR HANDLING & RETRY LOGIC

### ESP32 Retry Implementation:
```cpp
bool sendWithRetry(String farmerId, String farmerName, float qty, float fat) {
  const int maxRetries = 3;
  int attempt = 0;
  
  while (attempt < maxRetries) {
    Serial.printf("Attempt %d/%d\n", attempt + 1, maxRetries);
    
    if (sendMilkCollection(farmerId, farmerName, qty, fat)) {
      return true;  // Success!
    }
    
    attempt++;
    if (attempt < maxRetries) {
      Serial.println("⏳ Retrying in 5 seconds...");
      delay(5000);
    }
  }
  
  Serial.println("❌ All retry attempts failed. Saving locally...");
  // Save to SD card or EEPROM for later sync
  return false;
}
```

---

## LOCAL STORAGE BACKUP (SD Card)

### Save Failed Uploads:
```cpp
#include <SD.h>

void saveToSDCard(String farmerId, String farmerName, float qty, float fat) {
  File file = SD.open("/failed_uploads.txt", FILE_APPEND);
  if (file) {
    String line = String(millis()) + "," + farmerId + "," + farmerName + "," + 
                  String(qty) + "," + String(fat) + "\n";
    file.print(line);
    file.close();
    Serial.println("💾 Saved to SD card");
  }
}

void retrySavedData() {
  File file = SD.open("/failed_uploads.txt");
  if (file) {
    while (file.available()) {
      String line = file.readStringUntil('\n');
      // Parse and retry sending...
    }
    file.close();
  }
}
```

---

## SUMMARY - WHAT YOU NEED

### For ESP32 Code:
1. ✅ **Cloud Function URL** (from Firebase deployment)
   - Example: `https://asia-south1-milk-abc123.cloudfunctions.net/deviceIngest`
2. ✅ **Device Key** (secret you set during Firebase config)
   - Example: `"your-super-secret-key-here"`
3. ✅ **Device ID** (unique per ESP32)
   - Example: `"ESP32_DEV001"`, `"ESP32_DEV002"`, etc.
4. ✅ **WiFi SSID & Password**

### Data Flow:
```
ESP32 Device
    ↓
WiFi Network
    ↓
Firebase Cloud Function (API endpoint)
    ↓
Firestore Database
    ↓
Web Dashboard (real-time updates)
```

### Request Format (JSON):
```json
{
  "farmerId": "FP001",
  "farmerName": "Ramesh Kumar",
  "quantity": 15.5,
  "fatContent": 4.2,
  "deviceId": "ESP32_DEV001",
  "status": "Verified"
}
```

---

**Ready to deploy!** 🚀

Replace the placeholder values in the ESP32 code template and you're good to go!
