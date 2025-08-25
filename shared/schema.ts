import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  plan: varchar("plan").default("free"), // free, pro, business
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  role: varchar("role").default("user"), // user, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Keys
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  keyHash: varchar("key_hash").notNull().unique(),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

// OCR Jobs
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // image, pdf
  status: varchar("status").notNull().default("queued"), // queued, processing, completed, failed, needs_review
  filename: varchar("filename").notNull(),
  originalUrl: varchar("original_url"),
  gcsPath: varchar("gcs_path"), // Path to file in Google Cloud Storage
  mime: varchar("mime").notNull(),
  size: integer("size").notNull(),
  pages: integer("pages").default(1),
  docType: varchar("doc_type"), // invoice, receipt, id, bank_statement, business_card, form, generic, unknown
  docTypeConfidence: decimal("doc_type_confidence", { precision: 5, scale: 2 }),
  processorType: varchar("processor_type"), // document_ai, vision_api
  processorId: varchar("processor_id"), // Document AI processor ID used
  languageHints: text("language_hints").array(),
  detectHandwriting: boolean("detect_handwriting").default(false),
  searchablePdf: boolean("searchable_pdf").default(false),
  rawText: text("raw_text"),
  structuredData: jsonb("structured_data"),
  extractedFields: jsonb("extracted_fields"), // Normalized field extraction results
  searchablePdfUrl: varchar("searchable_pdf_url"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  processingTime: integer("processing_time_ms"),
  costEstimate: decimal("cost_estimate", { precision: 10, scale: 4 }), // Cost in USD
  needsReview: boolean("needs_review").default(false),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage tracking
export const usageLogs = pgTable("usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: varchar("job_id").references(() => jobs.id, { onDelete: "set null" }),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
  pages: integer("pages").notNull().default(1),
  bytes: integer("bytes").notNull(),
  status: varchar("status").notNull(),
  processorType: varchar("processor_type"), // document_ai, vision_api
  costIncurred: decimal("cost_incurred", { precision: 10, scale: 4 }), // Actual cost in USD
  ip: varchar("ip"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quota tracking per user per month
export const quotas = pgTable("quotas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  pagesUsed: integer("pages_used").notNull().default(0),
  requestCount: integer("request_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhooks
export const webhooks = pgTable("webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: varchar("url").notNull(),
  secret: varchar("secret").notNull(),
  events: text("events").array().notNull().default(["job.completed"]),
  active: boolean("active").notNull().default(true),
  lastTriggered: timestamp("last_triggered"),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Webhook delivery logs
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookId: varchar("webhook_id").notNull().references(() => webhooks.id, { onDelete: "cascade" }),
  jobId: varchar("job_id").references(() => jobs.id, { onDelete: "set null" }),
  event: varchar("event").notNull(),
  payload: jsonb("payload").notNull(),
  status: varchar("status").notNull(), // pending, delivered, failed
  httpStatus: integer("http_status"),
  responseBody: text("response_body"),
  attempts: integer("attempts").default(1),
  nextRetryAt: timestamp("next_retry_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document field corrections for human-in-the-loop
export const fieldCorrections = pgTable("field_corrections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  fieldName: varchar("field_name").notNull(),
  originalValue: text("original_value"),
  correctedValue: text("corrected_value"),
  originalConfidence: decimal("original_confidence", { precision: 5, scale: 2 }),
  correctedBy: varchar("corrected_by").notNull().references(() => users.id),
  correctionType: varchar("correction_type").notNull(), // manual, auto_suggestion, validation_fix
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training data export logs
export const trainingExports = pgTable("training_exports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  docType: varchar("doc_type").notNull(),
  exportPath: varchar("export_path").notNull(), // GCS path to exported dataset
  sampleCount: integer("sample_count").notNull(),
  correctionCount: integer("correction_count").notNull(),
  exportedBy: varchar("exported_by").notNull().references(() => users.id),
  format: varchar("format").notNull().default("jsonl"), // jsonl, csv, tfrecord
  createdAt: timestamp("created_at").defaultNow(),
});

// Integrations (Google Sheets, QuickBooks, etc.)
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // google_sheets, quickbooks, xero, zapier
  name: varchar("name").notNull(),
  config: jsonb("config").notNull(), // Integration-specific configuration
  credentials: jsonb("credentials"), // Encrypted OAuth tokens, etc.
  active: boolean("active").notNull().default(true),
  lastSync: timestamp("last_sync"),
  syncCount: integer("sync_count").default(0),
  errorCount: integer("error_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System configuration and feature flags
export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  keyHash: true,
  lastUsed: true,
  createdAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUsageLogSchema = createInsertSchema(usageLogs).omit({
  id: true,
  createdAt: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
});

export const insertFieldCorrectionSchema = createInsertSchema(fieldCorrections).omit({
  id: true,
  createdAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type UsageLog = typeof usageLogs.$inferSelect;
export type Quota = typeof quotas.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type FieldCorrection = typeof fieldCorrections.$inferSelect;
export type TrainingExport = typeof trainingExports.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type InsertFieldCorrection = z.infer<typeof insertFieldCorrectionSchema>;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
