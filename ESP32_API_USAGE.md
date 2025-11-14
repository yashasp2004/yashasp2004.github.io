# ESP32 API Integration Guide

## API Endpoints

All endpoints are hosted at: `https://us-central1-myolk-7694b.cloudfunctions.net/`

### 1. Add Milk Collection
**Endpoint:** `POST /addMilkCollection`

This is the main endpoint to send milk collection data from your ESP32.

**Request Body:**
```json
{
  "farmerId": "12345",
  "farmerName": "John Doe",
  "quantity": 5.5,
  "fatContent": 3.8,
  "deviceId": "ESP32_001"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Collection added successfully",
  "collectionId": "abc123xyz",
  "timestamp": "2025-11-12T10:30:00.000Z"
}
```

**ESP32 Arduino Code Example:**
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* API_URL = "https://us-central1-myolk-7694b.cloudfunctions.net/addMilkCollection";
const char* DEVICE_ID = "ESP32_001";  // Change this for each device

void sendMilkData(String farmerId, String farmerName, float quantity, float fatContent) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["farmerId"] = farmerId;
    doc["farmerName"] = farmerName;
    doc["quantity"] = quantity;
    doc["fatContent"] = fatContent;
    doc["deviceId"] = DEVICE_ID;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send POST request
    int httpCode = http.POST(jsonString);
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Code: " + String(httpCode));
      Serial.println("Response: " + response);
      
      if (httpCode == 200) {
        Serial.println("✓ Data sent successfully!");
      }
    } else {
      Serial.println("Error sending data: " + http.errorToString(httpCode));
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected!");
  }
}

// Example usage:
void loop() {
  // After scanning fingerprint and measuring milk
  sendMilkData("12345", "John Doe", 5.5, 3.8);
  delay(60000); // Wait 1 minute
}
```

---

### 2. Register Farmer
**Endpoint:** `POST /registerFarmer`

Register a new farmer with fingerprint ID.

**Request Body:**
```json
{
  "farmerId": "12345",
  "farmerName": "John Doe",
  "fingerprintId": "optional_fingerprint_hash"
}
```

**ESP32 Code Example:**
```cpp
void registerFarmer(String farmerId, String farmerName, String fingerprintId) {
  HTTPClient http;
  http.begin("https://us-central1-myolk-7694b.cloudfunctions.net/registerFarmer");
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<200> doc;
  doc["farmerId"] = farmerId;
  doc["farmerName"] = farmerName;
  doc["fingerprintId"] = fingerprintId;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpCode = http.POST(jsonString);
  
  if (httpCode == 200) {
    Serial.println("✓ Farmer registered successfully!");
  }
  
  http.end();
}
```

---

### 3. Device Heartbeat
**Endpoint:** `POST /deviceHeartbeat`

Send periodic heartbeat to show device is online.

**Request Body:**
```json
{
  "deviceId": "ESP32_001",
  "status": "online"
}
```

**ESP32 Code Example:**
```cpp
void sendHeartbeat() {
  HTTPClient http;
  http.begin("https://us-central1-myolk-7694b.cloudfunctions.net/deviceHeartbeat");
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<100> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["status"] = "online";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  http.POST(jsonString);
  http.end();
}

// Call this every 5 minutes
void loop() {
  static unsigned long lastHeartbeat = 0;
  
  if (millis() - lastHeartbeat > 300000) { // 5 minutes
    sendHeartbeat();
    lastHeartbeat = millis();
  }
}
```

---

### 4. Get Farmer Info
**Endpoint:** `GET /getFarmer?farmerId=12345`

Retrieve farmer information (useful for verification).

**ESP32 Code Example:**
```cpp
void getFarmerInfo(String farmerId) {
  HTTPClient http;
  String url = "https://us-central1-myolk-7694b.cloudfunctions.net/getFarmer?farmerId=" + farmerId;
  http.begin(url);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("Farmer Info: " + response);
    
    // Parse JSON response
    StaticJsonDocument<512> doc;
    deserializeJson(doc, response);
    
    if (doc["success"]) {
      String name = doc["farmer"]["name"];
      int totalDeposits = doc["farmer"]["totalDeposits"];
      Serial.println("Name: " + name);
      Serial.println("Total Deposits: " + String(totalDeposits));
    }
  }
  
  http.end();
}
```

---

### 5. Health Check
**Endpoint:** `GET /healthCheck`

Test if the API is running.

**ESP32 Code Example:**
```cpp
void testAPI() {
  HTTPClient http;
  http.begin("https://us-central1-myolk-7694b.cloudfunctions.net/healthCheck");
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("API Status: " + response);
    Serial.println("✓ API is working!");
  } else {
    Serial.println("✗ API not reachable");
  }
  
  http.end();
}
```

---

## Complete ESP32 Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API Configuration
const char* API_BASE = "https://us-central1-myolk-7694b.cloudfunctions.net";
const char* DEVICE_ID = "ESP32_001";

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✓ WiFi Connected!");
  Serial.println("IP: " + WiFi.localIP().toString());
  
  // Test API connection
  testAPI();
}

void loop() {
  // Example: Send milk data every 30 seconds
  sendMilkData("12345", "Test Farmer", 5.5, 3.8);
  delay(30000);
}

void testAPI() {
  HTTPClient http;
  http.begin(String(API_BASE) + "/healthCheck");
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    Serial.println("✓ API is working!");
  } else {
    Serial.println("✗ API error: " + String(httpCode));
  }
  
  http.end();
}

void sendMilkData(String farmerId, String farmerName, float quantity, float fatContent) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(API_BASE) + "/addMilkCollection");
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<200> doc;
    doc["farmerId"] = farmerId;
    doc["farmerName"] = farmerName;
    doc["quantity"] = quantity;
    doc["fatContent"] = fatContent;
    doc["deviceId"] = DEVICE_ID;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.println("Sending: " + jsonString);
    
    int httpCode = http.POST(jsonString);
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("Response [" + String(httpCode) + "]: " + response);
      
      if (httpCode == 200) {
        Serial.println("✓ Data sent successfully!");
      }
    } else {
      Serial.println("✗ Error: " + http.errorToString(httpCode));
    }
    
    http.end();
  } else {
    Serial.println("✗ WiFi not connected!");
  }
}
```

---

## Required Libraries

Install these libraries in Arduino IDE:
1. **WiFi** (built-in with ESP32)
2. **HTTPClient** (built-in with ESP32)
3. **ArduinoJson** (by Benoit Blanchon)
   - Install via Library Manager: Sketch → Include Library → Manage Libraries → Search "ArduinoJson"

---

## Testing with cURL

Test your API from command line:

```bash
# Health check
curl https://us-central1-myolk-7694b.cloudfunctions.net/healthCheck

# Add milk collection
curl -X POST https://us-central1-myolk-7694b.cloudfunctions.net/addMilkCollection \
  -H "Content-Type: application/json" \
  -d '{
    "farmerId": "12345",
    "farmerName": "Test Farmer",
    "quantity": 5.5,
    "fatContent": 3.8,
    "deviceId": "ESP32_001"
  }'

# Get farmer info
curl https://us-central1-myolk-7694b.cloudfunctions.net/getFarmer?farmerId=12345
```

---

## View Data

After sending data from ESP32, view it on your dashboard:
**https://yashasp2004.github.io/dashboard.html**

Login with your Firebase credentials to see the real-time data!
