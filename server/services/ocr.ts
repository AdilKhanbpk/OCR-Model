import { storage } from '../storage';
import { googleVisionService } from './googleVision';
import { documentAIService } from './documentAI';
import { documentClassifierService } from './documentClassifier';
import { fieldExtractionService } from './fieldExtractor';
import { webhookService } from './webhookService';
import { demoDataGenerator } from './demoDataGenerator';
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
  extractedFields?: any;
  docType?: string;
  docTypeConfidence?: number;
  processorType?: string;
  needsReview?: boolean;
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

    console.log(`🔄 [OCR] Processing file: ${file.originalname} (${file.size} bytes) for user: ${userId}`);

    // Get user and check quota (using mock storage)
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    console.log(`👤 [OCR] User: ${user.firstName} ${user.lastName} (${user.plan} plan)`);

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

    // Step 1: Document Classification
    const classificationResult = await documentClassifierService.classifyDocument(
      file.originalname,
      file.mimetype,
      file.size
    );

    // Create job record with classification
    const jobData: InsertJob = {
      userId,
      type: file.mimetype === 'application/pdf' ? 'pdf' : 'image',
      status: 'processing',
      filename: file.originalname,
      mime: file.mimetype,
      size: file.size,
      pages: 1, // Will be updated for PDFs
      docType: classificationResult.docType,
      docTypeConfidence: classificationResult.confidence.toString(),
      languageHints,
      detectHandwriting,
      searchablePdf,
    };

    const job = await storage.createJob(jobData);

    try {
      // Check if we're in demo mode (database disabled)
      const isDemoMode = process.env.DATABASE_ENABLED !== 'true';

      let ocrResult;
      let processorType = 'demo_mode';
      let processorId = '';
      let fieldExtractionResult;

      if (isDemoMode) {
        console.log(`🎭 [DEMO MODE] Generating demo OCR results for ${classificationResult.docType}`);

        // Generate realistic demo data
        const demoResult = demoDataGenerator.generateDemoResult(file.originalname, classificationResult.docType);

        ocrResult = {
          rawText: demoResult.rawText,
          pages: demoResult.structuredData.pages,
          entities: [],
          confidence: demoResult.confidence,
          processorType: 'demo_mode',
          processorId: 'demo-processor',
        };

        fieldExtractionResult = demoResult.extractedFields;
        processorType = 'demo_mode';
        processorId = 'demo-processor';

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, demoResult.processingTime));

      } else {
        // Real processing mode
        console.log(`🔄 [REAL MODE] Processing with actual OCR services`);

        if (documentAIService.hasProcessor(classificationResult.docType)) {
          // Use Document AI for specialized processing
          try {
            const docAIResult = await documentAIService.processDocument(
              file.buffer,
              classificationResult.docType,
              file.mimetype,
              { languageHints, enableLayout: true }
            );
            ocrResult = this.convertDocumentAIToOCRResult(docAIResult);
            processorType = 'document_ai';
            processorId = docAIResult.processorId;
          } catch (error) {
            console.warn('Document AI failed, falling back to Vision API:', error);
            // Fallback to Vision API
            ocrResult = await this.processWithVisionAPI(file, { languageHints, detectHandwriting });
          }
        } else {
          // Use Vision API for generic processing
          ocrResult = await this.processWithVisionAPI(file, { languageHints, detectHandwriting });
        }

        // Step 3: Field Extraction and Normalization
        fieldExtractionResult = await fieldExtractionService.extractFields(
          ocrResult.rawText,
          classificationResult.docType,
          ocrResult.entities, // Document AI entities if available
          ocrResult.pages
        );
      }

      // Step 4: Determine if human review is needed
      const needsReview = fieldExtractionResult.needsReview ||
        classificationResult.confidence < documentClassifierService.getReviewThreshold(classificationResult.docType);

      // Calculate cost estimate (simplified)
      const costEstimate = this.calculateCostEstimate(
        ocrResult.pages?.length || 1,
        processorType,
        classificationResult.docType
      );

      // Update job with results
      const updatedJob = await storage.updateJob(job.id, {
        status: needsReview ? 'needs_review' : 'completed',
        pages: ocrResult?.pages?.length || 1,
        processorType,
        processorId,
        rawText: ocrResult?.rawText || '',
        structuredData: ocrResult,
        extractedFields: fieldExtractionResult,
        confidence: fieldExtractionResult.overallConfidence?.toString() || '0',
        needsReview,
        costEstimate: costEstimate.toString(),
        processingTime: Date.now() - new Date(job.createdAt!).getTime(),
      });

      // Track usage
      const pagesProcessed = ocrResult?.pages?.length || 1;
      await storage.incrementUserUsage(userId, pagesProcessed);

      // Log usage with processor type and cost
      await storage.createUsageLog({
        userId,
        jobId: job.id,
        apiKeyId: options.apiKeyId,
        pages: pagesProcessed,
        bytes: file.size,
        status: needsReview ? 'needs_review' : 'completed',
        processorType,
        costIncurred: costEstimate.toString(),
        ip: options.ip,
        userAgent: options.userAgent,
      });

      // Update API key last used if provided
      if (options.apiKeyId) {
        await storage.updateApiKeyLastUsed(options.apiKeyId);
      }

      // Trigger webhooks for job completion
      const webhookEvent = needsReview ? 'job.needs_review' : 'job.completed';
      webhookService.triggerWebhooks(webhookEvent, updatedJob, {
        extractedFields: fieldExtractionResult.fields,
        docType: classificationResult.docType,
        docTypeConfidence: classificationResult.confidence,
        processorType,
      }).catch(error => {
        console.error('Webhook trigger failed:', error);
        // Don't fail the main process if webhooks fail
      });

      return {
        job: updatedJob,
        rawText: ocrResult?.rawText || '',
        structuredData: ocrResult,
        extractedFields: fieldExtractionResult,
        docType: classificationResult.docType,
        docTypeConfidence: classificationResult.confidence,
        processorType,
        needsReview,
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

  private async processWithVisionAPI(file: Express.Multer.File, options: { languageHints?: string[]; detectHandwriting?: boolean }): Promise<any> {
    if (file.mimetype === 'application/pdf') {
      // For PDF processing, we use demo mode since we don't have GCS setup
      return await googleVisionService.processImage(file.buffer, {
        languageHints: options.languageHints,
        detectHandwriting: options.detectHandwriting,
      });
    } else {
      return await googleVisionService.processImage(file.buffer, {
        languageHints: options.languageHints,
        detectHandwriting: options.detectHandwriting,
      });
    }
  }

  private convertDocumentAIToOCRResult(docAIResult: any): any {
    // Convert Document AI result to match Vision API format for compatibility
    return {
      rawText: docAIResult.rawText,
      pages: docAIResult.pages.map((page: any) => ({
        width: page.dimension.width,
        height: page.dimension.height,
        blocks: page.blocks,
      })),
      entities: docAIResult.entities, // Additional structured data from Document AI
      confidence: docAIResult.confidence,
      processorType: docAIResult.processorType,
      processorId: docAIResult.processorId,
    };
  }

  private calculateCostEstimate(pages: number, processorType: string, docType: string): number {
    // Simplified cost calculation based on Google Cloud pricing
    const costs = {
      vision_api: 0.0015, // $1.50 per 1000 pages
      document_ai: {
        invoice: 0.05, // $50 per 1000 pages for Invoice processor
        receipt: 0.05,
        id: 0.05,
        bank_statement: 0.05,
        form: 0.02, // $20 per 1000 pages for Form processor
        generic: 0.0015, // Same as Vision API
      },
    };

    if (processorType === 'document_ai') {
      const docAICosts = costs.document_ai as any;
      return pages * (docAICosts[docType] || docAICosts.generic);
    }

    return pages * costs.vision_api;
  }

  // Legacy methods for backward compatibility
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
