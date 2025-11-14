/*
 * MILK TRACEABILITY IoT DEVICE - ESP32 FIRMWARE
 * 
 * Features:
 * - R307 Fingerprint authentication
 * - ADS1115 16-bit ADC for fat percentage measurement (4-rod conductivity)
 * - I2C OLED display for user feedback
 * - WiFi connectivity to Firebase Cloud Function
 * - Real-time data logging
 * 
 * Hardware:
 * - ESP32 DevKit V1
 * - R307 Fingerprint Sensor (UART)
 * - ADS1115 16-bit ADC (I2C)
 * - 0.96" OLED Display (I2C, optional)
 * - 4x 316SS rods for conductivity measurement
 * - LEDs and Buzzer for feedback
 * 
 * Author: Your Name
 * Date: November 2025
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <Adafruit_Fingerprint.h>
#include <Adafruit_SSD1306.h>

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Firebase Cloud Function URL (get this after deploying function)
const char* CLOUD_FUNCTION_URL = "https://us-central1-YOUR-PROJECT.cloudfunctions.net/deviceIngest";
const char* DEVICE_KEY = "your-super-secret-key-here";  // Same as set in Firebase

// Device Configuration
const char* DEVICE_ID = "DEV001";  // Change for each device: DEV001, DEV002, DEV003, DEV004
const char* DEVICE_LOCATION = "Main Gate";

// ============================================================================
// PIN DEFINITIONS
// ============================================================================

#define I2C_SDA 21
#define I2C_SCL 22

#define FP_RX 16  // Connect to R307 TX (yellow wire)
#define FP_TX 17  // Connect to R307 RX (white wire)

#define LED_POWER 2   // Blue LED - Power indicator
#define LED_SUCCESS 4 // Green LED - Success
#define LED_ERROR 5   // Red LED - Error

#define BUZZER_PIN 19
#define BUTTON_ENTER 32
#define BUTTON_CANCEL 33

// ============================================================================
// HARDWARE OBJECTS
// ============================================================================

// ADS1115 16-bit ADC for conductivity measurement
Adafruit_ADS1115 ads;

// R307 Fingerprint Sensor
HardwareSerial fpSerial(2);  // Use UART2
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fpSerial);

// OLED Display (optional - comment out if not using)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

bool hasDisplay = false;
int lastFingerprintID = -1;
String lastFarmerName = "";
float lastMilkQuantity = 0.0;
float lastFatPercent = 0.0;

// Calibration values for fat percentage (adjust based on testing)
const float FAT_MIN_VOLTAGE = 0.5;   // Voltage at min fat (e.g., water)
const float FAT_MAX_VOLTAGE = 2.5;   // Voltage at max fat (e.g., cream)
const float FAT_MIN_PERCENT = 0.0;
const float FAT_MAX_PERCENT = 15.0;

// ============================================================================
// FUNCTION DECLARATIONS
// ============================================================================

void setupWiFi();
void setupFingerprint();
void setupADS1115();
void setupDisplay();
void setupPins();

int scanFingerprint();
float measureFatContent();
bool sendDataToCloud(String farmerId, String farmerName, float quantity, float fatPercent);

void displayMessage(String line1, String line2 = "", String line3 = "");
void beep(int duration = 100);
void blinkLED(int pin, int times = 1);

void enterQuantity();

// ============================================================================
// SETUP
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("Milk Traceability IoT Device");
  Serial.println("=================================\n");
  
  // Initialize I2C
  Wire.begin(I2C_SDA, I2C_SCL);
  
  // Setup hardware
  setupPins();
  setupDisplay();
  setupFingerprint();
  setupADS1115();
  setupWiFi();
  
  digitalWrite(LED_POWER, HIGH);  // Power LED on
  beep(200);
  delay(100);
  beep(100);
  
  displayMessage("System Ready", DEVICE_ID, "Place finger");
  Serial.println("✓ System initialized successfully");
  Serial.println("Waiting for fingerprint scan...\n");
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    setupWiFi();
  }
  
  // 1. Wait for fingerprint scan
  displayMessage("Ready", "Place finger", "on sensor");
  
  int fingerprintID = scanFingerprint();
  
  if (fingerprintID > 0) {
    // Fingerprint found
    Serial.printf("✓ Fingerprint ID: %d\n", fingerprintID);
    lastFingerprintID = fingerprintID;
    
    // Get farmer name (in real system, this would query a database)
    // For now, use FP + ID number
    String farmerId = "FP" + String(fingerprintID, DEC);
    farmerId = farmerId.length() == 3 ? "FP0" + String(fingerprintID) : farmerId;
    
    // Simulate farmer name lookup (in production, query from Firebase or local storage)
    String farmerName = "Farmer " + String(fingerprintID);
    lastFarmerName = farmerName;
    
    blinkLED(LED_SUCCESS, 2);
    beep(100);
    delay(100);
    beep(100);
    
    displayMessage("Welcome!", farmerName, "Enter quantity");
    Serial.printf("✓ Farmer: %s (%s)\n", farmerName.c_str(), farmerId.c_str());
    
    // 2. Get milk quantity (via Serial for now, or button press)
    enterQuantity();
    
    // 3. Measure fat content
    displayMessage("Measuring", "Fat content", "Please wait...");
    Serial.println("Measuring fat content...");
    
    float fatPercent = measureFatContent();
    lastFatPercent = fatPercent;
    
    Serial.printf("✓ Fat content: %.1f%%\n", fatPercent);
    displayMessage("Fat: " + String(fatPercent, 1) + "%", "Sending data...", "");
    delay(1000);
    
    // 4. Send data to cloud
    Serial.println("Sending data to cloud...");
    bool success = sendDataToCloud(farmerId, farmerName, lastMilkQuantity, fatPercent);
    
    if (success) {
      Serial.println("✓ Data sent successfully!");
      blinkLED(LED_SUCCESS, 3);
      beep(100);
      delay(100);
      beep(100);
      delay(100);
      beep(200);
      
      displayMessage("Success!", 
                    String(lastMilkQuantity, 1) + "L recorded",
                    "Fat: " + String(fatPercent, 1) + "%");
      delay(3000);
    } else {
      Serial.println("✗ Failed to send data");
      blinkLED(LED_ERROR, 3);
      beep(500);
      
      displayMessage("Error!", "Upload failed", "Try again");
      delay(3000);
    }
    
    // Reset for next farmer
    lastFingerprintID = -1;
    lastFarmerName = "";
    lastMilkQuantity = 0.0;
    
    Serial.println("\n--- Ready for next farmer ---\n");
  }
  
  delay(100);
}

// ============================================================================
// SETUP FUNCTIONS
// ============================================================================

void setupPins() {
  pinMode(LED_POWER, OUTPUT);
  pinMode(LED_SUCCESS, OUTPUT);
  pinMode(LED_ERROR, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_ENTER, INPUT_PULLUP);
  pinMode(BUTTON_CANCEL, INPUT_PULLUP);
  
  digitalWrite(LED_POWER, LOW);
  digitalWrite(LED_SUCCESS, LOW);
  digitalWrite(LED_ERROR, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  Serial.println("✓ Pins configured");
}

void setupWiFi() {
  Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
  displayMessage("WiFi", "Connecting...", "");
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected");
    Serial.printf("IP Address: %s\n", WiFi.localIP().toString().c_str());
    displayMessage("WiFi OK", WiFi.localIP().toString(), "");
    delay(2000);
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    displayMessage("WiFi Error", "Check settings", "");
    blinkLED(LED_ERROR, 5);
    delay(3000);
  }
}

void setupFingerprint() {
  Serial.println("Initializing fingerprint sensor...");
  fpSerial.begin(57600, SERIAL_8N1, FP_RX, FP_TX);
  
  if (finger.verifyPassword()) {
    Serial.println("✓ Fingerprint sensor found");
    Serial.printf("Template count: %d\n", finger.templateCount);
  } else {
    Serial.println("✗ Fingerprint sensor not found!");
    Serial.println("Check wiring:");
    Serial.println("  R307 TX (yellow) → ESP32 GPIO16");
    Serial.println("  R307 RX (white)  → ESP32 GPIO17");
    Serial.println("  R307 VCC (red)   → 5V or 3.3V");
    Serial.println("  R307 GND (black) → GND");
    
    displayMessage("FP Error", "Sensor not", "found!");
    blinkLED(LED_ERROR, 10);
  }
}

void setupADS1115() {
  Serial.println("Initializing ADS1115...");
  
  if (!ads.begin()) {
    Serial.println("✗ ADS1115 not found! Check wiring:");
    Serial.println("  SDA → GPIO21");
    Serial.println("  SCL → GPIO22");
    Serial.println("  VDD → 5V");
    Serial.println("  GND → GND");
    
    displayMessage("ADC Error", "Check wiring", "");
    blinkLED(LED_ERROR, 5);
    delay(3000);
  } else {
    Serial.println("✓ ADS1115 initialized");
    // Set gain to +/- 4.096V (1 bit = 0.125mV)
    ads.setGain(GAIN_ONE);
  }
}

void setupDisplay() {
  Serial.println("Initializing display...");
  
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("⚠ OLED display not found (optional)");
    hasDisplay = false;
  } else {
    Serial.println("✓ OLED display initialized");
    hasDisplay = true;
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Milk Tracking");
    display.println(DEVICE_ID);
    display.println("");
    display.println("Initializing...");
    display.display();
  }
}

// ============================================================================
// FINGERPRINT FUNCTIONS
// ============================================================================

int scanFingerprint() {
  int result = finger.getImage();
  
  if (result != FINGERPRINT_OK) {
    return -1;  // No finger detected
  }
  
  // Convert image to template
  result = finger.image2Tz();
  if (result != FINGERPRINT_OK) {
    Serial.println("✗ Image conversion failed");
    return -1;
  }
  
  // Search for template
  result = finger.fingerSearch();
  if (result == FINGERPRINT_OK) {
    Serial.printf("Found ID #%d with confidence %d\n", finger.fingerID, finger.confidence);
    return finger.fingerID;
  } else if (result == FINGERPRINT_NOTFOUND) {
    Serial.println("✗ Fingerprint not registered");
    displayMessage("Error!", "Fingerprint", "not found");
    blinkLED(LED_ERROR, 3);
    beep(500);
    delay(2000);
    return -1;
  } else {
    Serial.printf("✗ Search error: %d\n", result);
    return -1;
  }
}

// ============================================================================
// FAT MEASUREMENT FUNCTION
// ============================================================================

float measureFatContent() {
  // Read from ADS1115 channel 0 (connected to voltage divider from conductivity rods)
  int16_t adc0;
  float voltage;
  float fatPercent;
  
  // Take multiple readings and average
  const int numReadings = 10;
  float sum = 0;
  
  for (int i = 0; i < numReadings; i++) {
    adc0 = ads.readADC_SingleEnded(0);
    voltage = ads.computeVolts(adc0);
    sum += voltage;
    delay(50);
  }
  
  voltage = sum / numReadings;
  
  // Convert voltage to fat percentage using linear mapping
  // This is a simplified model - in production, use calibration curve
  fatPercent = map(voltage * 1000, FAT_MIN_VOLTAGE * 1000, FAT_MAX_VOLTAGE * 1000, 
                   FAT_MIN_PERCENT * 10, FAT_MAX_PERCENT * 10) / 10.0;
  
  // Clamp to valid range
  if (fatPercent < 0) fatPercent = 0;
  if (fatPercent > 15) fatPercent = 15;
  
  Serial.printf("ADC Voltage: %.3fV → Fat: %.1f%%\n", voltage, fatPercent);
  
  return fatPercent;
}

// ============================================================================
// QUANTITY INPUT FUNCTION
// ============================================================================

void enterQuantity() {
  Serial.println("\n--- Enter Milk Quantity ---");
  Serial.println("Type quantity in liters and press Enter");
  Serial.print("Quantity (L): ");
  
  displayMessage("Enter Qty", "Use Serial", "Monitor");
  
  // Wait for serial input
  while (!Serial.available()) {
    delay(100);
  }
  
  String input = Serial.readStringUntil('\n');
  input.trim();
  float quantity = input.toFloat();
  
  if (quantity > 0 && quantity < 1000) {
    lastMilkQuantity = quantity;
    Serial.printf("%.1f L\n", quantity);
    displayMessage("Quantity:", String(quantity, 1) + " Liters", "");
    delay(1500);
  } else {
    Serial.println("Invalid quantity! Using default: 10L");
    lastMilkQuantity = 10.0;
  }
}

// ============================================================================
// CLOUD COMMUNICATION FUNCTION
// ============================================================================

bool sendDataToCloud(String farmerId, String farmerName, float quantity, float fatPercent) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ No WiFi connection");
    return false;
  }
  
  HTTPClient https;
  https.begin(CLOUD_FUNCTION_URL);
  https.addHeader("Content-Type", "application/json");
  https.addHeader("x-device-key", DEVICE_KEY);
  https.setTimeout(10000);  // 10 second timeout
  
  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["farmerId"] = farmerId;
  doc["farmerName"] = farmerName;
  doc["quantity"] = quantity;
  doc["fatContent"] = fatPercent;
  doc["deviceId"] = DEVICE_ID;
  doc["status"] = "Verified";
  doc["timestamp"] = millis();  // Local timestamp (server will use server timestamp)
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Payload: " + jsonPayload);
  
  // Send POST request
  int httpResponseCode = https.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = https.getString();
    Serial.printf("HTTP Response code: %d\n", httpResponseCode);
    Serial.println("Response: " + response);
    
    https.end();
    return (httpResponseCode == 200);
  } else {
    Serial.printf("✗ HTTP Error: %s\n", https.errorToString(httpResponseCode).c_str());
    https.end();
    return false;
  }
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

void displayMessage(String line1, String line2, String line3) {
  if (!hasDisplay) return;
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  
  display.println(line1);
  display.println("");
  display.println(line2);
  if (line3.length() > 0) {
    display.println(line3);
  }
  
  display.display();
}

void beep(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}

void blinkLED(int pin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(150);
    digitalWrite(pin, LOW);
    delay(150);
  }
}
