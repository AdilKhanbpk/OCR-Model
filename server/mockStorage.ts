import { nanoid } from 'nanoid';
import type {
  User,
  UpsertUser,
  ApiKey,
  Job,
  UsageLog,
  Quota,
  Webhook,
  WebhookDelivery,
  FieldCorrection,
  TrainingExport,
  Integration,
  SystemConfig,
  InsertApiKey,
  InsertJob,
  InsertUsageLog,
  InsertWebhook,
  InsertFieldCorrection,
  InsertIntegration,
} from "@shared/schema";

// In-memory storage
const mockData = {
  users: new Map<string, User>(),
  apiKeys: new Map<string, ApiKey>(),
  jobs: new Map<string, Job>(),
  usageLogs: new Map<string, UsageLog>(),
  quotas: new Map<string, Quota>(),
  webhooks: new Map<string, Webhook>(),
  webhookDeliveries: new Map<string, WebhookDelivery>(),
  fieldCorrections: new Map<string, FieldCorrection>(),
  trainingExports: new Map<string, TrainingExport>(),
  integrations: new Map<string, Integration>(),
  systemConfig: new Map<string, SystemConfig>(),
};

// Create default demo user
const demoUser: User = {
  id: 'demo-user-1',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  plan: 'pro',
  role: 'admin',
  stripeCustomerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const demoApiKey: ApiKey = {
  id: 'demo-api-key-1',
  userId: 'demo-user-1',
  name: 'Demo API Key',
  keyHash: 'demo-key-hash',
  lastUsed: null,
  createdAt: new Date(),
};

// Initialize with demo data
mockData.users.set(demoUser.id, demoUser);
mockData.apiKeys.set(demoApiKey.id, demoApiKey);

export class MockStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    console.log(`[MOCK] Getting user: ${id}`);
    return mockData.users.get(id) || demoUser; // Always return demo user
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log(`[MOCK] Getting user by email: ${email}`);
    return demoUser; // Always return demo user
  }

  async createUser(user: UpsertUser): Promise<User> {
    console.log(`[MOCK] Creating user:`, user);
    const newUser: User = {
      id: nanoid(),
      ...user,
      plan: user.plan || 'free',
      role: user.role || 'user',
      stripeCustomerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockData.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    console.log(`[MOCK] Updating user ${id}:`, updates);
    const user = mockData.users.get(id) || demoUser;
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    mockData.users.set(id, updatedUser);
    return updatedUser;
  }

  // API Key operations
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    console.log(`[MOCK] Creating API key:`, apiKey);
    const newApiKey: ApiKey = {
      id: nanoid(),
      ...apiKey,
      keyHash: `mock-hash-${nanoid()}`,
      lastUsed: null,
      createdAt: new Date(),
    };
    mockData.apiKeys.set(newApiKey.id, newApiKey);
    return newApiKey;
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    console.log(`[MOCK] Getting API keys for user: ${userId}`);
    return [demoApiKey]; // Return demo API key
  }

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    console.log(`[MOCK] Getting API key by hash: ${keyHash}`);
    return demoApiKey; // Always return demo API key for any hash
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    console.log(`[MOCK] Updating API key last used: ${id}`);
    // No-op in mock mode
  }

  async deleteApiKey(id: string, userId: string): Promise<void> {
    console.log(`[MOCK] Deleting API key: ${id} for user: ${userId}`);
    mockData.apiKeys.delete(id);
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    console.log(`[MOCK] Creating job:`, job);
    const newJob: Job = {
      id: nanoid(),
      ...job,
      type: job.type || 'image',
      status: job.status || 'queued',
      pages: job.pages || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Job;
    mockData.jobs.set(newJob.id, newJob);
    return newJob;
  }

  async getJob(id: string): Promise<Job | undefined> {
    console.log(`[MOCK] Getting job: ${id}`);
    return mockData.jobs.get(id);
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
    console.log(`[MOCK] Updating job ${id}:`, updates);
    const job = mockData.jobs.get(id);
    if (!job) throw new Error('Job not found');
    const updatedJob = { ...job, ...updates, updatedAt: new Date() };
    mockData.jobs.set(id, updatedJob);
    return updatedJob;
  }

  async getUserJobs(userId: string, limit = 50): Promise<Job[]> {
    console.log(`[MOCK] Getting jobs for user: ${userId}, limit: ${limit}`);
    return Array.from(mockData.jobs.values())
      .filter(job => job.userId === userId)
      .slice(0, limit);
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    console.log(`[MOCK] Getting jobs by status: ${status}`);
    return Array.from(mockData.jobs.values())
      .filter(job => job.status === status);
  }

  // Usage operations
  async createUsageLog(usage: InsertUsageLog): Promise<UsageLog> {
    console.log(`[MOCK] Creating usage log:`, usage);
    const newUsage: UsageLog = {
      id: nanoid(),
      ...usage,
      createdAt: new Date(),
    } as UsageLog;
    mockData.usageLogs.set(newUsage.id, newUsage);
    return newUsage;
  }

  async getUserUsage(userId: string, year: number, month: number): Promise<{ pagesUsed: number } | undefined> {
    console.log(`[MOCK] Getting user usage: ${userId}, ${year}-${month}`);
    return { pagesUsed: 150 }; // Mock usage
  }

  async incrementUserUsage(userId: string, pages: number): Promise<void> {
    console.log(`[MOCK] Incrementing user usage: ${userId}, pages: ${pages}`);
    // No-op in mock mode
  }

  async getUserUsageLogs(userId: string, limit = 50): Promise<UsageLog[]> {
    console.log(`[MOCK] Getting usage logs for user: ${userId}, limit: ${limit}`);
    return Array.from(mockData.usageLogs.values())
      .filter(log => log.userId === userId)
      .slice(0, limit);
  }

  // Quota operations
  async getUserQuota(userId: string): Promise<Quota | undefined> {
    console.log(`[MOCK] Getting quota for user: ${userId}`);
    return {
      id: nanoid(),
      userId,
      pages: 1000,
      pagesUsed: 150,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Webhook operations
  async createWebhook(webhook: InsertWebhook): Promise<Webhook> {
    console.log(`[MOCK] Creating webhook:`, webhook);
    const newWebhook: Webhook = {
      id: nanoid(),
      ...webhook,
      successCount: 0,
      failureCount: 0,
      lastTriggered: null,
      createdAt: new Date(),
    } as Webhook;
    mockData.webhooks.set(newWebhook.id, newWebhook);
    return newWebhook;
  }

  async getUserWebhooks(userId: string): Promise<Webhook[]> {
    console.log(`[MOCK] Getting webhooks for user: ${userId}`);
    return Array.from(mockData.webhooks.values())
      .filter(webhook => webhook.userId === userId);
  }

  async getWebhook(id: string): Promise<Webhook | undefined> {
    console.log(`[MOCK] Getting webhook: ${id}`);
    return mockData.webhooks.get(id);
  }

  async deleteWebhook(id: string, userId: string): Promise<void> {
    console.log(`[MOCK] Deleting webhook: ${id} for user: ${userId}`);
    mockData.webhooks.delete(id);
  }

  async updateWebhookStats(id: string, stats: { successCount?: number; failureCount?: number; lastTriggered?: Date }): Promise<void> {
    console.log(`[MOCK] Updating webhook stats: ${id}`, stats);
    const webhook = mockData.webhooks.get(id);
    if (webhook) {
      Object.assign(webhook, stats);
    }
  }

  // Webhook delivery operations
  async createWebhookDelivery(delivery: Omit<WebhookDelivery, 'id' | 'createdAt'>): Promise<string> {
    console.log(`[MOCK] Creating webhook delivery:`, delivery);
    const id = nanoid();
    const newDelivery: WebhookDelivery = {
      id,
      ...delivery,
      createdAt: new Date(),
    } as WebhookDelivery;
    mockData.webhookDeliveries.set(id, newDelivery);
    return id;
  }

  async updateWebhookDelivery(id: string, updates: Partial<WebhookDelivery>): Promise<void> {
    console.log(`[MOCK] Updating webhook delivery: ${id}`, updates);
    const delivery = mockData.webhookDeliveries.get(id);
    if (delivery) {
      Object.assign(delivery, updates);
    }
  }

  async getWebhookDeliveries(webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    console.log(`[MOCK] Getting webhook deliveries: ${webhookId}, limit: ${limit}`);
    return Array.from(mockData.webhookDeliveries.values())
      .filter(delivery => delivery.webhookId === webhookId)
      .slice(0, limit);
  }

  // Field correction operations
  async createFieldCorrection(correction: InsertFieldCorrection): Promise<FieldCorrection> {
    console.log(`[MOCK] Creating field correction:`, correction);
    const newCorrection: FieldCorrection = {
      id: nanoid(),
      ...correction,
      createdAt: new Date(),
    } as FieldCorrection;
    mockData.fieldCorrections.set(newCorrection.id, newCorrection);
    return newCorrection;
  }

  async getJobCorrections(jobId: string): Promise<FieldCorrection[]> {
    console.log(`[MOCK] Getting corrections for job: ${jobId}`);
    return Array.from(mockData.fieldCorrections.values())
      .filter(correction => correction.jobId === jobId);
  }

  async getUserCorrections(userId: string, limit = 100): Promise<FieldCorrection[]> {
    console.log(`[MOCK] Getting corrections for user: ${userId}, limit: ${limit}`);
    return Array.from(mockData.fieldCorrections.values())
      .filter(correction => correction.correctedBy === userId)
      .slice(0, limit);
  }

  // Training export operations
  async createTrainingExport(exportData: Omit<TrainingExport, 'id' | 'createdAt'>): Promise<TrainingExport> {
    console.log(`[MOCK] Creating training export:`, exportData);
    const newExport: TrainingExport = {
      id: nanoid(),
      ...exportData,
      createdAt: new Date(),
    } as TrainingExport;
    mockData.trainingExports.set(newExport.id, newExport);
    return newExport;
  }

  async getTrainingExports(docType?: string, limit = 50): Promise<TrainingExport[]> {
    console.log(`[MOCK] Getting training exports: ${docType}, limit: ${limit}`);
    let exports = Array.from(mockData.trainingExports.values());
    if (docType) {
      exports = exports.filter(exp => exp.docType === docType);
    }
    return exports.slice(0, limit);
  }

  // Integration operations
  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    console.log(`[MOCK] Creating integration:`, integration);
    const newIntegration: Integration = {
      id: nanoid(),
      ...integration,
      syncCount: 0,
      errorCount: 0,
      lastSync: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Integration;
    mockData.integrations.set(newIntegration.id, newIntegration);
    return newIntegration;
  }

  async getUserIntegrations(userId: string): Promise<Integration[]> {
    console.log(`[MOCK] Getting integrations for user: ${userId}`);
    return Array.from(mockData.integrations.values())
      .filter(integration => integration.userId === userId);
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration> {
    console.log(`[MOCK] Updating integration: ${id}`, updates);
    const integration = mockData.integrations.get(id);
    if (!integration) throw new Error('Integration not found');
    const updated = { ...integration, ...updates, updatedAt: new Date() };
    mockData.integrations.set(id, updated);
    return updated;
  }

  async deleteIntegration(id: string, userId: string): Promise<void> {
    console.log(`[MOCK] Deleting integration: ${id} for user: ${userId}`);
    mockData.integrations.delete(id);
  }

  // System configuration
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    console.log(`[MOCK] Getting system config: ${key}`);
    return mockData.systemConfig.get(key);
  }

  async setSystemConfig(key: string, value: any, description?: string, updatedBy?: string): Promise<SystemConfig> {
    console.log(`[MOCK] Setting system config: ${key}`, value);
    const config: SystemConfig = {
      id: nanoid(),
      key,
      value,
      description: description || null,
      updatedBy: updatedBy || null,
      updatedAt: new Date(),
    };
    mockData.systemConfig.set(key, config);
    return config;
  }

  // Admin operations
  async getAllUsers(limit = 50, offset = 0): Promise<{ users: User[]; total: number }> {
    console.log(`[MOCK] Getting all users: limit=${limit}, offset=${offset}`);
    const users = Array.from(mockData.users.values()).slice(offset, offset + limit);
    return { users, total: mockData.users.size };
  }

  async getAllJobs(limit = 50, offset = 0): Promise<{ jobs: Job[]; total: number }> {
    console.log(`[MOCK] Getting all jobs: limit=${limit}, offset=${offset}`);
    const jobs = Array.from(mockData.jobs.values()).slice(offset, offset + limit);
    return { jobs, total: mockData.jobs.size };
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalJobs: number;
    totalUsage: number;
    activeUsers: number;
  }> {
    console.log(`[MOCK] Getting system stats`);
    return {
      totalUsers: mockData.users.size,
      totalJobs: mockData.jobs.size,
      totalUsage: 2500,
      activeUsers: Math.floor(mockData.users.size * 0.7),
    };
  }
}

export const mockStorage = new MockStorage();
