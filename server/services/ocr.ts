import { storage } from '../storage';
import { googleVisionService } from './googleVision';
import { Job, InsertJob, InsertUsageLog } from '@shared/schema';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

interface ProcessOCROptions {
  userId: string;
  file: Express.Multer.File;
  languageHints?: string[];
  detectHandwriting?: boolean;
  searchablePdf?: boolean;
  apiKeyId?: string;
  ip?: string;
  userAgent?: string;
}

interface ProcessOCRResult {
  job: Job;
  rawText: string;
  structuredData: any;
  searchablePdfUrl?: string;
}

export class OCRService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly planLimits = {
    free: { pages: 50, fileSize: 10 * 1024 * 1024 }, // 10MB
    pro: { pages: 2000, fileSize: 25 * 1024 * 1024 }, // 25MB
    business: { pages: 10000, fileSize: 50 * 1024 * 1024 }, // 50MB
  };

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async processOCR(options: ProcessOCROptions): Promise<ProcessOCRResult> {
    const { userId, file, languageHints = ['en'], detectHandwriting = false, searchablePdf = false } = options;

    // Get user and check quota
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check file size limits
    const limit = this.planLimits[user.plan as keyof typeof this.planLimits] || this.planLimits.free;
    if (file.size > limit.fileSize) {
      throw new Error(`File size exceeds limit for ${user.plan} plan (${limit.fileSize / 1024 / 1024}MB)`);
    }

    // Check monthly quota
    const now = new Date();
    const currentUsage = await storage.getUserUsage(userId, now.getFullYear(), now.getMonth() + 1);
    const pagesUsed = currentUsage?.pagesUsed || 0;
    
    if (pagesUsed >= limit.pages) {
      throw new Error(`Monthly quota exceeded for ${user.plan} plan (${limit.pages} pages)`);
    }

    // Create job record
    const jobData: InsertJob = {
      userId,
      type: file.mimetype === 'application/pdf' ? 'pdf' : 'image',
      status: 'processing',
      filename: file.originalname,
      mime: file.mimetype,
      size: file.size,
      pages: 1, // Will be updated for PDFs
      languageHints,
      detectHandwriting,
      searchablePdf,
    };

    const job = await storage.createJob(jobData);

    try {
      // Process the file
      let result;
      if (file.mimetype === 'application/pdf') {
        result = await this.processPDFFile(file.buffer, { languageHints, detectHandwriting });
      } else {
        result = await this.processImageFile(file.buffer, { languageHints, detectHandwriting });
      }

      // Update job with results
      const updatedJob = await storage.updateJob(job.id, {
        status: 'completed',
        pages: result?.pages?.length || 1,
        rawText: result?.rawText || '',
        structuredData: result,
        confidence: result?.confidence?.toString() || '0',
        processingTime: Date.now() - new Date(job.createdAt!).getTime(),
      });

      // Track usage
      const pagesProcessed = result?.pages?.length || 1;
      await storage.incrementUserUsage(userId, pagesProcessed);
      
      // Log usage
      await storage.createUsageLog({
        userId,
        jobId: job.id,
        apiKeyId: options.apiKeyId,
        pages: pagesProcessed,
        bytes: file.size,
        status: 'completed',
        ip: options.ip,
        userAgent: options.userAgent,
      });

      // Update API key last used if provided
      if (options.apiKeyId) {
        await storage.updateApiKeyLastUsed(options.apiKeyId);
      }

      return {
        job: updatedJob,
        rawText: result?.rawText || '',
        structuredData: result,
        searchablePdfUrl: undefined, // TODO: Implement searchable PDF generation
      };

    } catch (error) {
      // Update job with error
      await storage.updateJob(job.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - new Date(job.createdAt!).getTime(),
      });

      // Still log the attempt
      await storage.createUsageLog({
        userId,
        jobId: job.id,
        apiKeyId: options.apiKeyId,
        pages: 0,
        bytes: file.size,
        status: 'failed',
        ip: options.ip,
        userAgent: options.userAgent,
      });

      throw error;
    }
  }

  private async processImageFile(buffer: Buffer, options: { languageHints?: string[]; detectHandwriting?: boolean }): Promise<any> {
    return await googleVisionService.processImage(buffer, {
      languageHints: options.languageHints,
      detectHandwriting: options.detectHandwriting,
    });
  }

  private async processPDFFile(buffer: Buffer, options: { languageHints?: string[]; detectHandwriting?: boolean }): Promise<any> {
    // For PDF processing, we use demo mode since we don't have GCS setup
    return await googleVisionService.processImage(buffer, {
      languageHints: options.languageHints,
      detectHandwriting: options.detectHandwriting,
    });
  }

  async getUserQuotaStatus(userId: string): Promise<{
    plan: string;
    pagesUsed: number;
    pagesLimit: number;
    requestCount: number;
    percentUsed: number;
    daysRemaining: number;
  }> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const currentUsage = await storage.getUserUsage(userId, now.getFullYear(), now.getMonth() + 1);
    const limit = this.planLimits[user.plan as keyof typeof this.planLimits] || this.planLimits.free;
    
    const pagesUsed = currentUsage?.pagesUsed || 0;
    const requestCount = currentUsage?.requestCount || 0;
    const percentUsed = Math.round((pagesUsed / limit.pages) * 100);
    
    // Calculate days remaining in current month
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = Math.ceil((lastDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      plan: user.plan || 'free',
      pagesUsed,
      pagesLimit: limit.pages,
      requestCount,
      percentUsed,
      daysRemaining,
    };
  }

  generateApiKey(): string {
    return 'ocr_' + crypto.randomBytes(32).toString('hex');
  }

  hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}

export const ocrService = new OCRService();
