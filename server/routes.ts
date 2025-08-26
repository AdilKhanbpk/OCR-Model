import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireAuth, requireAdmin, apiKeyAuth, AuthenticatedRequest } from "./middleware/auth";
import { rateLimit } from "./middleware/rateLimit";
import { ocrService } from "./services/ocr";
import { exportService } from "./services/exportService";
import { insertApiKeySchema, insertWebhookSchema } from "@shared/schema";
import { z } from "zod";

// Make Stripe optional - can work without it for now
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil" as any,
    })
  : null;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'image/tiff',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // OCR API endpoints (with API key auth)
  app.post('/api/v1/ocr', apiKeyAuth, rateLimit, upload.single('file'), async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'File is required' });
      }

      const languageHints = req.body.languageHints?.split(',') || ['en'];
      const detectHandwriting = req.body.detectHandwriting === 'true';
      const searchablePdf = req.body.searchablePdf === 'true';

      const result = await ocrService.processOCR({
        userId: authReq.user.id,
        file,
        languageHints,
        detectHandwriting,
        searchablePdf,
        apiKeyId: authReq.apiKey?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        jobId: result.job.id,
        status: result.job.status,
        rawText: result.rawText,
        structuredData: result.structuredData,
        confidence: result.job.confidence,
        searchablePdfUrl: result.searchablePdfUrl,
      });
    } catch (error) {
      console.error('OCR processing error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'OCR processing failed',
      });
    }
  });

  app.get('/api/v1/jobs/:jobId', apiKeyAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const job = await storage.getJob(req.params.jobId);

      if (!job || job.userId !== authReq.user.id) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.json({
        jobId: job.id,
        status: job.status,
        filename: job.filename,
        pages: job.pages,
        docType: job.docType,
        docTypeConfidence: job.docTypeConfidence,
        processorType: job.processorType,
        rawText: job.rawText,
        structuredData: job.structuredData,
        extractedFields: job.extractedFields,
        confidence: job.confidence,
        needsReview: job.needsReview,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      });
    } catch (error) {
      console.error('Get job error:', error);
      res.status(500).json({ message: 'Failed to fetch job' });
    }
  });

  app.get('/api/v1/usage', apiKeyAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const usage = await ocrService.getUserQuotaStatus(authReq.user.id);
      res.json(usage);
    } catch (error) {
      console.error('Usage fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch usage' });
    }
  });

  // Dashboard API endpoints (with session auth)
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const usage = await ocrService.getUserQuotaStatus(userId);
      const recentJobs = await storage.getUserJobs(userId, 10);
      
      res.json({
        usage,
        recentJobs,
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  app.post('/api/dashboard/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || 'demo-user-1'; // Use demo user in demo mode
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'File is required' });
      }

      const languageHints = req.body.languageHints?.split(',') || ['en'];
      const detectHandwriting = req.body.detectHandwriting === 'true';
      const searchablePdf = req.body.searchablePdf === 'true';

      const result = await ocrService.processOCR({
        userId,
        file,
        languageHints,
        detectHandwriting,
        searchablePdf,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        jobId: result.job.id,
        status: result.job.status,
        rawText: result.rawText,
        structuredData: result.structuredData,
        confidence: result.job.confidence,
        searchablePdfUrl: result.searchablePdfUrl,
      });
    } catch (error) {
      console.error('Dashboard upload error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  });

  // API Key management
  app.get('/api/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const apiKeys = await storage.getUserApiKeys(userId);
      
      // Mask the keys for security
      const maskedKeys = apiKeys.map(key => ({
        ...key,
        keyHash: undefined,
        maskedKey: `ocr_${'*'.repeat(56)}${key.keyHash.slice(-3)}`,
      }));
      
      res.json(maskedKeys);
    } catch (error) {
      console.error('API keys fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch API keys' });
    }
  });

  app.post('/api/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name } = insertApiKeySchema.parse(req.body);
      
      const apiKey = ocrService.generateApiKey();
      const keyHash = ocrService.hashApiKey(apiKey);
      
      const newKey = await storage.createApiKey({
        userId,
        name,
        keyHash,
      });
      
      // Return the plain key only once
      res.json({
        id: newKey.id,
        name: newKey.name,
        key: apiKey, // Only returned once!
        createdAt: newKey.createdAt,
      });
    } catch (error) {
      console.error('API key creation error:', error);
      res.status(500).json({ message: 'Failed to create API key' });
    }
  });

  app.delete('/api/api-keys/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteApiKey(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error('API key deletion error:', error);
      res.status(500).json({ message: 'Failed to delete API key' });
    }
  });

  // Usage logs
  app.get('/api/usage-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logs = await storage.getUserUsageLogs(userId, 100);
      res.json(logs);
    } catch (error) {
      console.error('Usage logs fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch usage logs' });
    }
  });

  // Review queue endpoints
  app.get('/api/jobs/review-queue', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await storage.getJobsByStatus('needs_review');

      // Filter to user's jobs only (unless admin)
      const user = await storage.getUser(userId);
      const filteredJobs = user?.role === 'admin' ? jobs : jobs.filter(job => job.userId === userId);

      res.json(filteredJobs);
    } catch (error) {
      console.error('Review queue fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch review queue' });
    }
  });

  app.post('/api/jobs/:jobId/corrections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { jobId } = req.params;
      const { corrections, notes } = req.body;

      // Verify job ownership
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      const user = await storage.getUser(userId);
      if (job.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to correct this job' });
      }

      // Save corrections
      for (const correction of corrections) {
        await storage.createFieldCorrection({
          jobId,
          fieldName: correction.fieldName,
          originalValue: correction.originalValue,
          correctedValue: correction.correctedValue,
          originalConfidence: correction.originalConfidence?.toString(),
          correctedBy: userId,
          correctionType: correction.correctionType || 'manual',
          notes: notes || undefined,
        });
      }

      // Update job status to completed
      await storage.updateJob(jobId, {
        status: 'completed',
        reviewedBy: userId,
        reviewedAt: new Date(),
        needsReview: false,
      });

      res.json({ message: 'Corrections saved successfully' });
    } catch (error) {
      console.error('Correction save error:', error);
      res.status(500).json({ message: 'Failed to save corrections' });
    }
  });

  app.post('/api/jobs/:jobId/approve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { jobId } = req.params;

      // Verify job ownership
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      const user = await storage.getUser(userId);
      if (job.userId !== userId && user?.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to approve this job' });
      }

      // Update job status to completed without corrections
      await storage.updateJob(jobId, {
        status: 'completed',
        reviewedBy: userId,
        reviewedAt: new Date(),
        needsReview: false,
      });

      res.json({ message: 'Job approved successfully' });
    } catch (error) {
      console.error('Job approval error:', error);
      res.status(500).json({ message: 'Failed to approve job' });
    }
  });

  // Export endpoints
  app.post('/api/export/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { jobIds, format = 'csv', includeRawText = false, includeMetadata = false } = req.body;

      if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({ message: 'Job IDs are required' });
      }

      const result = await exportService.exportJobs(userId, jobIds, {
        format,
        includeRawText,
        includeMetadata,
      });

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Export failed' });
    }
  });

  app.get('/api/export/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await exportService.getExportStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Export stats error:', error);
      res.status(500).json({ message: 'Failed to fetch export stats' });
    }
  });

  app.post('/api/export/training-data', requireAdmin, async (req, res) => {
    try {
      const { docType, includeCorrections = true } = req.body;

      if (!docType) {
        return res.status(400).json({ message: 'Document type is required' });
      }

      const result = await exportService.exportTrainingData(docType, includeCorrections);

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.data);
    } catch (error) {
      console.error('Training data export error:', error);
      res.status(500).json({ message: error instanceof Error ? error.message : 'Export failed' });
    }
  });

  // Webhook management
  app.get('/api/webhooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const webhooks = await storage.getUserWebhooks(userId);
      res.json(webhooks);
    } catch (error) {
      console.error('Webhooks fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch webhooks' });
    }
  });

  app.post('/api/webhooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const webhookData = insertWebhookSchema.parse(req.body);
      
      const webhook = await storage.createWebhook({
        ...webhookData,
        userId,
      });
      
      res.json(webhook);
    } catch (error) {
      console.error('Webhook creation error:', error);
      res.status(500).json({ message: 'Failed to create webhook' });
    }
  });

  app.delete('/api/webhooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteWebhook(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      console.error('Webhook deletion error:', error);
      res.status(500).json({ message: 'Failed to delete webhook' });
    }
  });

  // Stripe billing (only works if Stripe is configured)
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(501).json({ message: 'Stripe billing not configured' });
    }

    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If user already has a subscription, return it
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      }

      if (!user.email) {
        return res.status(400).json({ message: 'User email required' });
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_1234', // Configure in environment
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with Stripe info
      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });

  app.get('/api/billing/portal', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(501).json({ message: 'Stripe billing not configured' });
    }

    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: 'No billing account found' });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/usage`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Billing portal error:', error);
      res.status(500).json({ message: 'Failed to create billing portal session' });
    }
  });

  // Stripe webhooks (only works if Stripe is configured)
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
    if (!stripe) {
      return res.status(501).send('Stripe not configured');
    }

    const sig = req.headers['stripe-signature'];
    
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
      
      // Handle subscription events
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          // Update user plan based on subscription status
          console.log('Subscription event:', event.type);
          break;
        case 'invoice.payment_succeeded':
          console.log('Payment succeeded:', event.data.object.id);
          break;
        case 'invoice.payment_failed':
          console.log('Payment failed:', event.data.object.id);
          break;
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // Admin routes
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
  });

  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getAllUsers(limit, offset);
      res.json(result);
    } catch (error) {
      console.error('Admin users fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/jobs', requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getAllJobs(limit, offset);
      res.json(result);
    } catch (error) {
      console.error('Admin jobs fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch jobs' });
    }
  });

  app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const { plan } = req.body;
      if (!['free', 'pro', 'business'].includes(plan)) {
        return res.status(400).json({ message: 'Invalid plan' });
      }
      
      const user = await storage.updateUserPlan(req.params.id, plan);
      res.json(user);
    } catch (error) {
      console.error('Admin user update error:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
