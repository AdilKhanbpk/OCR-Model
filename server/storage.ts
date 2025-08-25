import {
  users,
  apiKeys,
  jobs,
  usageLogs,
  quotas,
  webhooks,
  webhookDeliveries,
  fieldCorrections,
  trainingExports,
  integrations,
  systemConfig,
  type User,
  type UpsertUser,
  type ApiKey,
  type Job,
  type UsageLog,
  type Quota,
  type Webhook,
  type WebhookDelivery,
  type FieldCorrection,
  type TrainingExport,
  type Integration,
  type SystemConfig,
  type InsertApiKey,
  type InsertJob,
  type InsertUsageLog,
  type InsertWebhook,
  type InsertFieldCorrection,
  type InsertIntegration,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPlan(id: string, plan: string): Promise<User>;
  updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User>;
  
  // API Key operations
  createApiKey(apiKey: InsertApiKey & { keyHash: string }): Promise<ApiKey>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  getUserApiKeys(userId: string): Promise<ApiKey[]>;
  deleteApiKey(id: string, userId: string): Promise<void>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  
  // Job operations
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  getUserJobs(userId: string, limit?: number): Promise<Job[]>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job>;
  getJobsByStatus(status: string): Promise<Job[]>;
  
  // Usage tracking
  createUsageLog(log: InsertUsageLog): Promise<UsageLog>;
  getUserUsage(userId: string, year: number, month: number): Promise<Quota | undefined>;
  incrementUserUsage(userId: string, pages: number): Promise<Quota>;
  getUserUsageLogs(userId: string, limit?: number): Promise<UsageLog[]>;
  
  // Webhook operations
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  getUserWebhooks(userId: string): Promise<Webhook[]>;
  getWebhook(id: string): Promise<Webhook | undefined>;
  deleteWebhook(id: string, userId: string): Promise<void>;
  updateWebhookStats(id: string, stats: { successCount?: number; failureCount?: number; lastTriggered?: Date }): Promise<void>;

  // Webhook delivery operations
  createWebhookDelivery(delivery: Omit<WebhookDelivery, 'id' | 'createdAt'>): Promise<string>;
  updateWebhookDelivery(id: string, updates: Partial<WebhookDelivery>): Promise<void>;
  getWebhookDeliveries(webhookId: string, limit?: number): Promise<WebhookDelivery[]>;

  // Field correction operations
  createFieldCorrection(correction: InsertFieldCorrection): Promise<FieldCorrection>;
  getJobCorrections(jobId: string): Promise<FieldCorrection[]>;
  getUserCorrections(userId: string, limit?: number): Promise<FieldCorrection[]>;

  // Training export operations
  createTrainingExport(exportData: Omit<TrainingExport, 'id' | 'createdAt'>): Promise<TrainingExport>;
  getTrainingExports(docType?: string, limit?: number): Promise<TrainingExport[]>;

  // Integration operations
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  getUserIntegrations(userId: string): Promise<Integration[]>;
  updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration>;
  deleteIntegration(id: string, userId: string): Promise<void>;

  // System configuration
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  setSystemConfig(key: string, value: any, description?: string, updatedBy?: string): Promise<SystemConfig>;

  // Admin operations
  getAllUsers(limit?: number, offset?: number): Promise<{ users: User[]; total: number }>;
  getAllJobs(limit?: number, offset?: number): Promise<{ jobs: Job[]; total: number }>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalJobs: number;
    totalUsage: number;
    activeUsers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPlan(id: string, plan: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ plan, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // API Key operations
  async createApiKey(apiKey: InsertApiKey & { keyHash: string }): Promise<ApiKey> {
    const [key] = await db.insert(apiKeys).values(apiKey).returning();
    return key;
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    return key;
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
  }

  async deleteApiKey(id: string, userId: string): Promise<void> {
    await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await db.update(apiKeys).set({ lastUsed: new Date() }).where(eq(apiKeys.id, id));
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getUserJobs(userId: string, limit = 50): Promise<Job[]> {
    return db
      .select()
      .from(jobs)
      .where(eq(jobs.userId, userId))
      .orderBy(desc(jobs.createdAt))
      .limit(limit);
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.status, status));
  }

  // Usage tracking
  async createUsageLog(log: InsertUsageLog): Promise<UsageLog> {
    const [usageLog] = await db.insert(usageLogs).values(log).returning();
    return usageLog;
  }

  async getUserUsage(userId: string, year: number, month: number): Promise<Quota | undefined> {
    const [quota] = await db
      .select()
      .from(quotas)
      .where(and(eq(quotas.userId, userId), eq(quotas.year, year), eq(quotas.month, month)));
    return quota;
  }

  async incrementUserUsage(userId: string, pages: number): Promise<Quota> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [quota] = await db
      .insert(quotas)
      .values({
        userId,
        year,
        month,
        pagesUsed: pages,
        requestCount: 1,
      })
      .onConflictDoUpdate({
        target: [quotas.userId, quotas.year, quotas.month],
        set: {
          pagesUsed: sql`${quotas.pagesUsed} + ${pages}`,
          requestCount: sql`${quotas.requestCount} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning();
    return quota;
  }

  async getUserUsageLogs(userId: string, limit = 100): Promise<UsageLog[]> {
    return db
      .select()
      .from(usageLogs)
      .where(eq(usageLogs.userId, userId))
      .orderBy(desc(usageLogs.createdAt))
      .limit(limit);
  }

  // Webhook operations
  async createWebhook(webhook: InsertWebhook): Promise<Webhook> {
    const [newWebhook] = await db.insert(webhooks).values(webhook).returning();
    return newWebhook;
  }

  async getUserWebhooks(userId: string): Promise<Webhook[]> {
    return db.select().from(webhooks).where(eq(webhooks.userId, userId));
  }

  async getWebhook(id: string): Promise<Webhook | undefined> {
    const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, id));
    return webhook;
  }

  async deleteWebhook(id: string, userId: string): Promise<void> {
    await db.delete(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.userId, userId)));
  }

  async updateWebhookStats(id: string, stats: { successCount?: number; failureCount?: number; lastTriggered?: Date }): Promise<void> {
    await db.update(webhooks).set(stats).where(eq(webhooks.id, id));
  }

  // Webhook delivery operations
  async createWebhookDelivery(delivery: Omit<WebhookDelivery, 'id' | 'createdAt'>): Promise<string> {
    const [newDelivery] = await db.insert(webhookDeliveries).values(delivery as any).returning();
    return newDelivery.id;
  }

  async updateWebhookDelivery(id: string, updates: Partial<WebhookDelivery>): Promise<void> {
    await db.update(webhookDeliveries).set(updates).where(eq(webhookDeliveries.id, id));
  }

  async getWebhookDeliveries(webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    return db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookId, webhookId))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(limit);
  }

  // Field correction operations
  async createFieldCorrection(correction: InsertFieldCorrection): Promise<FieldCorrection> {
    const [newCorrection] = await db.insert(fieldCorrections).values(correction).returning();
    return newCorrection;
  }

  async getJobCorrections(jobId: string): Promise<FieldCorrection[]> {
    return db.select().from(fieldCorrections).where(eq(fieldCorrections.jobId, jobId));
  }

  async getUserCorrections(userId: string, limit = 100): Promise<FieldCorrection[]> {
    return db
      .select()
      .from(fieldCorrections)
      .where(eq(fieldCorrections.correctedBy, userId))
      .orderBy(desc(fieldCorrections.createdAt))
      .limit(limit);
  }

  // Training export operations
  async createTrainingExport(exportData: Omit<TrainingExport, 'id' | 'createdAt'>): Promise<TrainingExport> {
    const [newExport] = await db.insert(trainingExports).values(exportData as any).returning();
    return newExport;
  }

  async getTrainingExports(docType?: string, limit = 50): Promise<TrainingExport[]> {
    const query = db.select().from(trainingExports).orderBy(desc(trainingExports.createdAt)).limit(limit);

    if (docType) {
      return query.where(eq(trainingExports.docType, docType));
    }

    return query;
  }

  // Integration operations
  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [newIntegration] = await db.insert(integrations).values(integration).returning();
    return newIntegration;
  }

  async getUserIntegrations(userId: string): Promise<Integration[]> {
    return db.select().from(integrations).where(eq(integrations.userId, userId));
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration> {
    const [updatedIntegration] = await db
      .update(integrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return updatedIntegration;
  }

  async deleteIntegration(id: string, userId: string): Promise<void> {
    await db.delete(integrations).where(and(eq(integrations.id, id), eq(integrations.userId, userId)));
  }

  // System configuration
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfig).where(eq(systemConfig.key, key));
    return config;
  }

  async setSystemConfig(key: string, value: any, description?: string, updatedBy?: string): Promise<SystemConfig> {
    const [config] = await db
      .insert(systemConfig)
      .values({ key, value, description, updatedBy })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: {
          value,
          description,
          updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
    return config;
  }

  // Admin operations
  async getAllUsers(limit = 50, offset = 0): Promise<{ users: User[]; total: number }> {
    const [userList, totalCount] = await Promise.all([
      db.select().from(users).limit(limit).offset(offset).orderBy(desc(users.createdAt)),
      db.select({ count: count() }).from(users),
    ]);

    return {
      users: userList,
      total: totalCount[0].count,
    };
  }

  async getAllJobs(limit = 50, offset = 0): Promise<{ jobs: Job[]; total: number }> {
    const [jobList, totalCount] = await Promise.all([
      db.select().from(jobs).limit(limit).offset(offset).orderBy(desc(jobs.createdAt)),
      db.select({ count: count() }).from(jobs),
    ]);

    return {
      jobs: jobList,
      total: totalCount[0].count,
    };
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalJobs: number;
    totalUsage: number;
    activeUsers: number;
  }> {
    const [userCount, jobCount, usageSum, activeUserCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(jobs),
      db.select({ sum: sql<number>`COALESCE(SUM(${quotas.pagesUsed}), 0)` }).from(quotas),
      db
        .select({ count: count() })
        .from(quotas)
        .where(sql`${quotas.year} = EXTRACT(YEAR FROM NOW()) AND ${quotas.month} = EXTRACT(MONTH FROM NOW())`),
    ]);

    return {
      totalUsers: userCount[0].count,
      totalJobs: jobCount[0].count,
      totalUsage: Number(usageSum[0].sum),
      activeUsers: activeUserCount[0].count,
    };
  }
}

export const storage = new DatabaseStorage();
