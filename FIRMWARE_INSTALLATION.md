# ESP32 FIRMWARE - INSTALLATION GUIDE

## REQUIRED LIBRARIES

Install these libraries in Arduino IDE (Sketch → Include Library → Manage Libraries):

### 1. **Adafruit ADS1X15** by Adafruit
- Version: 2.4.0 or later
- For ADS1115 16-bit ADC

### 2. **Adafruit Fingerprint Sensor Library** by Adafruit
- Version: 2.1.0 or later
- For R307/AS608 fingerprint sensor

### 3. **Adafruit SSD1306** by Adafruit
- Version: 2.5.7 or later
- For OLED display

### 4. **Adafruit GFX Library** by Adafruit
- Version: 1.11.3 or later
- Graphics library (required by SSD1306)

### 5. **ArduinoJson** by Benoit Blanchon
- Version: 6.21.0 or later
- For JSON handling

### 6. **WiFi** (Built-in)
- Comes with ESP32 board package

### 7. **HTTPClient** (Built-in)
- Comes with ESP32 board package

### 8. **Wire** (Built-in)
- For I2C communication

---

## ARDUINO IDE SETUP

### Step 1: Install ESP32 Board Support

1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "ESP32"
6. Install "**ESP32 by Espressif Systems**" (version 2.0.0 or later)

### Step 2: Select Board

1. Go to **Tools → Board → ESP32 Arduino**
2. Select "**ESP32 Dev Module**" or "**DOIT ESP32 DEVKIT V1**"

### Step 3: Configure Settings

```
Board: "ESP32 Dev Module"
Upload Speed: "921600"
CPU Frequency: "240MHz (WiFi/BT)"
Flash Frequency: "80MHz"
Flash Mode: "QIO"
Flash Size: "4MB (32Mb)"
Partition Scheme: "Default 4MB with spiffs"
PSRAM: "Disabled"
Port: (Select your COM port)
```

### Step 4: Install Libraries

1. Go to **Sketch → Include Library → Manage Libraries**
2. Search and install each library listed above

---

## PLATFORMIO CONFIGURATION (Alternative)

If using PlatformIO instead of Arduino IDE:

### platformio.ini

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_speed = 921600

lib_deps = 
    adafruit/Adafruit ADS1X15@^2.4.0
    adafruit/Adafruit Fingerprint Sensor Library@^2.1.0
    adafruit/Adafruit SSD1306@^2.5.7
    adafruit/Adafruit GFX Library@^1.11.3
    bblanchon/ArduinoJson@^6.21.0

build_flags = 
    -DCORE_DEBUG_LEVEL=3
```

---

## UPLOAD & TEST

### 1. Update WiFi Credentials

Edit in `esp32_firmware.ino`:

```cpp
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";
```

### 2. Update Device ID

```cpp
const char* DEVICE_ID = "DEV001";  // Change to DEV002, DEV003, etc.
```

### 3. Update Server URL

```cpp
const char* SERVER_URL = "https://your-backend-api.com/collect";
```

For testing without a backend, you can use:
- **RequestBin**: https://requestbin.com/
- **Webhook.site**: https://webhook.site/
- **Firebase** (recommended for production)

### 4. Connect ESP32

1. Connect ESP32 to computer via USB
2. Select correct COM port in Arduino IDE
3. Click **Upload** (→ button)

### 5. Open Serial Monitor

1. Go to **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. Watch for startup messages

---

## CALIBRATION PROCEDURE

### Fat Percentage Calibration

The default calibration values need to be adjusted based on real milk samples:

```cpp
const float FAT_MIN_VOLTAGE = 0.5;   // Adjust based on skim milk
const float FAT_MAX_VOLTAGE = 2.5;   // Adjust based on high-fat milk
```

#### Steps:

1. **Test with Known Samples:**
   - Get milk samples with known fat percentages (from lab testing)
   - Examples: 0%, 3%, 4%, 5%, 6% fat milk

2. **Measure Voltage:**
   - Place rods in each sample
   - Note the ADC voltage readings from Serial Monitor
   - Record: Fat% → Voltage

3. **Create Lookup Table:**
   ```cpp
   // Example calibration table
   float fatCalibration[][2] = {
       {0.5, 0.0},   // 0.5V = 0% fat
       {1.2, 3.0},   // 1.2V = 3% fat
       {1.6, 4.0},   // 1.6V = 4% fat
       {2.0, 5.0},   // 2.0V = 5% fat
       {2.5, 6.0}    // 2.5V = 6% fat
   };
   ```

4. **Implement Interpolation:**
   - Use linear or polynomial interpolation
   - Update `measureFatPercentage()` function

---

## TESTING CHECKLIST

- [ ] ESP32 powers on (Blue LED lights up)
- [ ] OLED display shows "System Starting..."
- [ ] WiFi connects successfully
- [ ] Fingerprint sensor responds
- [ ] ADS1115 ADC reads values
- [ ] DAC generates AC signal (check with oscilloscope)
- [ ] Buzzer beeps on startup
- [ ] LEDs blink correctly
- [ ] Serial monitor shows all initialization messages
- [ ] Can scan fingerprint
- [ ] Can input quantity via Serial
- [ ] Fat measurement returns value
- [ ] Data uploads to server (or shows error if no backend)

---

## TROUBLESHOOTING

### Issue: "Fingerprint sensor not found"
**Solution:**
- Check RX/TX connections (swap if needed)
- Verify sensor voltage (3.3V or 5V)
- Check baud rate (default is 57600)

### Issue: "ADS1115 not found"
**Solution:**
- Check I2C connections (SDA to GPIO21, SCL to GPIO22)
- Verify I2C address (default 0x48)
- Test with I2C scanner sketch

### Issue: "OLED display not found"
**Solution:**
- Check I2C connections
- Verify OLED address (0x3C or 0x3D)
- Some displays need 5V, others 3.3V

### Issue: "WiFi won't connect"
**Solution:**
- Check SSID and password
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Move closer to router

### Issue: "Upload failed"
**Solution:**
- Press and hold BOOT button during upload
- Try different USB cable
- Reduce upload speed to 115200

### Issue: "Fat readings are random"
**Solution:**
- Check AC signal with oscilloscope
- Verify rod connections
- Ensure rods are submerged in liquid
- Check voltage divider resistors
- Needs calibration with known samples

---

## NEXT STEPS

1. ✅ Upload firmware
2. ✅ Test all sensors
3. ✅ Calibrate fat measurement
4. ✅ Register test fingerprints
5. ✅ Test complete workflow
6. ✅ Set up backend server
7. ✅ Deploy to production

---

## BACKEND INTEGRATION OPTIONS

### Option 1: Firebase (Recommended for beginners)
```cpp
// Use Firebase ESP32 library
#include <Firebase_ESP_Client.h>
// Store data in Realtime Database
// Free tier: 1GB storage, 10GB/month transfer
```

### Option 2: Custom Server
```cpp
// Node.js + Express + MongoDB
// Deploy on Heroku, AWS, or DigitalOcean
```

### Option 3: MQTT Broker
```cpp
// Use PubSubClient library
// mosquitto broker or CloudMQTT
```

---

## SUPPORT

For issues:
1. Check Serial Monitor output
2. Enable debug logging
3. Test each component separately
4. Check connections with multimeter

**Happy Coding!** 🚀
