import { eq, or } from "drizzle-orm";
import {
  profiles,
  emergencyAlerts,
  sensorThresholds,
  buddyConnections,
  dangerousZones,
  safePaths,
} from "@shared/schema";
import type {
  Profile,
  InsertProfile,
  EmergencyAlert,
  InsertEmergencyAlert,
  SensorThreshold,
  InsertSensorThreshold,
  BuddyConnection,
  InsertBuddyConnection,
  DangerousZone,
  InsertDangerousZone,
  SafePath,
  InsertSafePath,
} from "@shared/schema";

export interface IStorage {
  // Profiles
  getProfile(id: string): Promise<Profile | null>;
  createProfile(profile: InsertProfile & { id: string }): Promise<Profile>;
  updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | null>;

  // Emergency Alerts
  getEmergencyAlerts(userId: string): Promise<EmergencyAlert[]>;
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  updateEmergencyAlert(id: string, alert: Partial<InsertEmergencyAlert>): Promise<EmergencyAlert | null>;

  // Sensor Thresholds
  getSensorThreshold(userId: string): Promise<SensorThreshold | null>;
  createSensorThreshold(threshold: InsertSensorThreshold): Promise<SensorThreshold>;
  updateSensorThreshold(userId: string, threshold: Partial<InsertSensorThreshold>): Promise<SensorThreshold | null>;

  // Buddy Connections
  getBuddyConnections(userId: string): Promise<BuddyConnection[]>;
  createBuddyConnection(connection: InsertBuddyConnection): Promise<BuddyConnection>;
  updateBuddyConnection(id: string, connection: Partial<InsertBuddyConnection>): Promise<BuddyConnection | null>;
  deleteBuddyConnection(id: string): Promise<boolean>;

  // Dangerous Zones
  getAllDangerousZones(): Promise<DangerousZone[]>;
  createDangerousZone(zone: InsertDangerousZone): Promise<DangerousZone>;

  // Safe Paths
  getSafePaths(userId: string): Promise<SafePath[]>;
  createSafePath(path: InsertSafePath): Promise<SafePath>;
}

export class DbStorage implements IStorage {
  constructor(private db: any) {}

  async getProfile(id: string): Promise<Profile | null> {
    const result = await this.db.query.profiles.findFirst({
      where: (p: any, { eq }: any) => eq(p.id, id),
    });
    return result || null;
  }

  async createProfile(profile: InsertProfile & { id: string }): Promise<Profile> {
    const [result] = await this.db.insert(profiles).values(profile).returning();
    return result;
  }

  async updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile | null> {
    const [result] = await this.db
      .update(profiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return result || null;
  }

  async getEmergencyAlerts(userId: string): Promise<EmergencyAlert[]> {
    return await this.db.query.emergencyAlerts.findMany({
      where: (alerts: any, { eq }: any) => eq(alerts.userId, userId),
      orderBy: (alerts: any, { desc }: any) => [desc(alerts.createdAt)],
    });
  }

  async createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [result] = await this.db.insert(emergencyAlerts).values(alert).returning();
    return result;
  }

  async updateEmergencyAlert(id: string, alert: Partial<InsertEmergencyAlert>): Promise<EmergencyAlert | null> {
    const [result] = await this.db
      .update(emergencyAlerts)
      .set(alert)
      .where(eq(emergencyAlerts.id, id))
      .returning();
    return result || null;
  }

  async getSensorThreshold(userId: string): Promise<SensorThreshold | null> {
    const result = await this.db.query.sensorThresholds.findFirst({
      where: (thresholds: any, { eq }: any) => eq(thresholds.userId, userId),
    });
    return result || null;
  }

  async createSensorThreshold(threshold: InsertSensorThreshold): Promise<SensorThreshold> {
    const [result] = await this.db.insert(sensorThresholds).values(threshold).returning();
    return result;
  }

  async updateSensorThreshold(userId: string, threshold: Partial<InsertSensorThreshold>): Promise<SensorThreshold | null> {
    const [result] = await this.db
      .update(sensorThresholds)
      .set({ ...threshold, updatedAt: new Date() })
      .where(eq(sensorThresholds.userId, userId))
      .returning();
    return result || null;
  }

  async getBuddyConnections(userId: string): Promise<BuddyConnection[]> {
    return await this.db.query.buddyConnections.findMany({
      where: (connections: any, { eq, or }: any) => or(
        eq(connections.userId, userId),
        eq(connections.buddyId, userId)
      ),
    });
  }

  async createBuddyConnection(connection: InsertBuddyConnection): Promise<BuddyConnection> {
    const [result] = await this.db.insert(buddyConnections).values(connection).returning();
    return result;
  }

  async updateBuddyConnection(id: string, connection: Partial<InsertBuddyConnection>): Promise<BuddyConnection | null> {
    const [result] = await this.db
      .update(buddyConnections)
      .set(connection)
      .where(eq(buddyConnections.id, id))
      .returning();
    return result || null;
  }

  async deleteBuddyConnection(id: string): Promise<boolean> {
    const result = await this.db
      .delete(buddyConnections)
      .where(eq(buddyConnections.id, id));
    return result.rowCount > 0;
  }

  async getAllDangerousZones(): Promise<DangerousZone[]> {
    return await this.db.query.dangerousZones.findMany({
      orderBy: (zones: any, { desc }: any) => [desc(zones.createdAt)],
    });
  }

  async createDangerousZone(zone: InsertDangerousZone): Promise<DangerousZone> {
    const [result] = await this.db.insert(dangerousZones).values(zone).returning();
    return result;
  }

  async getSafePaths(userId: string): Promise<SafePath[]> {
    return await this.db.query.safePaths.findMany({
      where: (paths: any, { eq }: any) => eq(paths.userId, userId),
      orderBy: (paths: any, { desc }: any) => [desc(paths.createdAt)],
    });
  }

  async createSafePath(path: InsertSafePath): Promise<SafePath> {
    const [result] = await this.db.insert(safePaths).values(path).returning();
    return result;
  }
}
