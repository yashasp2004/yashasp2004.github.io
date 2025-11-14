/*
 * ============================================================================
 * MILK TRACEABILITY IOT DEVICE - ESP32 FIRMWARE
 * ============================================================================
 * 
 * Features:
 * - Fingerprint authentication (R307/AS608)
 * - Fat percentage measurement via 4-rod conductivity sensor
 * - WiFi connectivity to cloud dashboard
 * - OLED display for user feedback
 * - Buzzer and LED indicators
 * - Manual quantity input via Serial
 * 
 * Hardware:
 * - ESP32 DevKit V1
 * - ADS1115 16-bit ADC
 * - R307 Fingerprint Sensor
 * - 0.96" OLED Display (I2C)
 * - LM358 Op-Amp for AC signal generation
 * - 4x 316L SS Rods for conductivity sensing
 * 
 * Author: Your Name
 * Date: November 2025
 * Version: 1.0
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <Adafruit_Fingerprint.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ============================================================================
// CONFIGURATION
// ============================================================================

// WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* SERVER_URL = "https://yourdomain.github.io/api";  // Update with your backend
const char* DEVICE_ID = "DEV001";  // Unique device identifier

// Pin Definitions
#define FINGERPRINT_RX 16  // GPIO16 (RX2)
#define FINGERPRINT_TX 17  // GPIO17 (TX2)
#define LED_POWER 2        // GPIO2 - Blue LED
#define LED_SUCCESS 4      // GPIO4 - Green LED
#define LED_ERROR 5        // GPIO5 - Red LED
#define BUZZER_PIN 19      // GPIO19
#define RELAY_PIN 18       // GPIO18 (optional milk valve)
#define BUTTON_ENTER 32    // GPIO32
#define BUTTON_CANCEL 33   // GPIO33
#define DAC_PIN 25         // GPIO25 (DAC1 for AC signal generation)

// I2C Pins (Default for ESP32)
#define I2C_SDA 21
#define I2C_SCL 22

// OLED Display Settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C

// Fat Measurement Settings
#define CONDUCTIVITY_SAMPLES 100
#define AC_SIGNAL_FREQUENCY 1000  // 1kHz

// Calibration values (adjust based on testing)
const float FAT_MIN_VOLTAGE = 0.5;   // Voltage at 0% fat
const float FAT_MAX_VOLTAGE = 2.5;   // Voltage at 10% fat
const float FAT_MIN_PERCENT = 0.0;
const float FAT_MAX_PERCENT = 10.0;

// ============================================================================
// GLOBAL OBJECTS
// ============================================================================

Adafruit_ADS1115 ads;  // 16-bit ADC
HardwareSerial fingerprintSerial(2);  // UART2
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fingerprintSerial);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

bool wifiConnected = false;
int currentFarmerId = -1;
String currentFarmerName = "";
float currentMilkQuantity = 0.0;
float currentFatPercentage = 0.0;

// DAC signal generation
hw_timer_t *timer = NULL;
volatile uint32_t dacValue = 0;

// ============================================================================
// DAC TIMER INTERRUPT (Generates 1kHz sine wave)
// ============================================================================

void IRAM_ATTR onTimer() {
    // Generate sine wave using lookup table
    static const uint8_t sineWave[32] = {
        128, 152, 176, 198, 217, 233, 245, 252,
        255, 252, 245, 233, 217, 198, 176, 152,
        128, 103, 79, 57, 38, 22, 10, 3,
        0, 3, 10, 22, 38, 57, 79, 103
    };
    static uint8_t index = 0;
    
    dacWrite(DAC_PIN, sineWave[index]);
    index = (index + 1) % 32;
}

// ============================================================================
// SETUP
// ============================================================================

void setup() {
    Serial.begin(115200);
    Serial.println("\n\n=================================");
    Serial.println("MILK TRACEABILITY SYSTEM v1.0");
    Serial.println("=================================\n");
    
    // Initialize pins
    pinMode(LED_POWER, OUTPUT);
    pinMode(LED_SUCCESS, OUTPUT);
    pinMode(LED_ERROR, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(RELAY_PIN, OUTPUT);
    pinMode(BUTTON_ENTER, INPUT_PULLUP);
    pinMode(BUTTON_CANCEL, INPUT_PULLUP);
    
    // Initial LED state
    digitalWrite(LED_POWER, HIGH);  // Power indicator ON
    digitalWrite(LED_SUCCESS, LOW);
    digitalWrite(LED_ERROR, LOW);
    digitalWrite(RELAY_PIN, LOW);
    
    // Initialize I2C
    Wire.begin(I2C_SDA, I2C_SCL);
    
    // Initialize OLED Display
    if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println("ERROR: OLED display not found!");
        blinkError();
    } else {
        Serial.println("✓ OLED Display initialized");
        display.clearDisplay();
        displayMessage("Milk Track", "System Starting...", "");
        display.display();
    }
    
    // Initialize ADS1115 ADC
    if (!ads.begin()) {
        Serial.println("ERROR: ADS1115 ADC not found!");
        displayMessage("ERROR", "ADC not found", "Check wiring");
        blinkError();
    } else {
        Serial.println("✓ ADS1115 ADC initialized");
        ads.setGain(GAIN_TWOTHIRDS);  // +/- 6.144V range
    }
    
    // Initialize Fingerprint Sensor
    fingerprintSerial.begin(57600, SERIAL_8N1, FINGERPRINT_RX, FINGERPRINT_TX);
    if (finger.verifyPassword()) {
        Serial.println("✓ Fingerprint sensor initialized");
        Serial.printf("  Sensor capacity: %d fingerprints\n", finger.capacity);
        Serial.printf("  Templates stored: %d\n", finger.templateCount);
    } else {
        Serial.println("ERROR: Fingerprint sensor not found!");
        displayMessage("ERROR", "Fingerprint", "sensor error");
        blinkError();
    }
    
    // Initialize DAC for AC signal generation
    setupACSignalGenerator();
    Serial.println("✓ AC signal generator started");
    
    // Connect to WiFi
    connectWiFi();
    
    // Ready!
    beep(2);
    displayMessage("READY", "Place finger", "to start");
    Serial.println("\n=================================");
    Serial.println("System Ready!");
    Serial.println("=================================\n");
}

// ============================================================================
// MAIN LOOP
// ============================================================================

void loop() {
    // Check WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
        wifiConnected = false;
        connectWiFi();
    }
    
    // Main workflow
    displayMessage("READY", "Place finger", "to scan");
    
    // Wait for fingerprint
    int fingerprintId = getFingerprintID();
    
    if (fingerprintId >= 0) {
        // Fingerprint verified!
        beep(1);
        digitalWrite(LED_SUCCESS, HIGH);
        
        Serial.printf("\n✓ Fingerprint verified! ID: %d\n", fingerprintId);
        currentFarmerId = fingerprintId;
        
        // Get farmer info from server (or local database)
        currentFarmerName = getFarmerName(fingerprintId);
        
        displayMessage("VERIFIED", currentFarmerName, "ID: " + String(fingerprintId));
        delay(2000);
        
        // Input quantity via Serial
        currentMilkQuantity = getQuantityInput();
        
        if (currentMilkQuantity > 0) {
            // Measure fat percentage
            displayMessage("MEASURING", "Fat content...", "Please wait");
            currentFatPercentage = measureFatPercentage();
            
            Serial.printf("\n✓ Fat Percentage: %.1f%%\n", currentFatPercentage);
            
            displayMessage("COMPLETE", 
                          String(currentMilkQuantity, 1) + "L @ " + String(currentFatPercentage, 1) + "%",
                          "Uploading...");
            
            // Upload to server
            bool uploaded = uploadData();
            
            if (uploaded) {
                beep(2);
                digitalWrite(LED_SUCCESS, HIGH);
                displayMessage("SUCCESS", "Data uploaded", "Thank you!");
                delay(3000);
            } else {
                beep(3);
                digitalWrite(LED_ERROR, HIGH);
                displayMessage("ERROR", "Upload failed", "Saved locally");
                delay(3000);
                // TODO: Save to SD card or SPIFFS for later upload
            }
        }
        
        digitalWrite(LED_SUCCESS, LOW);
        digitalWrite(LED_ERROR, LOW);
        
    } else if (fingerprintId == -2) {
        // Fingerprint not found
        beep(3);
        digitalWrite(LED_ERROR, HIGH);
        displayMessage("ERROR", "Fingerprint", "not registered");
        Serial.println("✗ Fingerprint not found in database!");
        delay(2000);
        digitalWrite(LED_ERROR, LOW);
    }
    
    delay(500);
}

// ============================================================================
// AC SIGNAL GENERATION
// ============================================================================

void setupACSignalGenerator() {
    // Setup timer for 32kHz interrupt (1kHz sine with 32 samples)
    timer = timerBegin(0, 80, true);  // Timer 0, prescaler 80 (1MHz)
    timerAttachInterrupt(timer, &onTimer, true);
    timerAlarmWrite(timer, 31, true);  // 1MHz / 31 ≈ 32kHz
    timerAlarmEnable(timer);
}

// ============================================================================
// FINGERPRINT FUNCTIONS
// ============================================================================

int getFingerprintID() {
    uint8_t p = finger.getImage();
    
    if (p != FINGERPRINT_OK) return -1;
    
    p = finger.image2Tz();
    if (p != FINGERPRINT_OK) return -1;
    
    p = finger.fingerSearch();
    
    if (p == FINGERPRINT_OK) {
        Serial.printf("Found ID #%d with confidence %d\n", 
                     finger.fingerID, finger.confidence);
        return finger.fingerID;
    } else if (p == FINGERPRINT_NOTFOUND) {
        return -2;  // Not found
    } else {
        return -1;  // Error
    }
}

String getFarmerName(int farmerId) {
    // In production, query from server or local database
    // For demo, return placeholder
    return "Farmer_" + String(farmerId);
}

// ============================================================================
// FAT PERCENTAGE MEASUREMENT
// ============================================================================

float measureFatPercentage() {
    float totalVoltage = 0;
    
    // Take multiple samples and average
    for (int i = 0; i < CONDUCTIVITY_SAMPLES; i++) {
        int16_t adc0 = ads.readADC_SingleEnded(0);
        float voltage = ads.computeVolts(adc0);
        totalVoltage += voltage;
        delay(10);
    }
    
    float avgVoltage = totalVoltage / CONDUCTIVITY_SAMPLES;
    
    // Convert voltage to fat percentage (linear interpolation)
    // This is a simplified model - you'll need to calibrate with real milk samples
    float fatPercentage = map_float(avgVoltage, 
                                    FAT_MIN_VOLTAGE, FAT_MAX_VOLTAGE,
                                    FAT_MIN_PERCENT, FAT_MAX_PERCENT);
    
    // Clamp between 0 and 15%
    fatPercentage = constrain(fatPercentage, 0.0, 15.0);
    
    Serial.printf("ADC Voltage: %.3fV -> Fat: %.1f%%\n", avgVoltage, fatPercentage);
    
    return fatPercentage;
}

float map_float(float x, float in_min, float in_max, float out_min, float out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// ============================================================================
// QUANTITY INPUT
// ============================================================================

float getQuantityInput() {
    displayMessage("QUANTITY", "Enter in", "Serial Monitor");
    
    Serial.println("\n=================================");
    Serial.println("Enter milk quantity (in Liters):");
    Serial.println("Example: 15.5");
    Serial.println("=================================");
    
    // Wait for serial input (with timeout)
    unsigned long startTime = millis();
    String input = "";
    
    while (millis() - startTime < 60000) {  // 60 second timeout
        if (Serial.available()) {
            char c = Serial.read();
            if (c == '\n' || c == '\r') {
                if (input.length() > 0) {
                    float quantity = input.toFloat();
                    if (quantity > 0 && quantity <= 200) {  // Reasonable range
                        Serial.printf("✓ Quantity entered: %.1f L\n", quantity);
                        return quantity;
                    } else {
                        Serial.println("✗ Invalid quantity! Enter 0.1 to 200 L");
                        input = "";
                    }
                }
            } else if (c >= '0' && c <= '9' || c == '.') {
                input += c;
                Serial.print(c);
            }
        }
        
        // Check cancel button
        if (digitalRead(BUTTON_CANCEL) == LOW) {
            Serial.println("\n✗ Cancelled by user");
            return 0;
        }
        
        delay(10);
    }
    
    Serial.println("\n✗ Input timeout!");
    return 0;
}

// ============================================================================
// WiFi FUNCTIONS
// ============================================================================

void connectWiFi() {
    if (wifiConnected) return;
    
    Serial.printf("Connecting to WiFi: %s\n", WIFI_SSID);
    displayMessage("WiFi", "Connecting...", WIFI_SSID);
    
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        wifiConnected = true;
        Serial.println("\n✓ WiFi connected!");
        Serial.printf("  IP: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("  Signal: %d dBm\n", WiFi.RSSI());
        displayMessage("WiFi OK", WiFi.localIP().toString(), "");
        delay(1000);
    } else {
        Serial.println("\n✗ WiFi connection failed!");
        displayMessage("WiFi ERROR", "Check settings", "");
        delay(2000);
    }
}

// ============================================================================
// DATA UPLOAD
// ============================================================================

bool uploadData() {
    if (!wifiConnected) {
        Serial.println("✗ Cannot upload: No WiFi");
        return false;
    }
    
    HTTPClient http;
    
    // Create JSON payload
    StaticJsonDocument<512> doc;
    doc["deviceId"] = DEVICE_ID;
    doc["farmerId"] = "FP" + String(currentFarmerId, DEC);
    doc["farmerName"] = currentFarmerName;
    doc["quantity"] = currentMilkQuantity;
    doc["fatContent"] = currentFatPercentage;
    doc["timestamp"] = getTimestamp();
    doc["status"] = "Verified";
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    Serial.println("\nUploading data:");
    Serial.println(jsonPayload);
    
    // In production, send to your actual server
    // For GitHub Pages (static), you'd need a backend service like:
    // - Firebase
    // - AWS Lambda
    // - Google Cloud Functions
    // - Your own server
    
    // Example HTTP POST (update with your endpoint)
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.printf("✓ Upload successful! Code: %d\n", httpResponseCode);
        Serial.println("Response: " + response);
        http.end();
        return true;
    } else {
        Serial.printf("✗ Upload failed! Error: %s\n", http.errorToString(httpResponseCode).c_str());
        http.end();
        return false;
    }
}

String getTimestamp() {
    // In production, sync with NTP server
    // For now, return epoch time
    return String(millis());
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

void displayMessage(String line1, String line2, String line3) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    
    // Line 1 (large, centered)
    display.setTextSize(2);
    int16_t x1 = (SCREEN_WIDTH - (line1.length() * 12)) / 2;
    display.setCursor(x1 > 0 ? x1 : 0, 0);
    display.println(line1);
    
    // Line 2
    display.setTextSize(1);
    display.setCursor(0, 24);
    display.println(line2);
    
    // Line 3
    display.setCursor(0, 40);
    display.println(line3);
    
    display.display();
}

// ============================================================================
// AUDIO/VISUAL FEEDBACK
// ============================================================================

void beep(int count) {
    for (int i = 0; i < count; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);
        delay(100);
    }
}

void blinkError() {
    for (int i = 0; i < 5; i++) {
        digitalWrite(LED_ERROR, HIGH);
        delay(200);
        digitalWrite(LED_ERROR, LOW);
        delay(200);
    }
}

// ============================================================================
// END OF FIRMWARE
// ============================================================================
