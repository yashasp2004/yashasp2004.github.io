/*
 * ============================================================================
 * HARDWARE TEST SKETCH - Milk Traceability System
 * ============================================================================
 * 
 * Use this sketch to test each component individually before running
 * the main firmware. This helps identify hardware issues quickly.
 * 
 * Tests:
 * 1. LEDs & Buzzer
 * 2. OLED Display
 * 3. ADS1115 ADC
 * 4. Fingerprint Sensor
 * 5. Buttons
 * 6. DAC Signal Generation
 * 7. WiFi
 * 
 * ============================================================================
 */

#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <Adafruit_Fingerprint.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>

// Pin Definitions
#define LED_POWER 2
#define LED_SUCCESS 4
#define LED_ERROR 5
#define BUZZER_PIN 19
#define BUTTON_ENTER 32
#define BUTTON_CANCEL 33
#define DAC_PIN 25
#define I2C_SDA 21
#define I2C_SCL 22
#define FINGERPRINT_RX 16
#define FINGERPRINT_TX 17

// Objects
Adafruit_ADS1115 ads;
HardwareSerial fingerprintSerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&fingerprintSerial);
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("\n\n");
    Serial.println("=====================================");
    Serial.println("   HARDWARE TEST - Milk Tracker");
    Serial.println("=====================================\n");
    
    // Initialize pins
    pinMode(LED_POWER, OUTPUT);
    pinMode(LED_SUCCESS, OUTPUT);
    pinMode(LED_ERROR, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(BUTTON_ENTER, INPUT_PULLUP);
    pinMode(BUTTON_CANCEL, INPUT_PULLUP);
    
    Wire.begin(I2C_SDA, I2C_SCL);
    
    Serial.println("Starting component tests...\n");
    delay(1000);
}

void loop() {
    Serial.println("\n=====================================");
    Serial.println("SELECT TEST:");
    Serial.println("=====================================");
    Serial.println("1 - Test LEDs & Buzzer");
    Serial.println("2 - Test OLED Display");
    Serial.println("3 - Test ADS1115 ADC");
    Serial.println("4 - Test Fingerprint Sensor");
    Serial.println("5 - Test Buttons");
    Serial.println("6 - Test DAC Signal");
    Serial.println("7 - Test WiFi Scan");
    Serial.println("8 - Run ALL Tests");
    Serial.println("=====================================");
    Serial.println("Enter choice (1-8):");
    
    while (!Serial.available()) {
        delay(100);
    }
    
    char choice = Serial.read();
    while (Serial.available()) Serial.read(); // Clear buffer
    
    Serial.println();
    
    switch (choice) {
        case '1': testLEDsBuzzer(); break;
        case '2': testOLED(); break;
        case '3': testADC(); break;
        case '4': testFingerprint(); break;
        case '5': testButtons(); break;
        case '6': testDAC(); break;
        case '7': testWiFi(); break;
        case '8': runAllTests(); break;
        default: Serial.println("Invalid choice!"); break;
    }
    
    delay(2000);
}

// ============================================================================
// TEST 1: LEDs & Buzzer
// ============================================================================

void testLEDsBuzzer() {
    Serial.println("=== TEST 1: LEDs & Buzzer ===");
    
    Serial.println("Testing Blue LED (Power)...");
    digitalWrite(LED_POWER, HIGH);
    delay(1000);
    digitalWrite(LED_POWER, LOW);
    
    Serial.println("Testing Green LED (Success)...");
    digitalWrite(LED_SUCCESS, HIGH);
    delay(1000);
    digitalWrite(LED_SUCCESS, LOW);
    
    Serial.println("Testing Red LED (Error)...");
    digitalWrite(LED_ERROR, HIGH);
    delay(1000);
    digitalWrite(LED_ERROR, LOW);
    
    Serial.println("Testing Buzzer...");
    for (int i = 0; i < 3; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);
        delay(100);
    }
    
    Serial.println("✓ LEDs & Buzzer test complete!\n");
}

// ============================================================================
// TEST 2: OLED Display
// ============================================================================

void testOLED() {
    Serial.println("=== TEST 2: OLED Display ===");
    
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println("✗ ERROR: OLED not found at 0x3C");
        Serial.println("  Trying 0x3D...");
        
        if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3D)) {
            Serial.println("✗ ERROR: OLED not found!");
            Serial.println("  Check connections:");
            Serial.println("  - VCC to 3.3V or 5V");
            Serial.println("  - GND to GND");
            Serial.println("  - SDA to GPIO21");
            Serial.println("  - SCL to GPIO22");
            return;
        }
    }
    
    Serial.println("✓ OLED Display found!");
    
    display.clearDisplay();
    display.setTextSize(2);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("MILK");
    display.println("TRACKER");
    display.setTextSize(1);
    display.println("Hardware Test");
    display.display();
    
    Serial.println("✓ Text displayed on OLED");
    delay(3000);
    
    display.clearDisplay();
    display.display();
    Serial.println("✓ OLED test complete!\n");
}

// ============================================================================
// TEST 3: ADS1115 ADC
// ============================================================================

void testADC() {
    Serial.println("=== TEST 3: ADS1115 ADC ===");
    
    if (!ads.begin()) {
        Serial.println("✗ ERROR: ADS1115 not found!");
        Serial.println("  Check connections:");
        Serial.println("  - VDD to 5V");
        Serial.println("  - GND to GND");
        Serial.println("  - SDA to GPIO21");
        Serial.println("  - SCL to GPIO22");
        Serial.println("  - ADDR to GND (for 0x48)");
        return;
    }
    
    Serial.println("✓ ADS1115 found!");
    Serial.println("  Reading all 4 channels for 10 seconds...");
    Serial.println("  Connect test voltages to inputs A0-A3\n");
    
    ads.setGain(GAIN_TWOTHIRDS); // +/- 6.144V range
    
    for (int i = 0; i < 20; i++) {
        Serial.print("  A0: ");
        Serial.print(ads.computeVolts(ads.readADC_SingleEnded(0)), 3);
        Serial.print("V  A1: ");
        Serial.print(ads.computeVolts(ads.readADC_SingleEnded(1)), 3);
        Serial.print("V  A2: ");
        Serial.print(ads.computeVolts(ads.readADC_SingleEnded(2)), 3);
        Serial.print("V  A3: ");
        Serial.print(ads.computeVolts(ads.readADC_SingleEnded(3)), 3);
        Serial.println("V");
        delay(500);
    }
    
    Serial.println("✓ ADC test complete!\n");
}

// ============================================================================
// TEST 4: Fingerprint Sensor
// ============================================================================

void testFingerprint() {
    Serial.println("=== TEST 4: Fingerprint Sensor ===");
    
    fingerprintSerial.begin(57600, SERIAL_8N1, FINGERPRINT_RX, FINGERPRINT_TX);
    
    if (finger.verifyPassword()) {
        Serial.println("✓ Fingerprint sensor found!");
        Serial.print("  Sensor capacity: ");
        Serial.println(finger.capacity);
        Serial.print("  Templates stored: ");
        Serial.println(finger.templateCount);
        Serial.print("  Security level: ");
        Serial.println(finger.securityLevel);
        
        Serial.println("\n  Place finger on sensor to test...");
        Serial.println("  (Wait 10 seconds or press Cancel button to skip)");
        
        unsigned long startTime = millis();
        while (millis() - startTime < 10000) {
            uint8_t p = finger.getImage();
            if (p == FINGERPRINT_OK) {
                Serial.println("  ✓ Fingerprint detected!");
                Serial.println("  Processing image...");
                
                p = finger.image2Tz();
                if (p == FINGERPRINT_OK) {
                    Serial.println("  ✓ Image converted!");
                    
                    p = finger.fingerSearch();
                    if (p == FINGERPRINT_OK) {
                        Serial.print("  ✓ Found match! ID: ");
                        Serial.print(finger.fingerID);
                        Serial.print(" Confidence: ");
                        Serial.println(finger.confidence);
                    } else {
                        Serial.println("  ! Fingerprint not found in database");
                    }
                }
                break;
            }
            
            if (digitalRead(BUTTON_CANCEL) == LOW) {
                Serial.println("  Skipped by user");
                break;
            }
            
            delay(50);
        }
        
    } else {
        Serial.println("✗ ERROR: Fingerprint sensor not found!");
        Serial.println("  Check connections:");
        Serial.println("  - VCC to 5V (or 3.3V for some modules)");
        Serial.println("  - GND to GND");
        Serial.println("  - TX (yellow) to GPIO16");
        Serial.println("  - RX (white) to GPIO17");
        Serial.println("  Note: Some modules need voltage divider on TX line");
    }
    
    Serial.println("✓ Fingerprint test complete!\n");
}

// ============================================================================
// TEST 5: Buttons
// ============================================================================

void testButtons() {
    Serial.println("=== TEST 5: Buttons ===");
    Serial.println("Press ENTER or CANCEL button");
    Serial.println("(Wait 10 seconds)");
    
    unsigned long startTime = millis();
    bool enterPressed = false;
    bool cancelPressed = false;
    
    while (millis() - startTime < 10000) {
        if (digitalRead(BUTTON_ENTER) == LOW && !enterPressed) {
            Serial.println("✓ ENTER button pressed!");
            enterPressed = true;
            digitalWrite(LED_SUCCESS, HIGH);
            delay(100);
            digitalWrite(LED_SUCCESS, LOW);
        }
        
        if (digitalRead(BUTTON_CANCEL) == LOW && !cancelPressed) {
            Serial.println("✓ CANCEL button pressed!");
            cancelPressed = true;
            digitalWrite(LED_ERROR, HIGH);
            delay(100);
            digitalWrite(LED_ERROR, LOW);
        }
        
        if (enterPressed && cancelPressed) break;
        
        delay(50);
    }
    
    if (!enterPressed) Serial.println("  ! ENTER button not pressed");
    if (!cancelPressed) Serial.println("  ! CANCEL button not pressed");
    
    Serial.println("✓ Button test complete!\n");
}

// ============================================================================
// TEST 6: DAC Signal
// ============================================================================

void testDAC() {
    Serial.println("=== TEST 6: DAC Signal Generation ===");
    Serial.println("Generating 1Hz sine wave on GPIO25");
    Serial.println("Measure with multimeter or oscilloscope");
    Serial.println("Voltage should vary 0-3.3V");
    Serial.println("Running for 10 seconds...\n");
    
    for (int cycle = 0; cycle < 10; cycle++) {
        for (int i = 0; i < 32; i++) {
            // Simple sine wave lookup
            const uint8_t sine[32] = {
                128, 152, 176, 198, 217, 233, 245, 252,
                255, 252, 245, 233, 217, 198, 176, 152,
                128, 103, 79, 57, 38, 22, 10, 3,
                0, 3, 10, 22, 38, 57, 79, 103
            };
            dacWrite(DAC_PIN, sine[i]);
            delay(31); // ~32Hz for visible sine
        }
        Serial.print(".");
    }
    
    Serial.println("\n✓ DAC test complete!\n");
}

// ============================================================================
// TEST 7: WiFi
// ============================================================================

void testWiFi() {
    Serial.println("=== TEST 7: WiFi Scan ===");
    Serial.println("Scanning for WiFi networks...\n");
    
    int n = WiFi.scanNetworks();
    
    if (n == 0) {
        Serial.println("✗ No networks found!");
    } else {
        Serial.printf("✓ Found %d networks:\n\n", n);
        
        for (int i = 0; i < n; i++) {
            Serial.printf("  %2d: %-32s", i + 1, WiFi.SSID(i).c_str());
            Serial.printf(" (%d dBm) ", WiFi.RSSI(i));
            Serial.print((WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "Open" : "Encrypted");
            Serial.println();
        }
    }
    
    Serial.println("\n✓ WiFi scan complete!\n");
}

// ============================================================================
// Run All Tests
// ============================================================================

void runAllTests() {
    Serial.println("\n\n");
    Serial.println("╔═══════════════════════════════════╗");
    Serial.println("║   RUNNING ALL TESTS               ║");
    Serial.println("╚═══════════════════════════════════╝");
    Serial.println();
    
    testLEDsBuzzer();
    delay(1000);
    
    testOLED();
    delay(1000);
    
    testADC();
    delay(1000);
    
    testFingerprint();
    delay(1000);
    
    testButtons();
    delay(1000);
    
    testDAC();
    delay(1000);
    
    testWiFi();
    
    Serial.println("\n╔═══════════════════════════════════╗");
    Serial.println("║   ALL TESTS COMPLETE!             ║");
    Serial.println("╚═══════════════════════════════════╝\n");
    
    // Victory beep!
    for (int i = 0; i < 2; i++) {
        digitalWrite(BUZZER_PIN, HIGH);
        digitalWrite(LED_SUCCESS, HIGH);
        delay(100);
        digitalWrite(BUZZER_PIN, LOW);
        digitalWrite(LED_SUCCESS, LOW);
        delay(100);
    }
}
