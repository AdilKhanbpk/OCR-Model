import { 
  User, 
  ApiKey, 
  Job, 
  UsageLog, 
  Quota, 
  Webhook, 
  WebhookDelivery, 
  FieldCorrection,
  connectDatabase 
} from './models';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import type { 
  User as UserType, 
  ApiKey as ApiKeyType, 
  Job as JobType, 
  UsageLog as UsageLogType,
  Quota as QuotaType,
  Webhook as WebhookType,
  InsertUser,
  InsertApiKey,
  InsertJob,
  InsertUsageLog,
  InsertWebhook
} from '@shared/schema';

export class MongoStorage {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    await connectDatabase();
    this.initialized = true;
    console.log('🗄️ MongoDB storage initialized');
  }

  // User operations
  async createUser(userData: InsertUser): Promise<UserType> {
    const user = new User({
      ...userData,
      id: nanoid(),
    });
    
    const saved = await user.save();
    
    // Create default quota
    await this.createQuota({
      userId: saved._id.toString(),
      pages: userData.plan === 'free' ? 100 : userData.plan === 'pro' ? 1000 : 10000,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return this.formatUser(saved);
  }

  async getUser(id: string): Promise<UserType | null> {
    const user = await User.findById(id);
    return user ? this.formatUser(user) : null;
  }

  async getUserByEmail(email: string): Promise<UserType | null> {
    const user = await User.findOne({ email });
    return user ? this.formatUser(user) : null;
  }

  async getUserByGoogleId(googleId: string): Promise<UserType | null> {
    const user = await User.findOne({ googleId });
    return user ? this.formatUser(user) : null;
  }

  async updateUser(id: string, updates: Partial<UserType>): Promise<UserType | null> {
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    return user ? this.formatUser(user) : null;
  }

  // API Key operations
  async createApiKey(keyData: InsertApiKey): Promise<ApiKeyType> {
    const hashedKey = await bcrypt.hash(keyData.keyHash, 10);
    
    const apiKey = new ApiKey({
      ...keyData,
      id: nanoid(),
      keyHash: hashedKey,
    });
    
    const saved = await apiKey.save();
    return this.formatApiKey(saved);
  }

  async getApiKey(keyHash: string): Promise<ApiKeyType | null> {
    const apiKeys = await ApiKey.find({ isActive: true });
    
    for (const key of apiKeys) {
      if (await bcrypt.compare(keyHash, key.keyHash)) {
        await ApiKey.findByIdAndUpdate(key._id, { lastUsed: new Date() });
        return this.formatApiKey(key);
      }
    }
    
    return null;
  }

  async getUserApiKeys(userId: string): Promise<ApiKeyType[]> {
    const apiKeys = await ApiKey.find({ userId, isActive: true });
    return apiKeys.map(key => this.formatApiKey(key));
  }

  async deleteApiKey(id: string, userId: string): Promise<void> {
    await ApiKey.findOneAndUpdate(
      { _id: id, userId }, 
      { isActive: false }
    );
  }

  // Job operations
  async createJob(jobData: InsertJob): Promise<JobType> {
    const job = new Job({
      ...jobData,
      id: nanoid(),
    });
    
    const saved = await job.save();
    return this.formatJob(saved);
  }

  async getJob(id: string): Promise<JobType | null> {
    const job = await Job.findById(id);
    return job ? this.formatJob(job) : null;
  }

  async getUserJobs(userId: string, limit: number = 50): Promise<JobType[]> {
    const jobs = await Job.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    return jobs.map(job => this.formatJob(job));
  }

  async getJobsByStatus(status: string): Promise<JobType[]> {
    const jobs = await Job.find({ status }).sort({ createdAt: -1 });
    return jobs.map(job => this.formatJob(job));
  }

  async updateJob(id: string, updates: Partial<JobType>): Promise<JobType | null> {
    const job = await Job.findByIdAndUpdate(id, updates, { new: true });
    return job ? this.formatJob(job) : null;
  }

  // Usage Log operations
  async createUsageLog(logData: InsertUsageLog): Promise<UsageLogType> {
    const log = new UsageLog({
      ...logData,
      id: nanoid(),
    });
    
    const saved = await log.save();
    return this.formatUsageLog(saved);
  }

  async getUserUsageLogs(userId: string, limit: number = 100): Promise<UsageLogType[]> {
    const logs = await UsageLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    return logs.map(log => this.formatUsageLog(log));
  }

  // Quota operations
  async createQuota(quotaData: { userId: string; pages: number; resetDate: Date }): Promise<QuotaType> {
    const quota = new Quota({
      ...quotaData,
      id: nanoid(),
    });
    
    const saved = await quota.save();
    return this.formatQuota(saved);
  }

  async getUserQuota(userId: string): Promise<QuotaType | null> {
    const quota = await Quota.findOne({ userId });
    return quota ? this.formatQuota(quota) : null;
  }

  async updateQuota(userId: string, updates: Partial<QuotaType>): Promise<QuotaType | null> {
    const quota = await Quota.findOneAndUpdate({ userId }, updates, { new: true });
    return quota ? this.formatQuota(quota) : null;
  }

  // Webhook operations
  async createWebhook(webhookData: InsertWebhook): Promise<WebhookType> {
    const webhook = new Webhook({
      ...webhookData,
      id: nanoid(),
    });
    
    const saved = await webhook.save();
    return this.formatWebhook(saved);
  }

  async getUserWebhooks(userId: string): Promise<WebhookType[]> {
    const webhooks = await Webhook.find({ userId, active: true });
    return webhooks.map(webhook => this.formatWebhook(webhook));
  }

  async deleteWebhook(id: string, userId: string): Promise<void> {
    await Webhook.findOneAndUpdate(
      { _id: id, userId }, 
      { active: false }
    );
  }

  // Field Correction operations
  async createFieldCorrection(correctionData: any): Promise<any> {
    const correction = new FieldCorrection({
      ...correctionData,
      id: nanoid(),
    });
    
    return await correction.save();
  }

  async getJobCorrections(jobId: string): Promise<any[]> {
    return await FieldCorrection.find({ jobId });
  }

  // Formatting methods
  private formatUser(user: any): UserType {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      plan: user.plan,
      role: user.role,
      stripeCustomerId: user.stripeCustomerId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private formatApiKey(apiKey: any): ApiKeyType {
    return {
      id: apiKey._id.toString(),
      userId: apiKey.userId.toString(),
      name: apiKey.name,
      keyHash: apiKey.keyHash,
      lastUsed: apiKey.lastUsed,
      createdAt: apiKey.createdAt,
    };
  }

  private formatJob(job: any): JobType {
    return {
      id: job._id.toString(),
      userId: job.userId.toString(),
      type: job.type,
      status: job.status,
      filename: job.filename,
      originalUrl: job.originalUrl,
      gcsPath: job.gcsPath,
      mime: job.mime,
      size: job.size,
      pages: job.pages,
      docType: job.docType,
      docTypeConfidence: job.docTypeConfidence,
      processorType: job.processorType,
      processorId: job.processorId,
      languageHints: job.languageHints,
      detectHandwriting: job.detectHandwriting,
      searchablePdf: job.searchablePdf,
      rawText: job.rawText,
      structuredData: job.structuredData,
      extractedFields: job.extractedFields,
      searchablePdfUrl: job.searchablePdfUrl,
      confidence: job.confidence,
      processingTime: job.processingTime,
      costEstimate: job.costEstimate,
      needsReview: job.needsReview,
      reviewedBy: job.reviewedBy?.toString(),
      reviewedAt: job.reviewedAt,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  private formatUsageLog(log: any): UsageLogType {
    return {
      id: log._id.toString(),
      userId: log.userId.toString(),
      jobId: log.jobId?.toString(),
      apiKeyId: log.apiKeyId?.toString(),
      pages: log.pages,
      bytes: log.bytes,
      status: log.status,
      processorType: log.processorType,
      costIncurred: log.costIncurred,
      ip: log.ip,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    };
  }

  private formatQuota(quota: any): QuotaType {
    return {
      id: quota._id.toString(),
      userId: quota.userId.toString(),
      pages: quota.pages,
      pagesUsed: quota.pagesUsed,
      resetDate: quota.resetDate,
      createdAt: quota.createdAt,
      updatedAt: quota.updatedAt,
    };
  }

  private formatWebhook(webhook: any): WebhookType {
    return {
      id: webhook._id.toString(),
      userId: webhook.userId.toString(),
      url: webhook.url,
      secret: webhook.secret,
      events: webhook.events,
      active: webhook.active,
      lastTriggered: webhook.lastTriggered,
      successCount: webhook.successCount,
      failureCount: webhook.failureCount,
      createdAt: webhook.createdAt,
    };
  }
}
