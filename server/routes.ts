import type { Express } from "express";
import { z } from "zod";
import {
  insertProfileSchema,
  insertEmergencyAlertSchema,
  insertSensorThresholdSchema,
  insertBuddyConnectionSchema,
  insertDangerousZoneSchema,
  insertSafePathSchema,
} from "@shared/schema";
import type { IStorage } from "./storage";

export function registerRoutes(app: Express, storage: IStorage) {
  // Profile routes
  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const data = insertProfileSchema.parse(req.body);
      const id = req.body.id || crypto.randomUUID();
      const profile = await storage.createProfile({ ...data, id });
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/profiles/:id", async (req, res) => {
    try {
      const data = insertProfileSchema.partial().parse(req.body);
      const profile = await storage.updateProfile(req.params.id, data);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Emergency alerts routes
  app.get("/api/emergency-alerts/:userId", async (req, res) => {
    try {
      const alerts = await storage.getEmergencyAlerts(req.params.userId);
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/emergency-alerts", async (req, res) => {
    try {
      const data = insertEmergencyAlertSchema.parse(req.body);
      const alert = await storage.createEmergencyAlert(data);
      res.status(201).json(alert);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/emergency-alerts/:id", async (req, res) => {
    try {
      const data = insertEmergencyAlertSchema.partial().parse(req.body);
      const alert = await storage.updateEmergencyAlert(req.params.id, data);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Sensor thresholds routes
  app.get("/api/sensor-thresholds/:userId", async (req, res) => {
    try {
      const threshold = await storage.getSensorThreshold(req.params.userId);
      if (!threshold) {
        return res.status(404).json({ error: "Sensor threshold not found" });
      }
      res.json(threshold);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sensor-thresholds", async (req, res) => {
    try {
      const data = insertSensorThresholdSchema.parse(req.body);
      const threshold = await storage.createSensorThreshold(data);
      res.status(201).json(threshold);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/sensor-thresholds/:userId", async (req, res) => {
    try {
      const data = insertSensorThresholdSchema.partial().parse(req.body);
      const threshold = await storage.updateSensorThreshold(req.params.userId, data);
      if (!threshold) {
        return res.status(404).json({ error: "Sensor threshold not found" });
      }
      res.json(threshold);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Buddy connections routes
  app.get("/api/buddy-connections/:userId", async (req, res) => {
    try {
      const connections = await storage.getBuddyConnections(req.params.userId);
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/buddy-connections", async (req, res) => {
    try {
      const data = insertBuddyConnectionSchema.parse(req.body);
      const connection = await storage.createBuddyConnection(data);
      res.status(201).json(connection);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/buddy-connections/:id", async (req, res) => {
    try {
      const data = insertBuddyConnectionSchema.partial().parse(req.body);
      const connection = await storage.updateBuddyConnection(req.params.id, data);
      if (!connection) {
        return res.status(404).json({ error: "Buddy connection not found" });
      }
      res.json(connection);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/buddy-connections/:id", async (req, res) => {
    try {
      const success = await storage.deleteBuddyConnection(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Buddy connection not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dangerous zones routes
  app.get("/api/dangerous-zones", async (req, res) => {
    try {
      const zones = await storage.getAllDangerousZones();
      res.json(zones);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/dangerous-zones", async (req, res) => {
    try {
      const data = insertDangerousZoneSchema.parse(req.body);
      const zone = await storage.createDangerousZone(data);
      res.status(201).json(zone);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Safe paths routes
  app.get("/api/safe-paths/:userId", async (req, res) => {
    try {
      const paths = await storage.getSafePaths(req.params.userId);
      res.json(paths);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/safe-paths", async (req, res) => {
    try {
      const data = insertSafePathSchema.parse(req.body);
      const path = await storage.createSafePath(data);
      res.status(201).json(path);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // WhatsApp alert route
  app.post("/api/send-whatsapp-alert", async (req, res) => {
    try {
      const { phoneNumber, latitude, longitude, triggerReason, sensorData } = req.body;

      if (!phoneNumber || !latitude || !longitude) {
        return res.status(400).json({ error: "Missing required fields: phoneNumber, latitude, longitude" });
      }

      const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      const message = `🚨 EMERGENCY ALERT\n\nUser is in danger!\n\nReason: ${triggerReason}\n\nLocation: ${mapsUrl}\n\nPlease check on them immediately!`;

      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

      if (!twilioAccountSid || !twilioAuthToken) {
        console.warn("Twilio credentials not configured. Simulating alert...");
        
        return res.json({
          success: true,
          simulated: true,
          message: "Alert simulated (Twilio not configured)",
          data: {
            phoneNumber,
            location: mapsUrl,
            triggerReason,
          },
        });
      }

      const formattedPhone = phoneNumber.startsWith("whatsapp:") ? phoneNumber : `whatsapp:${phoneNumber}`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const credentials = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');

      const formData = new URLSearchParams();
      formData.append("From", twilioWhatsAppNumber);
      formData.append("To", formattedPhone);
      formData.append("Body", message);

      const twilioResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const twilioData = await twilioResponse.json();

      if (!twilioResponse.ok) {
        console.error("Twilio error:", twilioData);
        
        return res.status(twilioResponse.status).json({
          success: false,
          error: "Failed to send WhatsApp message",
          details: twilioData,
        });
      }

      res.json({
        success: true,
        simulated: false,
        message: "WhatsApp alert sent successfully",
        messageId: twilioData.sid,
        data: {
          phoneNumber,
          location: mapsUrl,
          triggerReason,
        },
      });
    } catch (error: any) {
      console.error("Error in send-whatsapp-alert:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Unknown error occurred",
      });
    }
  });
}
