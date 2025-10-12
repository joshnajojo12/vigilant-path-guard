import { pgTable, uuid, text, boolean, timestamp, numeric, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Profiles table
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number"),
  secretCode: text("secret_code"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// Emergency alerts table
export const emergencyAlerts = pgTable("emergency_alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  triggerReason: text("trigger_reason").notNull(),
  sensorData: jsonb("sensor_data").default(sql`'{}'::jsonb`),
  whatsappSent: boolean("whatsapp_sent").default(false),
  whatsappError: text("whatsapp_error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts).omit({ id: true, createdAt: true });
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;
export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;

// Sensor thresholds table
export const sensorThresholds = pgTable("sensor_thresholds", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
  voiceSensitivity: numeric("voice_sensitivity").default("0.7"),
  motionThreshold: numeric("motion_threshold").default("0.5"),
  lightChangeThreshold: numeric("light_change_threshold").default("0.3"),
  soundThreshold: numeric("sound_threshold").default("0.8"),
  movementThreshold: numeric("movement_threshold").default("0.6"),
  confirmationWindowSeconds: integer("confirmation_window_seconds").default(5),
  sensorsRequired: integer("sensors_required").default(2),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSensorThresholdSchema = createInsertSchema(sensorThresholds).omit({ id: true, updatedAt: true });
export type InsertSensorThreshold = z.infer<typeof insertSensorThresholdSchema>;
export type SensorThreshold = typeof sensorThresholds.$inferSelect;

// Buddy connections table
export const buddyConnections = pgTable("buddy_connections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  buddyId: uuid("buddy_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  status: text("status").default("pending"),
  lastLocationLat: numeric("last_location_lat"),
  lastLocationLng: numeric("last_location_lng"),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBuddyConnectionSchema = createInsertSchema(buddyConnections).omit({ id: true, createdAt: true });
export type InsertBuddyConnection = z.infer<typeof insertBuddyConnectionSchema>;
export type BuddyConnection = typeof buddyConnections.$inferSelect;

// Dangerous zones table
export const dangerousZones = pgTable("dangerous_zones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  radiusMeters: integer("radius_meters").default(500),
  dangerLevel: integer("danger_level").default(5),
  reason: text("reason"),
  reportedBy: uuid("reported_by").references(() => profiles.id, { onDelete: "set null" }),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDangerousZoneSchema = createInsertSchema(dangerousZones).omit({ id: true, createdAt: true });
export type InsertDangerousZone = z.infer<typeof insertDangerousZoneSchema>;
export type DangerousZone = typeof dangerousZones.$inferSelect;

// Safe paths table
export const safePaths = pgTable("safe_paths", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  startLat: numeric("start_lat").notNull(),
  startLng: numeric("start_lng").notNull(),
  endLat: numeric("end_lat").notNull(),
  endLng: numeric("end_lng").notNull(),
  pathData: jsonb("path_data").default(sql`'{}'::jsonb`),
  dangerZonesAvoided: integer("danger_zones_avoided").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSafePathSchema = createInsertSchema(safePaths).omit({ id: true, createdAt: true });
export type InsertSafePath = z.infer<typeof insertSafePathSchema>;
export type SafePath = typeof safePaths.$inferSelect;
