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
  status: varchar("status").notNull().default("queued"), // queued, processing, completed, failed
  filename: varchar("filename").notNull(),
  originalUrl: varchar("original_url"),
  mime: varchar("mime").notNull(),
  size: integer("size").notNull(),
  pages: integer("pages").default(1),
  languageHints: text("language_hints").array(),
  detectHandwriting: boolean("detect_handwriting").default(false),
  searchablePdf: boolean("searchable_pdf").default(false),
  rawText: text("raw_text"),
  structuredData: jsonb("structured_data"),
  searchablePdfUrl: varchar("searchable_pdf_url"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  processingTime: integer("processing_time_ms"),
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
  createdAt: timestamp("created_at").defaultNow(),
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

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type UsageLog = typeof usageLogs.$inferSelect;
export type Quota = typeof quotas.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
