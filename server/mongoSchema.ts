// MongoDB Schema Definitions for Future Use
// This file contains the MongoDB schema definitions that will be used
// when DATABASE_ENABLED is set to true

import { z } from 'zod';

// User Schema
export const UserSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  plan: z.enum(['free', 'pro', 'business']).default('free'),
  role: z.enum(['user', 'admin']).default('user'),
  stripeCustomerId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// API Key Schema
export const ApiKeySchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  keyHash: z.string(),
  lastUsed: z.date().nullable(),
  createdAt: z.date(),
});

// Job Schema
export const JobSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  status: z.string(),
  filename: z.string(),
  originalUrl: z.string().optional(),
  gcsPath: z.string().optional(),
  mime: z.string(),
  size: z.number(),
  pages: z.number().default(1),
  docType: z.string().optional(),
  docTypeConfidence: z.string().optional(),
  processorType: z.string().optional(),
  processorId: z.string().optional(),
  languageHints: z.array(z.string()).optional(),
  detectHandwriting: z.boolean().default(false),
  searchablePdf: z.boolean().default(false),
  rawText: z.string().optional(),
  structuredData: z.any().optional(),
  extractedFields: z.any().optional(),
  searchablePdfUrl: z.string().optional(),
  confidence: z.string().optional(),
  processingTime: z.number().optional(),
  costEstimate: z.string().optional(),
  needsReview: z.boolean().default(false),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Usage Log Schema
export const UsageLogSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  userId: z.string(),
  jobId: z.string().optional(),
  apiKeyId: z.string().optional(),
  pages: z.number(),
  bytes: z.number(),
  status: z.string(),
  processorType: z.string().optional(),
  costIncurred: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
});

// Quota Schema
export const QuotaSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  userId: z.string(),
  pages: z.number(),
  pagesUsed: z.number(),
  resetDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Webhook Schema
export const WebhookSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  userId: z.string(),
  url: z.string(),
  secret: z.string(),
  events: z.array(z.string()),
  active: z.boolean().default(true),
  lastTriggered: z.date().optional(),
  successCount: z.number().default(0),
  failureCount: z.number().default(0),
  createdAt: z.date(),
});

// Webhook Delivery Schema
export const WebhookDeliverySchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  webhookId: z.string(),
  jobId: z.string().optional(),
  event: z.string(),
  payload: z.any(),
  status: z.string(),
  httpStatus: z.number().optional(),
  responseBody: z.string().optional(),
  attempts: z.number().default(1),
  nextRetryAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  createdAt: z.date(),
});

// Field Correction Schema
export const FieldCorrectionSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  jobId: z.string(),
  fieldName: z.string(),
  originalValue: z.string().optional(),
  correctedValue: z.string().optional(),
  originalConfidence: z.string().optional(),
  correctedBy: z.string(),
  correctionType: z.string(),
  notes: z.string().optional(),
  createdAt: z.date(),
});

// Training Export Schema
export const TrainingExportSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  docType: z.string(),
  exportPath: z.string(),
  sampleCount: z.number(),
  correctionCount: z.number(),
  exportedBy: z.string(),
  format: z.string().default('jsonl'),
  createdAt: z.date(),
});

// Integration Schema
export const IntegrationSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  name: z.string(),
  config: z.any(),
  credentials: z.any().optional(),
  active: z.boolean().default(true),
  lastSync: z.date().optional(),
  syncCount: z.number().default(0),
  errorCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// System Config Schema
export const SystemConfigSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  key: z.string(),
  value: z.any(),
  description: z.string().optional(),
  updatedBy: z.string().optional(),
  updatedAt: z.date(),
});

// MongoDB Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  API_KEYS: 'apiKeys',
  JOBS: 'jobs',
  USAGE_LOGS: 'usageLogs',
  QUOTAS: 'quotas',
  WEBHOOKS: 'webhooks',
  WEBHOOK_DELIVERIES: 'webhookDeliveries',
  FIELD_CORRECTIONS: 'fieldCorrections',
  TRAINING_EXPORTS: 'trainingExports',
  INTEGRATIONS: 'integrations',
  SYSTEM_CONFIG: 'systemConfig',
} as const;

// Type exports for TypeScript
export type User = z.infer<typeof UserSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type Job = z.infer<typeof JobSchema>;
export type UsageLog = z.infer<typeof UsageLogSchema>;
export type Quota = z.infer<typeof QuotaSchema>;
export type Webhook = z.infer<typeof WebhookSchema>;
export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;
export type FieldCorrection = z.infer<typeof FieldCorrectionSchema>;
export type TrainingExport = z.infer<typeof TrainingExportSchema>;
export type Integration = z.infer<typeof IntegrationSchema>;
export type SystemConfig = z.infer<typeof SystemConfigSchema>;

// MongoDB Indexes (for future implementation)
export const INDEXES = {
  users: [
    { email: 1 },
    { createdAt: -1 },
  ],
  apiKeys: [
    { userId: 1 },
    { keyHash: 1 },
    { createdAt: -1 },
  ],
  jobs: [
    { userId: 1 },
    { status: 1 },
    { docType: 1 },
    { createdAt: -1 },
    { needsReview: 1 },
  ],
  usageLogs: [
    { userId: 1 },
    { createdAt: -1 },
    { jobId: 1 },
  ],
  webhooks: [
    { userId: 1 },
    { active: 1 },
  ],
  webhookDeliveries: [
    { webhookId: 1 },
    { status: 1 },
    { createdAt: -1 },
  ],
  fieldCorrections: [
    { jobId: 1 },
    { correctedBy: 1 },
    { createdAt: -1 },
  ],
  trainingExports: [
    { docType: 1 },
    { createdAt: -1 },
  ],
  integrations: [
    { userId: 1 },
    { type: 1 },
    { active: 1 },
  ],
  systemConfig: [
    { key: 1 },
  ],
};

// MongoDB Connection Configuration
export const MONGODB_CONFIG = {
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false,
  },
};

console.log('📄 MongoDB Schema definitions loaded (currently disabled)');
console.log('💡 To enable MongoDB: Set DATABASE_ENABLED=true in .env file');
console.log('🔧 Collections:', Object.values(COLLECTIONS).join(', '));
