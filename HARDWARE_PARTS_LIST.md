# MILK TRACEABILITY IOT DEVICE - COMPLETE PARTS LIST

## CORE COMPONENTS

### 1. Microcontroller
- **ESP32 DevKit V1** (30-pin version recommended)
  - Qty: 1
  - Specs: Dual-core 240MHz, WiFi/BT, 520KB RAM
  - Price: ₹500-700
  - Link: Amazon/Robu.in

### 2. ADC Module
- **ADS1115 16-bit ADC Module**
  - Qty: 1
  - Specs: 4-channel, I2C interface, 860 samples/sec
  - Voltage: 2.0V to 5.5V
  - Price: ₹250-350
  - Link: Amazon/Robu.in

### 3. Fingerprint Sensor
- **R307 Optical Fingerprint Sensor** (or AS608)
  - Qty: 1
  - Specs: UART interface, 500-1000 fingerprint capacity
  - Voltage: 3.3V or 5V
  - Price: ₹600-900
  - Link: Amazon/Robu.in

### 4. Conductivity Sensor (Custom Build - 4-Electrode Kelvin Sensing)
- **316 Stainless Steel Rods**
  - Qty: 4
  - Diameter: 4-6mm
  - Length: 150-200mm (depends on container depth)
  - Grade: 316L (food-grade)
  - Price: ₹50-100 each
  - Link: Local hardware store

- **Instrumentation Amplifier**
  - **INA128** or **AD620** or **INA826**
    - Qty: 1
    - Price: ₹150-250 (INA128), ₹100-150 (AD620)
    - High input impedance (>10GΩ)
    - Low offset voltage
    - Link: Amazon/Robu.in

- **AC Signal Generator (Built using ESP32 DAC + Op-Amp)**
  - **LM358 Dual Op-Amp IC** or **TL072**
    - Qty: 1
    - Price: ₹10-15
  - **Additional Components for Signal Generator:**
    - 10kΩ resistors (x4) - Gain/feedback
    - 1µF capacitor (x2) - AC coupling
    - 100nF capacitor (x2) - Power decoupling
  - Uses ESP32 built-in DAC (GPIO25) to generate 1kHz signal
  
- **Additional Components for Instrumentation Amp:**
  - 1kΩ resistor (x1) - Gain setting (Rg)
  - 10kΩ resistors (x2) - Reference voltage divider
  - 100nF capacitor (x2) - Output filtering
  - 100µF capacitor (x1) - Reference decoupling

### 5. Power Supply
- **5V 3A Power Adapter** (Micro USB or DC barrel jack)
  - Qty: 1
  - Price: ₹150-200

- **AMS1117-3.3V Voltage Regulator** (if needed)
  - Qty: 1
  - Price: ₹10-20

### 6. Display (Optional but Recommended)
- **I2C 16x2 LCD Display** or **0.96" OLED Display**
  - Qty: 1
  - Price: ₹150-250
  - For showing farmer name & quantity

### 7. Supporting Components

#### Resistors
- 10kΩ (x5) - Pull-up/pull-down resistors
- 1kΩ (x2) - LED current limiting
- 100kΩ (x2) - Voltage divider for ADC input
- 220Ω (x2) - LED current limiting
- Price: ₹5 per pack of 10

#### Capacitors
- 100nF ceramic (x5) - Decoupling/filtering
- 10µF electrolytic (x3) - Power filtering
- 1000µF electrolytic (x1) - Main power smoothing
- Price: ₹20 total

#### LEDs
- Green LED (x1) - Success/Ready indicator
- Red LED (x1) - Error/Busy indicator
- Blue LED (x1) - Power indicator
- Price: ₹5 each

#### Others
- **Push Buttons** (x2) - Manual input/reset
- **Buzzer** (x1) - Audio feedback (5V active)
- **Relay Module** (x1) - 5V single channel (optional for milk valve control)
- **Terminal Blocks** (x4) - For easy wire connections

### 8. PCB & Enclosure
- **Breadboard** (830 points) for prototyping - ₹100
- **Perfboard/Veroboard** for permanent build - ₹40
- **PCB Enclosure** (waterproof, food-grade plastic) - ₹200-400
- **Cable Glands** for waterproofing wire entry - ₹50

### 9. Wiring & Connectors
- **Jumper Wires** (Male-Male, Male-Female, Female-Female)
  - Pack of 120 - ₹100
- **Solid Core Wire** (22 AWG, multiple colors)
  - For permanent connections - ₹50
- **Heat Shrink Tubing** - ₹50
- **JST Connectors** (2-pin, 4-pin) - ₹100

## TOTAL COST ESTIMATE

### Minimum Configuration (No Display)
- ESP32: ₹600
- ADS1115: ₹300
- R307 Sensor: ₹750
- SS Rods (4x): ₹300
- LM358 Op-Amp: ₹15
- Power Supply: ₹175
- Components: ₹250
- Wiring/PCB: ₹150
- Enclosure: ₹300
**TOTAL: ₹2,840 (~$34 USD)**

### Recommended Configuration (With Display)
- All above + OLED Display: ₹250
- + Relay Module: ₹100
- + Better Enclosure: ₹400
**TOTAL: ₹3,590 (~$43 USD)**

### Per Device Cost (Bulk Order - 10 units)
- Estimated: ₹2,300-2,500 per device

## TOOLS REQUIRED

1. **Soldering Iron** (25W-40W) - ₹300
2. **Solder Wire** (lead-free recommended) - ₹100
3. **Wire Stripper/Cutter** - ₹150
4. **Multimeter** - ₹400
5. **Heat Gun** (for heat shrink) - ₹300
6. **Drill** (for enclosure mounting) - ₹800

## OPTIONAL UPGRADES

### For Production Version
1. **Load Cell (5kg-20kg)** + **HX711 Module** - ₹400
   - For automatic weight measurement instead of manual entry
   
2. **DS3231 RTC Module** - ₹100
   - Real-time clock for accurate timestamps without WiFi

3. **SD Card Module** - ₹80
   - Local data backup

4. **Backup Battery (18650 Li-ion)** + Charging Module - ₹300
   - For power backup during outages

5. **Temperature Sensor (DS18B20)** - ₹150
   - Milk temperature monitoring

6. **Industrial Fingerprint Scanner** - ₹2,000+
   - More durable for outdoor/dairy environments

## WHERE TO BUY (India)

### Online Stores
1. **Robu.in** - Great for modules and sensors
2. **Amazon.in** - Fast delivery, good for ESP32
3. **ElectronicComp.com** - Electronics components
4. **Ktron.in** - Arduino/ESP32 kits
5. **Quartzcomponents.com** - Bulk components

### Local (If available)
- SP Road, Bangalore
- Lamington Road, Mumbai
- Chandni Chowk, Delhi
- Ritchie Street, Chennai

## SAFETY NOTES

⚠️ **IMPORTANT:**
- Use only **FOOD-GRADE** 316L stainless steel rods
- AC voltage for conductivity sensor should be LOW (< 5V AC)
- Properly insulate all electronics from milk/moisture
- Use waterproof connectors for rods entering container
- Add IP65 rated enclosure for outdoor installations
- Ensure proper grounding to prevent electrical shock

## NEXT STEPS

1. Order components (2-3 days delivery)
2. Assemble on breadboard first (prototyping)
3. Upload and test firmware
4. Build permanent PCB version
5. Install in waterproof enclosure
6. Field testing with actual milk samples
