# 🥛 Milk Traceability System with Biometric Authentication

A complete IoT-based milk collection and tracking system using ESP32, Firebase, and biometric fingerprint authentication. Perfect for dairy cooperatives, milk collection centers, and farmers.

## 🌟 Features

### Web Dashboard
- 📊 **Real-time tracking** of milk collections
- 👥 **Farmer management** with fingerprint registration
- 📈 **Live analytics** and statistics
- 🔄 **Multi-device sync** across browsers
- 📱 **Responsive design** for mobile/desktop
- 💾 **Data export** to CSV
- 🔐 **Secure authentication** with Firebase

### ESP32 Hardware Devices
- 🔒 **Biometric authentication** with fingerprint sensor
- ⚖️ **Automatic weight measurement** using load cells
- 🧪 **Fat content detection** with quality sensor
- 📡 **WiFi connectivity** for real-time sync
- 🖥️ **LCD display** for user feedback
- ☁️ **Cloud integration** via Firebase

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [System Architecture](#system-architecture)
- [Setup Instructions](#setup-instructions)
- [Hardware Requirements](#hardware-requirements)
- [Software Requirements](#software-requirements)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Quick Start

**New users start here!** → Read **[START_HERE.md](START_HERE.md)**

### For Web Dashboard Only (5 minutes)
1. Read **[QUICK_START.md](QUICK_START.md)**
2. Get Firebase config from Firebase Console
3. Update `firebase-config.js` with your credentials
4. Enable Firestore & Authentication in Firebase
5. Open `index.html` and login!

### For Complete System with ESP32 (20 minutes)
1. Read **[SETUP_GUIDE.md](SETUP_GUIDE.md)**
2. Follow all steps including Cloud Functions
3. Use **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** to track progress
4. See **[HARDWARE_PARTS_LIST.md](HARDWARE_PARTS_LIST.md)** for components
5. Flash ESP32 firmware (see **[FIRMWARE_INSTALLATION.md](FIRMWARE_INSTALLATION.md)**)

## 📚 Documentation

### Setup Guides
| Document | Description | When to Use |
|----------|-------------|-------------|
| **[START_HERE.md](START_HERE.md)** | Overview & guide selection | **Start here!** |
| **[QUICK_START.md](QUICK_START.md)** | 5-minute setup | Web dashboard only |
| **[SETUP_GUIDE.md](SETUP_GUIDE.md)** | Complete step-by-step guide | Full system setup |
| **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** | Interactive checklist | Track your progress |

### Technical Documentation
| Document | Description |
|----------|-------------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System design & data flow |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Common issues & solutions |
| **[ESP32_API_ENDPOINTS.md](ESP32_API_ENDPOINTS.md)** | API documentation |
| **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** | Firebase configuration details |

### Hardware Documentation
| Document | Description |
|----------|-------------|
| **[HARDWARE_PARTS_LIST.md](HARDWARE_PARTS_LIST.md)** | Components needed |
| **[PIN_CONNECTIONS.md](PIN_CONNECTIONS.md)** | Wiring diagram |
| **[CIRCUIT_DIAGRAM.txt](CIRCUIT_DIAGRAM.txt)** | Circuit details |
| **[FIRMWARE_INSTALLATION.md](FIRMWARE_INSTALLATION.md)** | ESP32 setup |

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────┐
│              Firebase (Google Cloud)             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ Firestore   │  │    Auth     │  │ Functions│ │
│  │  Database   │  │             │  │          │ │
│  └──────┬──────┘  └──────┬──────┘  └────┬─────┘ │
└─────────┼────────────────┼──────────────┼───────┘
          │                │              │
    ┌─────▼────────┐  ┌────▼─────┐  ┌────▼─────┐
    │ Web Dashboard│  │ ESP32    │  │  ESP32   │
    │ (Browser)    │  │ Device 1 │  │ Device 2 │
    └──────────────┘  └──────────┘  └──────────┘
```

**Real-time synchronization**: All devices and browsers sync automatically!

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for detailed diagrams.

## 🛠️ Setup Instructions

### Prerequisites
- Google account (for Firebase)
- Modern web browser (Chrome/Firefox recommended)
- (Optional) ESP32 board for hardware devices
- (Optional) Fingerprint sensor, load cells, LCD

### Web Dashboard Setup

1. **Get Firebase Credentials**
   ```
   1. Go to https://console.firebase.google.com
   2. Create/select project
   3. Add Web App → Copy config
   ```

2. **Update Configuration**
   ```javascript
   // Edit firebase-config.js (lines 24-30)
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     // ... paste your actual values
   };
   ```

3. **Enable Firebase Services**
   - Firestore Database (test mode)
   - Authentication (Email/Password)
   - Create admin user account

4. **Test It**
   ```
   Open index.html → Login → Add data
   ```

**Detailed instructions**: [SETUP_GUIDE.md](SETUP_GUIDE.md)

### ESP32 Hardware Setup (Optional)

1. **Install Components** (see [HARDWARE_PARTS_LIST.md](HARDWARE_PARTS_LIST.md))
   - ESP32 board
   - Fingerprint sensor (R307/AS608)
   - Load cell + HX711 amplifier
   - 16x2 LCD with I2C
   - Connecting wires

2. **Wire Components** (see [PIN_CONNECTIONS.md](PIN_CONNECTIONS.md))

3. **Deploy Cloud Function**
   ```bash
   cd functions/
   firebase deploy --only functions
   ```

4. **Flash Firmware** (see [FIRMWARE_INSTALLATION.md](FIRMWARE_INSTALLATION.md))
   - Update WiFi credentials
   - Update Cloud Function URL
   - Upload to ESP32

**Detailed instructions**: [SETUP_GUIDE.md](SETUP_GUIDE.md) Part 4

## 💻 Hardware Requirements

### For ESP32 Devices (Optional)

| Component | Quantity | Purpose |
|-----------|----------|---------|
| ESP32 Dev Board | 1-4 | Main microcontroller |
| Fingerprint Sensor (R307) | 1 per device | Biometric authentication |
| Load Cell (5kg) | 1 per device | Weight measurement |
| HX711 Amplifier | 1 per device | Load cell signal processing |
| 16x2 LCD + I2C | 1 per device | Display |
| Power Supply (5V/2A) | 1 per device | Power |
| Jumper Wires | As needed | Connections |

**Total cost per device**: ~$25-40 USD

See **[HARDWARE_PARTS_LIST.md](HARDWARE_PARTS_LIST.md)** for details.

## 🖥️ Software Requirements

### Web Dashboard
- Modern browser (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
- Internet connection
- Firebase account (free)

### ESP32 Development
- Arduino IDE (1.8.x) or PlatformIO
- ESP32 board support
- Required libraries:
  - Firebase ESP32
  - Adafruit Fingerprint Sensor
  - HX711 Arduino Library
  - LiquidCrystal I2C

## 🌐 API Endpoints

### Cloud Function (ESP32 → Firebase)

**POST** `/deviceIngest`

Headers:
```
Content-Type: application/json
x-device-key: YOUR_SECRET_KEY
```

Body:
```json
{
  "farmerId": "FP001",
  "farmerName": "Rajesh Kumar",
  "quantity": 15.5,
  "fatContent": 4.2,
  "deviceId": "DEV001",
  "status": "Verified"
}
```

Response:
```json
{
  "success": true,
  "id": "abc123",
  "message": "Collection recorded successfully"
}
```

See **[ESP32_API_ENDPOINTS.md](ESP32_API_ENDPOINTS.md)** for full API documentation.

## 📸 Screenshots

### Web Dashboard
- **Login Portal**: Secure authentication
- **Overview**: Real-time stats and analytics
- **Live Feed**: Collection tracking table
- **Farmers List**: Registered farmers with stats
- **Device Status**: Monitor all connected devices
- **Analytics**: Detailed reports and charts

### ESP32 Device
- **LCD Display**: Shows farmer name, weight, status
- **Fingerprint Scan**: Quick biometric verification
- **Real-time Sync**: Instant upload to cloud

## 🔧 Troubleshooting

### Common Issues

**"Using localStorage (demo mode)"**
- Check `firebase-config.js` has real credentials
- Don't login with demo account (`admin@milktrack.com`)

**"Permission denied" in Firestore**
- Update Firestore security rules
- Make sure you're logged in

**ESP32 can't connect**
- Verify Cloud Function URL
- Check device key matches
- Test WiFi connection

**See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for complete solutions**

## 💰 Cost

### Free Tier (Recommended for Small Operations)
- Firebase Spark Plan: **₹0/month**
  - 50K reads/day, 20K writes/day
  - Works for: 4 devices, 50 farmers, ~500 collections/day

### Paid Tier (For Larger Operations)
- Firebase Blaze Plan: **Pay-as-you-go**
  - Still includes free tier
  - Only pay if you exceed limits
  - Estimated: ₹0-200/month for most dairy cooperatives

**Cloud Functions require Blaze Plan but are free within generous limits**

## 🔒 Security

- 🔐 **Firebase Authentication**: Email/password required
- 🛡️ **Firestore Security Rules**: Only authenticated users can access
- 🔑 **Device Key Validation**: ESP32 devices must provide secret key
- 🔒 **HTTPS**: All communication encrypted
- 📝 **Audit Trail**: All actions logged with timestamps

## 🚀 Deployment

### Firebase Hosting (Recommended)
```bash
firebase init hosting
firebase deploy --only hosting
```

Your site will be live at: `https://YOUR-PROJECT.web.app`

### Custom Domain
- Add custom domain in Firebase Console
- Update DNS records
- Free SSL certificate included

See **[SETUP_GUIDE.md](SETUP_GUIDE.md)** Part 5 for details.

## 📊 Features Roadmap

- [x] Real-time data sync
- [x] Biometric authentication
- [x] Multi-device support
- [x] Analytics dashboard
- [x] CSV export
- [ ] SMS notifications
- [ ] Payment integration
- [ ] Mobile app (Android/iOS)
- [ ] Offline mode with sync
- [ ] Advanced reporting
- [ ] Multi-language support

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is provided as-is for educational and commercial use.

## 👨‍💻 Author

**Rutken.me**
- Website: [rutken.me](https://rutken.me)
- Project: Milk Traceability System

## 🙏 Acknowledgments

- Firebase team for excellent cloud platform
- Adafruit for fingerprint sensor libraries
- HX711 library contributors
- ESP32 community

## 📞 Support

Need help?

1. Check **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**
2. Review **[SETUP_GUIDE.md](SETUP_GUIDE.md)**
3. Read **[ARCHITECTURE.md](ARCHITECTURE.md)**
4. Open an issue on GitHub

## 🎯 Perfect For

- 🥛 Dairy cooperatives
- 🏭 Milk collection centers
- 👨‍🌾 Farmer cooperatives
- 🏪 Rural milk vendors
- 📊 Agricultural IoT projects
- 🎓 Educational institutions (IoT/embedded systems projects)

---

**⚡ Quick Links**

- 🚀 [Quick Start (5 min)](QUICK_START.md)
- 📖 [Complete Setup Guide](SETUP_GUIDE.md)
- ✅ [Setup Checklist](SETUP_CHECKLIST.md)
- 🏗️ [Architecture Docs](ARCHITECTURE.md)
- 🔧 [Troubleshooting](TROUBLESHOOTING.md)

---

**Made with ❤️ for dairy farmers and cooperatives**

_Last Updated: November 12, 2025_

