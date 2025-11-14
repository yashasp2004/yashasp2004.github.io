# ESP32 Milk Traceability Device Firmware

Complete firmware for ESP32-based milk collection tracking device with fingerprint authentication and fat percentage measurement.

## Features

✅ R307 Fingerprint sensor integration  
✅ ADS1115 16-bit ADC for conductivity measurement  
✅ WiFi connectivity to Firebase Cloud Function  
✅ OLED display for user feedback  
✅ Audio/visual feedback (LEDs, buzzer)  
✅ Real-time data upload to cloud dashboard  

## Hardware Requirements

See `HARDWARE_PARTS_LIST.md` and `CIRCUIT_DIAGRAM.txt` in parent directory.

## Installation Methods

### Method 1: Arduino IDE (Easiest)

1. **Install Arduino IDE**
   - Download from: https://www.arduino.cc/en/software

2. **Add ESP32 Board Support**
   - Open Arduino IDE
   - File → Preferences
   - Additional Board Manager URLs: `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager
   - Search "ESP32" and install "esp32 by Espressif Systems"

3. **Install Libraries**
   - Sketch → Include Library → Manage Libraries
   - Install these libraries:
     - `Adafruit ADS1X15` by Adafruit
     - `Adafruit Fingerprint Sensor Library` by Adafruit
     - `Adafruit SSD1306` by Adafruit
     - `Adafruit GFX Library` by Adafruit
     - `ArduinoJson` by Benoit Blanchon

4. **Configure and Upload**
   - Open `milk_device.ino`
   - Update configuration (lines 34-44):
     - WiFi SSID and password
     - Cloud Function URL (from Firebase)
     - Device key
     - Device ID (DEV001, DEV002, etc.)
   - Select: Tools → Board → ESP32 Dev Module
   - Select: Tools → Port → (your ESP32 COM port)
   - Click Upload button

### Method 2: PlatformIO (Recommended for Advanced Users)

1. **Install VS Code**
   - Download from: https://code.visualstudio.com

2. **Install PlatformIO Extension**
   - Open VS Code
   - Extensions (Ctrl+Shift+X)
   - Search "PlatformIO IDE"
   - Install

3. **Open Project**
   ```bash
   cd esp32-firmware
   code .
   ```

4. **Configure**
   - Edit `milk_device.ino` (update WiFi, URLs, etc.)

5. **Build and Upload**
   - PlatformIO: Build (checkmark icon)
   - PlatformIO: Upload (arrow icon)
   - PlatformIO: Serial Monitor (plug icon)

## Configuration

### Required Updates in `milk_device.ino`

```cpp
// Lines 34-44
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";

const char* CLOUD_FUNCTION_URL = "https://us-central1-YOUR-PROJECT.cloudfunctions.net/deviceIngest";
const char* DEVICE_KEY = "your-super-secret-key-here";

const char* DEVICE_ID = "DEV001";  // Change for each device
const char* DEVICE_LOCATION = "Main Gate";
```

### Pin Configuration (already defined in code)

| Component | ESP32 Pin | Notes |
|-----------|-----------|-------|
| I2C SDA | GPIO21 | ADS1115 + OLED |
| I2C SCL | GPIO22 | ADS1115 + OLED |
| R307 RX | GPIO16 | Connect to R307 TX (yellow) |
| R307 TX | GPIO17 | Connect to R307 RX (white) |
| LED Power | GPIO2 | Blue LED |
| LED Success | GPIO4 | Green LED |
| LED Error | GPIO5 | Red LED |
| Buzzer | GPIO19 | Active 5V buzzer |
| Button Enter | GPIO32 | With pull-up |
| Button Cancel | GPIO33 | With pull-up |

## Usage

### First Time Setup

1. **Register Fingerprints**
   - Upload the firmware
   - Use R307 enrollment sketch (examples in Adafruit library)
   - Or use fingerprint enrollment mode (to be added)

2. **Calibrate Fat Sensor**
   - Test with known milk samples (e.g., 3%, 4%, 5% fat)
   - Adjust `FAT_MIN_VOLTAGE` and `FAT_MAX_VOLTAGE` in code (lines 100-103)

3. **Test Connection**
   - Open Serial Monitor (115200 baud)
   - Check WiFi connection
   - Verify Firebase Cloud Function responds

### Normal Operation

1. Device powers on → Blue LED lights up
2. Display shows "Ready - Place finger"
3. Farmer places finger on sensor
4. If recognized:
   - Green LED blinks
   - Beep sounds
   - Display shows farmer name
5. Enter milk quantity via Serial Monitor
6. Device measures fat content automatically
7. Data sent to cloud
8. Success: 3 beeps + green LED
9. Error: Long beep + red LED

## Serial Monitor Commands

During runtime, you can:
- **Enter quantity**: Type number (e.g., `15.5`) and press Enter when prompted

Future additions:
- `ENROLL` - Enroll new fingerprint
- `DELETE` - Delete fingerprint
- `LIST` - List all stored fingerprints
- `CALIBRATE` - Run fat sensor calibration

## Troubleshooting

### WiFi Won't Connect
- Check SSID and password
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Move closer to router

### Fingerprint Sensor Not Found
- Check wiring (RX/TX are swapped!)
- Verify power (3.3V or 5V depending on module)
- Try different baud rate (57600 or 115200)

### ADS1115 Not Found
- Check I2C wiring (SDA=21, SCL=22)
- Verify I2C address (0x48 default)
- Check pull-up resistors (usually built-in)

### Cloud Upload Fails
- Verify WiFi connected
- Check Cloud Function URL is correct
- Verify device key matches Firebase config
- Test URL in browser/Postman first

### Fat Percentage Always Wrong
- Calibrate with known samples
- Check rod connections
- Adjust voltage range in code
- Ensure rods are clean and properly submerged

## Development Notes

### Adding Fingerprint Enrollment

To add fingerprint enrollment mode, you can use the Adafruit example:
```cpp
// In Arduino IDE: File → Examples → Adafruit Fingerprint Sensor Library → enroll
```

### Calibration Mode

For production, add a calibration routine that:
1. Tests with water (0% fat)
2. Tests with known milk samples (3%, 4%, 5%)
3. Creates lookup table or polynomial fit
4. Stores calibration in EEPROM

### Offline Mode

To add offline capability:
1. Store data in SPIFFS or SD card when WiFi unavailable
2. Upload batch when connection restored
3. Use RTC module for accurate timestamps

## License

MIT License - Free to use and modify

## Support

For issues, check:
- Serial monitor output (115200 baud)
- Firebase Cloud Function logs
- Hardware connections (see CIRCUIT_DIAGRAM.txt)
