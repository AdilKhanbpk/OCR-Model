import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  stripeCustomerId: { type: String, default: null },
  googleId: { type: String, sparse: true }, // For Google OAuth
  avatar: { type: String, default: null },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// API Key Schema
const apiKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  keyHash: { type: String, required: true, unique: true },
  lastUsed: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Job Schema
const jobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'needs_review'], 
    default: 'pending' 
  },
  filename: { type: String, required: true },
  originalUrl: { type: String },
  gcsPath: { type: String },
  mime: { type: String, required: true },
  size: { type: Number, required: true },
  pages: { type: Number, default: 1 },
  docType: { type: String },
  docTypeConfidence: { type: Number },
  processorType: { type: String },
  processorId: { type: String },
  languageHints: [{ type: String }],
  detectHandwriting: { type: Boolean, default: false },
  searchablePdf: { type: Boolean, default: false },
  rawText: { type: String },
  structuredData: { type: mongoose.Schema.Types.Mixed },
  extractedFields: { type: mongoose.Schema.Types.Mixed },
  searchablePdfUrl: { type: String },
  confidence: { type: Number },
  processingTime: { type: Number },
  costEstimate: { type: String },
  needsReview: { type: Boolean, default: false },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  error: { type: String },
}, {
  timestamps: true,
});

// Usage Log Schema
const usageLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey' },
  pages: { type: Number, required: true },
  bytes: { type: Number, required: true },
  status: { type: String, required: true },
  processorType: { type: String },
  costIncurred: { type: String },
  ip: { type: String },
  userAgent: { type: String },
}, {
  timestamps: true,
});

// Quota Schema
const quotaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  pages: { type: Number, required: true },
  pagesUsed: { type: Number, default: 0 },
  resetDate: { type: Date, required: true },
}, {
  timestamps: true,
});

// Webhook Schema
const webhookSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  secret: { type: String, required: true },
  events: [{ type: String }],
  active: { type: Boolean, default: true },
  lastTriggered: { type: Date },
  successCount: { type: Number, default: 0 },
  failureCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Webhook Delivery Schema
const webhookDeliverySchema = new mongoose.Schema({
  webhookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Webhook', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  event: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'delivered', 'failed'], default: 'pending' },
  httpStatus: { type: Number },
  responseBody: { type: String },
  attempts: { type: Number, default: 1 },
  nextRetryAt: { type: Date },
  deliveredAt: { type: Date },
}, {
  timestamps: true,
});

// Field Correction Schema
const fieldCorrectionSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  fieldName: { type: String, required: true },
  originalValue: { type: String },
  correctedValue: { type: String },
  originalConfidence: { type: Number },
  correctedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  correctionType: { type: String, required: true },
  notes: { type: String },
}, {
  timestamps: true,
});

// Training Export Schema
const trainingExportSchema = new mongoose.Schema({
  docType: { type: String, required: true },
  exportPath: { type: String, required: true },
  sampleCount: { type: Number, required: true },
  correctionCount: { type: Number, required: true },
  exportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  format: { type: String, default: 'jsonl' },
}, {
  timestamps: true,
});

// Integration Schema
const integrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  config: { type: mongoose.Schema.Types.Mixed },
  credentials: { type: mongoose.Schema.Types.Mixed },
  active: { type: Boolean, default: true },
  lastSync: { type: Date },
  syncCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// System Config Schema
const systemConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
  description: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });
apiKeySchema.index({ userId: 1 });
apiKeySchema.index({ keyHash: 1 });
jobSchema.index({ userId: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ docType: 1 });
jobSchema.index({ needsReview: 1 });
usageLogSchema.index({ userId: 1 });
usageLogSchema.index({ createdAt: -1 });
webhookSchema.index({ userId: 1 });
webhookDeliverySchema.index({ webhookId: 1 });
fieldCorrectionSchema.index({ jobId: 1 });

// Export models
export const User = mongoose.model('User', userSchema);
export const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export const Job = mongoose.model('Job', jobSchema);
export const UsageLog = mongoose.model('UsageLog', usageLogSchema);
export const Quota = mongoose.model('Quota', quotaSchema);
export const Webhook = mongoose.model('Webhook', webhookSchema);
export const WebhookDelivery = mongoose.model('WebhookDelivery', webhookDeliverySchema);
export const FieldCorrection = mongoose.model('FieldCorrection', fieldCorrectionSchema);
export const TrainingExport = mongoose.model('TrainingExport', trainingExportSchema);
export const Integration = mongoose.model('Integration', integrationSchema);
export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

// Database connection
export async function connectDatabase() {
  try {
    const mongoUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/ocr_service';
    
    await mongoose.connect(mongoUrl, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
    });

    console.log('✅ MongoDB connected successfully');
    
    // Create default admin user if none exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const defaultAdmin = new User({
        email: 'admin@ocrservice.com',
        firstName: 'Admin',
        lastName: 'User',
        plan: 'business',
        role: 'admin',
      });
      await defaultAdmin.save();
      console.log('👤 Default admin user created: admin@ocrservice.com');
    }

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ MongoDB disconnect failed:', error);
  }
}
