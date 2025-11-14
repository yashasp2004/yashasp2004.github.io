# COMPLETE PIN CONNECTION GUIDE - MILK TRACEABILITY DEVICE

## PARTS LIST WITH EXACT CONNECTIONS

### COMPLETE PARTS LIST

#### Core Components
1. **ESP32 DevKit V1** (30-pin) - x1
2. **ADS1115 16-bit ADC Module** - x1
3. **R307 Fingerprint Sensor** - x1
4. **INA128 or AD620 Instrumentation Amplifier IC** - x1 (8-pin DIP)
5. **LM358 Dual Op-Amp** - x1 (8-pin DIP)
6. **0.96" I2C OLED Display (128x64)** - x1
7. **4x Stainless Steel Rods (316L, 4-6mm dia, 150mm long)** - x4

#### Power & Regulation
8. **5V 3A Power Adapter** - x1
9. **1000µF 16V Electrolytic Capacitor** - x1
10. **100µF 16V Electrolytic Capacitor** - x3
11. **10µF 16V Electrolytic Capacitor** - x3

#### Resistors
12. **1kΩ resistor** - x2
13. **10kΩ resistor** - x10
14. **220Ω resistor** - x3

#### Capacitors
15. **100nF ceramic capacitor** - x8
16. **1µF ceramic/film capacitor** - x2

#### Indicators & Input
17. **Blue LED (5mm)** - x1
18. **Green LED (5mm)** - x1
19. **Red LED (5mm)** - x1
20. **Active Buzzer (5V)** - x1
21. **Push Button (Tactile Switch)** - x2

#### Optional
22. **5V Single Channel Relay Module** - x1
23. **8-pin DIP IC Socket** - x2 (for INA128 and LM358)

---

## DETAILED PIN CONNECTIONS

### 1. ESP32 DevKit V1 (30-pin) - MAIN CONTROLLER

```
ESP32 Pin → Connects To
================================================================================
VIN (5V)   → 5V Power Supply +
GND        → Common Ground (All GND connections)
3V3        → Common 3.3V Rail (for pull-ups if needed)

--- I2C Bus (Shared) ---
GPIO21 (SDA) → ADS1115 SDA + OLED Display SDA
GPIO22 (SCL) → ADS1115 SCL + OLED Display SCL

--- UART2 (Fingerprint Sensor) ---
GPIO16 (RX2) → R307 Fingerprint TX (Yellow wire)
GPIO17 (TX2) → R307 Fingerprint RX (White wire)

--- DAC Output (AC Signal Generation) ---
GPIO25 (DAC1) → 1µF capacitor → LM358 Pin 3 (Input)

--- LED Indicators ---
GPIO2  → 220Ω resistor → Blue LED Anode (+)
GPIO4  → 220Ω resistor → Green LED Anode (+)
GPIO5  → 220Ω resistor → Red LED Anode (+)
         (All LED Cathodes (-) → GND)

--- Audio & Relay ---
GPIO19 → Buzzer Positive (+)
GPIO18 → Relay Module IN

--- User Input Buttons ---
GPIO32 → Push Button 1 (Enter) → Other side to GND
         (10kΩ pull-up to 3.3V optional, or use internal)
GPIO33 → Push Button 2 (Cancel) → Other side to GND
         (10kΩ pull-up to 3.3V optional, or use internal)
```

---

### 2. INA128 INSTRUMENTATION AMPLIFIER (8-pin DIP)

```
INA128 Pin → Connects To
================================================================================
Pin 1 (V-)     → GND
Pin 2 (Vin-)   → Rod 3 (Stainless Steel - Sense Negative)
Pin 3 (Vin+)   → Rod 2 (Stainless Steel - Sense Positive)
Pin 4 (Rg)     → 1kΩ resistor → Pin 5 (sets gain G = 51)
Pin 5 (Rg)     → 1kΩ resistor → Pin 4
Pin 6 (Vout)   → 100nF capacitor → ADS1115 A0 (analog input)
Pin 7 (V+)     → 5V Power Supply
Pin 8 (Ref)    → 2.5V Reference Voltage (from voltage divider below)
```

#### 2.5V Reference Voltage Divider for INA128 Pin 8:
```
5V → 10kΩ resistor → [Junction = 2.5V] → 10kΩ resistor → GND
                           ↓
                      100µF capacitor to GND (smoothing)
                           ↓
                     INA128 Pin 8 (Ref)
```

---

### 3. LM358 OP-AMP (8-pin DIP) - AC Signal Generator

```
LM358 Pin → Connects To
================================================================================
Pin 1 (Output 1)  → Rod 1 (Stainless Steel - AC Excitation)
Pin 2 (Input 1-)  → Pin 1 (feedback for unity gain buffer)
Pin 3 (Input 1+)  → See AC Coupling Circuit Below
Pin 4 (GND)       → GND
Pin 5 (Input 2+)  → Not used (or connect to GND)
Pin 6 (Input 2-)  → Not used (or connect to Output 2)
Pin 7 (Output 2)  → Not used
Pin 8 (Vcc)       → 5V Power Supply

Decoupling: 100nF capacitor between Pin 8 (Vcc) and Pin 4 (GND)
```

#### AC COUPLING CIRCUIT (ESP32 DAC to LM358 Pin 3):

**Step-by-Step Wiring:**

```
ESP32 GPIO25 (DAC) ───┬───[1µF Capacitor]───┬───► LM358 Pin 3 (Input 1+)
                      │                      │
                      │                  [10kΩ Resistor]
                      │                      │
                      │                     GND
```

**Physical Connections:**

1. **1µF Capacitor:**
   - One leg → ESP32 GPIO25 (DAC output pin)
   - Other leg → Junction point (let's call it "Node A")

2. **10kΩ Resistor:**
   - One leg → Node A (same point as capacitor's other leg)
   - Other leg → GND (ground rail)

3. **LM358 Pin 3:**
   - Connects to → Node A (same junction point)

**What It Looks Like on Breadboard:**

```
Row 10: ESP32 GPIO25 pin
Row 11: [Empty]
Row 12: 1µF capacitor leg 1 ────── connects to GPIO25 (row 10)
Row 13: 1µF capacitor leg 2 ────┬─ NODE A (junction point)
                                 │
Row 14: 10kΩ resistor leg 1 ────┘
Row 15: 10kΩ resistor leg 2 ────── to GND rail
Row 16: LM358 Pin 3 ────────────── jumper wire to NODE A (row 13)
```

**Why This Circuit?**

- **1µF Capacitor:** Blocks DC, passes AC (couples the 1kHz sine wave)
- **10kΩ Resistor:** Provides DC bias point (~2.5V when mid-rail)
- **Together:** Creates a clean AC signal centered around a DC reference

**Alternative Simplified Method (if using voltage follower):**

If you want to simplify, you can also do:

```
ESP32 GPIO25 ───[1µF Cap]───┬───► LM358 Pin 3
                             │
                         [10kΩ to 2.5V reference]
                         OR
                         [10kΩ to GND]
```

---

### 4. ADS1115 16-BIT ADC MODULE (Breakout Board)

```
ADS1115 Pin → Connects To
================================================================================
VDD   → 5V Power Supply
GND   → Common Ground
SCL   → ESP32 GPIO22 (shared I2C)
SDA   → ESP32 GPIO21 (shared I2C)
ADDR  → GND (sets I2C address to 0x48)
ALRT  → Not connected (or ESP32 GPIO for interrupt)

A0    → INA128 Pin 6 (Vout) via 100nF filter capacitor
A1    → Not connected (reserved for future sensors)
A2    → Not connected (reserved for future sensors)
A3    → Not connected (reserved for future sensors)
```

---

### 5. R307 FINGERPRINT SENSOR (6-wire cable)

```
R307 Wire Color → Connects To
================================================================================
RED    (Vcc)   → 5V Power Supply (or 3.3V - check your module datasheet)
BLACK  (GND)   → Common Ground
YELLOW (TX)    → ESP32 GPIO16 (RX2) - Transmit from sensor
WHITE  (RX)    → ESP32 GPIO17 (TX2) - Receive to sensor
                 ⚠️ If sensor is 5V: use voltage divider (10kΩ + 20kΩ)
BLUE   (Wakeup)→ Not connected
GREEN  (Touch) → Not connected
```

**Voltage Divider (if R307 is 5V logic and ESP32 is 3.3V):**
```
R307 WHITE (TX) → 10kΩ → [Junction to ESP32 RX2] → 20kΩ → GND
```

---

### 6. OLED DISPLAY 0.96" I2C (4-pin)

```
OLED Pin → Connects To
================================================================================
VCC  → 3.3V or 5V (check display specs - most work with either)
GND  → Common Ground
SCL  → ESP32 GPIO22 (shared I2C with ADS1115)
SDA  → ESP32 GPIO21 (shared I2C with ADS1115)

I2C Address: 0x3C or 0x3D (auto-detected by library)
```

---

### 7. STAINLESS STEEL CONDUCTIVITY RODS (4-Electrode Configuration)

```
Rod # → Connects To → Function
================================================================================
Rod 1  → LM358 Pin 1 (Output)        → AC Excitation / Current Source (+)
Rod 2  → INA128 Pin 3 (Vin+)         → Voltage Sense Positive (high-Z)
Rod 3  → INA128 Pin 2 (Vin-)         → Voltage Sense Negative (high-Z)
Rod 4  → GND (Common Ground)         → Current Return (-)
```

**Physical Arrangement in Milk Container:**
```
    Rod1    Rod2    Rod3    Rod4
     │       │       │       │
     │       │       │       │
 ════╪═══════╪═══════╪═══════╪════  ← Milk level
     │       │       │       │
    (I+)    (V+)    (V-)    (I-)
    
Spacing: 20-30mm apart
Immersion: At least 100mm deep in milk
```

---

### 8. POWER SUPPLY CONNECTIONS

```
5V Power Adapter → Connects To
================================================================================
+5V → 1000µF capacitor → ESP32 VIN
                      → ADS1115 VDD
                      → R307 VCC (check if 5V or 3.3V)
                      → Relay Module VCC
                      → LM358 Pin 8
                      → INA128 Pin 7
                      → OLED VCC (if 5V compatible)
                      → Buzzer VCC

GND → Common Ground Rail
```

**Decoupling Capacitors (place near each IC):**
- ESP32 VIN: 100µF electrolytic + 100nF ceramic
- LM358 Pin 8: 100nF ceramic
- INA128 Pin 7: 100nF ceramic
- ADS1115 VDD: 100nF ceramic

---

### 9. LED INDICATORS

```
LED Type → Connection
================================================================================
Blue LED   (Power)   : ESP32 GPIO2 → 220Ω → LED Anode(+) → Cathode(-) → GND
Green LED  (Success) : ESP32 GPIO4 → 220Ω → LED Anode(+) → Cathode(-) → GND
Red LED    (Error)   : ESP32 GPIO5 → 220Ω → LED Anode(+) → Cathode(-) → GND
```

---

### 10. BUZZER (Active 5V)

```
Buzzer Pin → Connects To
================================================================================
+  → ESP32 GPIO19
-  → GND
```

---

### 11. PUSH BUTTONS

```
Button 1 (Enter/Confirm):
    ESP32 GPIO32 → Button Pin 1
    Button Pin 2 → GND
    Optional: 10kΩ pull-up from GPIO32 to 3.3V (or use internal pull-up)

Button 2 (Cancel/Back):
    ESP32 GPIO33 → Button Pin 1
    Button Pin 2 → GND
    Optional: 10kΩ pull-up from GPIO33 to 3.3V (or use internal pull-up)
```

---

### 12. RELAY MODULE (Optional - for Milk Valve Control)

```
Relay Pin → Connects To
================================================================================
VCC  → 5V Power Supply
GND  → Common Ground
IN   → ESP32 GPIO18
COM  → 12V DC Supply (for solenoid valve)
NO   → Solenoid Valve Positive
NC   → Not connected
```

---

## COMPLETE WIRING SUMMARY TABLE

| Component | Pin/Wire | → | Destination | Pin/Wire | Notes |
|-----------|----------|---|-------------|----------|-------|
| **ESP32** | GPIO21 (SDA) | → | ADS1115 | SDA | I2C |
| **ESP32** | GPIO21 (SDA) | → | OLED | SDA | I2C |
| **ESP32** | GPIO22 (SCL) | → | ADS1115 | SCL | I2C |
| **ESP32** | GPIO22 (SCL) | → | OLED | SCL | I2C |
| **ESP32** | GPIO16 (RX2) | → | R307 | Yellow (TX) | UART |
| **ESP32** | GPIO17 (TX2) | → | R307 | White (RX) | UART |
| **ESP32** | GPIO25 (DAC) | → | 1µF Cap | → LM358 Pin 3 | AC signal |
| **ESP32** | GPIO2 | → | 220Ω | → Blue LED | Status |
| **ESP32** | GPIO4 | → | 220Ω | → Green LED | Status |
| **ESP32** | GPIO5 | → | 220Ω | → Red LED | Status |
| **ESP32** | GPIO19 | → | Buzzer | + | Audio |
| **ESP32** | GPIO18 | → | Relay | IN | Valve |
| **ESP32** | GPIO32 | → | Button 1 | Pin 1 | Input |
| **ESP32** | GPIO33 | → | Button 2 | Pin 1 | Input |
| **LM358** | Pin 1 (Out) | → | Rod 1 | Wire | AC+ |
| **INA128** | Pin 3 (Vin+) | → | Rod 2 | Wire | Sense+ |
| **INA128** | Pin 2 (Vin-) | → | Rod 3 | Wire | Sense- |
| **Rod 4** | Wire | → | GND | Common | AC- |
| **INA128** | Pin 6 (Vout) | → | 100nF Cap | → ADS1115 A0 | Filtered |
| **INA128** | Pin 8 (Ref) | → | 2.5V Div | Mid-point | Bias |
| **5V Supply** | + | → | All VCC | Pins | Power |
| **GND** | Common | → | All GND | Pins | Ground |

---

## POWER RAILS SUMMARY

### 5V Rail (2-3A supply needed)
- ESP32 VIN
- ADS1115 VDD
- R307 VCC (check datasheet)
- LM358 Pin 8
- INA128 Pin 7
- Relay VCC
- OLED VCC (if 5V version)
- Buzzer +

### 3.3V Rail (from ESP32 regulator)
- OLED VCC (if 3.3V version)
- Optional pull-ups

### GND (Common Ground)
- All component GND pins
- Rod 4
- Button commons
- LED cathodes
- Buzzer -

---

## I2C ADDRESSES

| Device | Default Address | ADDR Pin Configuration |
|--------|----------------|------------------------|
| ADS1115 | 0x48 | ADDR → GND |
| OLED | 0x3C or 0x3D | Fixed (varies by module) |

---

## BREADBOARD LAYOUT SUGGESTION

```
Power Rails:
    Top Rail (+) = 5V
    Top Rail (-) = GND

Left Section:
    - ESP32 DevKit (center)
    - Buttons below ESP32

Center Section:
    - INA128 IC (with socket)
    - LM358 IC (with socket)
    - ADS1115 module

Right Section:
    - R307 Fingerprint sensor (via jumpers)
    - OLED Display
    - LEDs (in row with resistors)
    - Buzzer

Bottom:
    - Terminal blocks for 4 SS rods
    - Power input terminal
```

---

## TESTING CHECKLIST

### Power Test
- [ ] 5V measured at ESP32 VIN
- [ ] 3.3V measured at ESP32 3V3 pin
- [ ] No short circuits (measure resistance before power)
- [ ] All ICs are cool to touch after 1 minute

### I2C Test
- [ ] ADS1115 detected at 0x48
- [ ] OLED detected at 0x3C or 0x3D
- [ ] Run I2C scanner sketch

### UART Test
- [ ] R307 responds to commands
- [ ] Check baud rate (57600 or 9600)

### Conductivity Test
- [ ] 1kHz signal visible on Rod 1 (use oscilloscope/multimeter AC)
- [ ] Differential voltage readable from INA128 output
- [ ] ADC reading changes when rods submerged in water vs air

### GPIO Test
- [ ] All LEDs light up individually
- [ ] Buzzer sounds
- [ ] Buttons register presses
- [ ] Relay clicks

---

## TROUBLESHOOTING

| Problem | Check |
|---------|-------|
| ESP32 won't boot | Check 5V supply, GND, try different USB cable |
| I2C not working | Verify SDA/SCL connections, check pull-ups (4.7kΩ) |
| No ADC reading | Check ADS1115 address, verify ADDR pin to GND |
| Fingerprint not responding | Check TX/RX swap, verify 5V vs 3.3V logic levels |
| LEDs always on/off | Check GPIO pins, verify resistor values |
| No AC signal on Rod 1 | Check DAC output on GPIO25, verify LM358 power |
| INA128 output stuck | Check reference voltage (should be ~2.5V), verify Rg resistor |

---

## NEXT STEPS

1. ✅ Gather all components
2. ✅ Build on breadboard following this guide
3. ✅ Test each subsystem individually
4. ✅ Upload firmware and calibrate
5. ✅ Design PCB or permanent protoboard layout
6. ✅ Install in waterproof enclosure
7. ✅ Field test with real milk samples

---

**Created:** November 2025  
**Version:** 2.0 (with INA128 Instrumentation Amplifier)  
**For:** ESP32-based Milk Traceability IoT Device
