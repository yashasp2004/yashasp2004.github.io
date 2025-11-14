/**
 * Cloud Functions for ESP32 Milk Collection Device
 * API Endpoints for receiving data from ESP32 and managing the system
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Set global options for cost control
functions.setGlobalOptions({maxInstances: 10});

// ============================================================================
// API ENDPOINT: Add Milk Collection (from ESP32)
// ============================================================================
// POST https://us-central1-myolk-7694b.cloudfunctions.net/addMilkCollection
// Body: { fingerprintId, quantity, fatContent, deviceId }
// OR: { farmerId, farmerName, quantity, fatContent, deviceId }
exports.addMilkCollection = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      const {fingerprintId, farmerId, farmerName,
        quantity, fatContent, deviceId} = req.body;

      // Validate required fields
      if (!quantity || !deviceId) {
        return res.status(400).json({
          error: "Missing required fields",
          required: ["quantity", "deviceId",
            "and either fingerprintId or farmerId"],
        });
      }

      let finalFarmerId = farmerId;
      let finalFarmerName = farmerName;

      // If fingerprintId provided, look up farmer
      if (fingerprintId) {
        const fingerprintQuery = await db.collection("fingerprints")
            .where("fingerprintId", "==", fingerprintId)
            .where("status", "==", "active")
            .get();

        if (fingerprintQuery.empty) {
          return res.status(404).json({
            success: false,
            error: "Fingerprint not registered",
            message: "Please register fingerprint first",
          });
        }

        const fingerprintData = fingerprintQuery.docs[0].data();
        finalFarmerId = fingerprintData.farmerId;

        // Get farmer name
        const farmerDoc = await db.collection("farmers")
            .doc(finalFarmerId).get();
        if (farmerDoc.exists) {
          finalFarmerName = farmerDoc.data().name;
        }
      }

      if (!finalFarmerId) {
        return res.status(400).json({
          error: "No farmer identified",
          message: "Provide either fingerprintId or farmerId",
        });
      }

      // Add collection to Firestore
      const collectionRef = await db.collection("collections").add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        farmerId: finalFarmerId,
        farmerName: finalFarmerName || `Farmer ${finalFarmerId}`,
        fingerprintId: fingerprintId || null,
        quantity: parseFloat(quantity),
        fatContent: parseFloat(fatContent) || 0,
        deviceId: deviceId,
        status: "Verified",
        createdAt: new Date().toISOString(),
      });

      // Update farmer stats
      const farmerRef = db.collection("farmers").doc(finalFarmerId);
      const farmerDoc = await farmerRef.get();

      if (farmerDoc.exists) {
        await farmerRef.update({
          totalDeposits: admin.firestore.FieldValue.increment(1),
          totalQuantity:
            admin.firestore.FieldValue.increment(parseFloat(quantity)),
          lastDeposit: admin.firestore.FieldValue.serverTimestamp(),
          lastDeviceUsed: deviceId,
        });
      } else {
        await farmerRef.set({
          id: finalFarmerId,
          name: finalFarmerName || `Farmer ${finalFarmerId}`,
          fingerprintId: fingerprintId || null,
          fingerprintStatus: fingerprintId ? "Registered" : "Unknown",
          totalDeposits: 1,
          totalQuantity: parseFloat(quantity),
          lastDeposit: admin.firestore.FieldValue.serverTimestamp(),
          registeredAt: admin.firestore.FieldValue.serverTimestamp(),
          lastDeviceUsed: deviceId,
        });
      }

      // Update device stats
      await db.collection("devices").doc(deviceId).set({
        deviceId: deviceId,
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        online: true,
        lastFarmerId: finalFarmerId,
      }, {merge: true});

      // Success response
      return res.status(200).json({
        success: true,
        message: "Collection added successfully",
        collectionId: collectionRef.id,
        farmerId: finalFarmerId,
        farmerName: finalFarmerName,
        quantity: parseFloat(quantity),
        fatContent: parseFloat(fatContent) || 0,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error adding collection:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  });
});

// ============================================================================
// API ENDPOINT: Register Farmer (from ESP32)
// ============================================================================
// POST https://us-central1-myolk-7694b.cloudfunctions.net/registerFarmer
// Body: { fingerprintId, farmerName, phoneNumber, deviceId }
exports.registerFarmer = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      const {fingerprintId, farmerName, phoneNumber, deviceId} = req.body;

      if (!fingerprintId || !farmerName) {
        return res.status(400).json({
          error: "Missing required fields",
          required: ["fingerprintId", "farmerName"],
        });
      }

      // Check if fingerprint already exists
      const fingerprintQuery = await db.collection("fingerprints")
          .where("fingerprintId", "==", fingerprintId)
          .get();

      if (!fingerprintQuery.empty) {
        return res.status(409).json({
          success: false,
          error: "Fingerprint already registered",
          message: "This fingerprint is already in use",
        });
      }

      // Generate unique farmer ID
      const farmerId = "F" + Date.now() + Math.floor(Math.random() * 1000);

      // Create fingerprint record
      await db.collection("fingerprints").add({
        fingerprintId: fingerprintId,
        farmerId: farmerId,
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        registeredOn: deviceId || "unknown",
        status: "active",
      });

      // Create farmer profile
      await db.collection("farmers").doc(farmerId).set({
        id: farmerId,
        name: farmerName,
        phoneNumber: phoneNumber || null,
        fingerprintId: fingerprintId,
        fingerprintStatus: "Registered",
        totalDeposits: 0,
        totalQuantity: 0,
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        registeredOn: deviceId || "unknown",
      });

      return res.status(200).json({
        success: true,
        message: "Farmer registered successfully",
        farmerId: farmerId,
        farmerName: farmerName,
      });
    } catch (error) {
      console.error("Error registering farmer:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  });
});

// ============================================================================
// API ENDPOINT: Verify Fingerprint (from ESP32)
// ============================================================================
// POST https://us-central1-myolk-7694b.cloudfunctions.net/verifyFingerprint
// Body: { fingerprintId }
exports.verifyFingerprint = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      const {fingerprintId} = req.body;

      if (!fingerprintId) {
        return res.status(400).json({error: "Missing fingerprintId"});
      }

      // Look up fingerprint
      const fingerprintQuery = await db.collection("fingerprints")
          .where("fingerprintId", "==", fingerprintId)
          .where("status", "==", "active")
          .get();

      if (fingerprintQuery.empty) {
        return res.status(404).json({
          success: false,
          message: "Fingerprint not found",
          registered: false,
        });
      }

      // Get farmer details
      const fingerprintDoc = fingerprintQuery.docs[0];
      const fingerprintData = fingerprintDoc.data();
      const farmerId = fingerprintData.farmerId;

      const farmerDoc = await db.collection("farmers").doc(farmerId).get();

      if (!farmerDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Farmer not found",
          registered: false,
        });
      }

      const farmerData = farmerDoc.data();

      return res.status(200).json({
        success: true,
        registered: true,
        message: "Fingerprint verified",
        farmer: {
          farmerId: farmerId,
          farmerName: farmerData.name,
          phoneNumber: farmerData.phoneNumber,
          totalDeposits: farmerData.totalDeposits,
          totalQuantity: farmerData.totalQuantity,
        },
      });
    } catch (error) {
      console.error("Error verifying fingerprint:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  });
});

// ============================================================================
// API ENDPOINT: Device Heartbeat (from ESP32)
// ============================================================================
// POST https://us-central1-myolk-7694b.cloudfunctions.net/deviceHeartbeat
// Body: { deviceId, status }
exports.deviceHeartbeat = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      const {deviceId, status} = req.body;

      if (!deviceId) {
        return res.status(400).json({error: "Missing deviceId"});
      }

      await db.collection("devices").doc(deviceId).set({
        deviceId: deviceId,
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        online: true,
        status: status || "online",
      }, {merge: true});

      return res.status(200).json({
        success: true,
        message: "Heartbeat received",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating device heartbeat:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  });
});

// ============================================================================
// API ENDPOINT: Get Farmer Info (from ESP32)
// ============================================================================
// GET https://us-central1-myolk-7694b.cloudfunctions.net/getFarmer?farmerId=123
exports.getFarmer = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({error: "Method not allowed"});
    }

    try {
      const farmerId = req.query.farmerId;

      if (!farmerId) {
        return res.status(400).json({error: "Missing farmerId parameter"});
      }

      const farmerDoc = await db.collection("farmers").doc(farmerId).get();

      if (!farmerDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Farmer not found",
        });
      }

      return res.status(200).json({
        success: true,
        farmer: farmerDoc.data(),
      });
    } catch (error) {
      console.error("Error getting farmer:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  });
});

// ============================================================================
// API ENDPOINT: Test/Health Check
// ============================================================================
// GET https://us-central1-myolk-7694b.cloudfunctions.net/healthCheck
exports.healthCheck = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    return res.status(200).json({
      status: "ok",
      message: "API is running",
      timestamp: new Date().toISOString(),
      endpoints: {
        addMilkCollection: "POST /addMilkCollection",
        registerFarmer: "POST /registerFarmer",
        verifyFingerprint: "POST /verifyFingerprint",
        deviceHeartbeat: "POST /deviceHeartbeat",
        getFarmer: "GET /getFarmer?farmerId=XXX",
      },
      collections: {
        fingerprints: "Fingerprint to Farmer mapping",
        farmers: "Farmer profiles",
        collections: "Milk deposit records",
        devices: "Device status tracking",
      },
    });
  });
});
