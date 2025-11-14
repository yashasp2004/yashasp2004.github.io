# Milk Traceability IoT Dashboard

A modern web-based IoT dashboard for tracking milk collection with fingerprint authentication and quality monitoring.

## Features

### 🎯 Core Functionality
- **Fingerprint-Based Authentication**: Centralized farmer registration works across all devices
- **Real-Time Monitoring**: Live feed of milk collections
- **Quality Analysis**: Automatic fat percentage detection using 4-rod conductivity sensor
- **Multi-Device Support**: Track collections from multiple ESP32-based devices
- **Data Analytics**: Comprehensive statistics and trends

### 📊 Dashboard Features
- Real-time statistics (total milk, active farmers, device status, avg fat %)
- Live collection feed with filtering and search
- Device status monitoring
- Farmer management
- Analytics and reports
- CSV export functionality

## Access

### Demo Login
- **URL**: Open `index.html` and click the floating **milk drop button** (bottom-right)
- **Email**: `admin@milktrack.com`
- **Password**: `admin123`

### File Structure
```
├── index.html              # Main landing page
├── dashboard.html          # IoT Dashboard
├── styles.css              # Main styles
├── dashboard-styles.css    # Dashboard-specific styles
├── script.js               # Main JavaScript
├── milk-track.js           # Login portal functionality
└── dashboard.js            # Dashboard logic & data management
```

## Hardware Components (IoT Device)

### Required Parts
1. **ESP32 Development Board** (WiFi/Bluetooth enabled)
2. **ADS1115** - 16-bit ADC Module (I2C)
3. **R307/AS608** - Fingerprint Sensor Module
4. **4x 316 Stainless Steel Rods** (food-grade)
5. **AC Signal Generator** (~1kHz for conductivity measurement)
6. **5V/2A Power Supply**
7. **Jumper Wires & Breadboard**

### System Flow
```
1. Farmer places finger on sensor
2. ESP32 queries central database for fingerprint match
3. If verified, farmer can deposit milk
4. Quantity entered via terminal/computer
5. 4-rod sensor measures fat percentage via conductivity
6. Data logged to IoT dashboard with:
   - User ID
   - Quantity
   - Fat %
   - Timestamp
   - Device ID
```

## ESP32 Pin Connections

```
ESP32          Component
------         ---------
GPIO21  <-->  ADS1115 SDA
GPIO22  <-->  ADS1115 SCL
GPIO16  <-->  Fingerprint RX
GPIO17  <-->  Fingerprint TX
GPIO2   <-->  Status LED
GPIO4   <-->  Relay/Gate Control (optional)
```

## Usage

### For Dashboard Users
1. Open the website
2. Click the floating milk button (bottom-right corner)
3. Login with credentials
4. Use the dashboard to:
   - Add new collections
   - Monitor real-time data
   - Track farmers and devices
   - Export reports

### For ESP32 Development
1. Install Arduino IDE with ESP32 board support
2. Install required libraries:
   - Adafruit_ADS1X15 (for 16-bit ADC)
   - Adafruit_Fingerprint (for sensor)
   - WiFi.h (built-in)
   - HTTPClient.h (built-in)
3. Configure WiFi credentials and server endpoint
4. Upload firmware to ESP32

## Data Storage
- Uses **localStorage** for demo purposes
- In production, integrate with:
  - Firebase Realtime Database
  - MySQL/PostgreSQL
  - MongoDB
  - MQTT Broker

## Future Enhancements
- [ ] Load cell integration for automatic weight measurement
- [ ] LCD display on device for farmer feedback
- [ ] SMS/Email notifications
- [ ] Mobile app (React Native/Flutter)
- [ ] Advanced analytics with charts (Chart.js)
- [ ] Blockchain integration for transparency
- [ ] Multi-language support

## Security Notes
- Change default credentials in production
- Implement proper authentication (JWT/OAuth)
- Use HTTPS for API calls
- Encrypt fingerprint data
- Regular database backups

## License
MIT License - Free to use and modify

## Support
For issues or questions, please open an issue on the repository.

---
**Built with ❤️ for Dairy Farmers**
