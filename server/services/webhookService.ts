import crypto from 'crypto';
import { storage } from '../storage';
import { Webhook, Job } from '@shared/schema';

interface WebhookPayload {
  event: string;
  jobId: string;
  userId: string;
  timestamp: string;
  data: any;
}

interface DeliveryResult {
  success: boolean;
  httpStatus?: number;
  responseBody?: string;
  error?: string;
}

export class WebhookService {
  private readonly maxRetries = 5;
  private readonly retryDelays = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m

  async triggerWebhooks(event: string, job: Job, additionalData?: any): Promise<void> {
    try {
      // Get all active webhooks for the user that listen to this event
      const webhooks = await storage.getUserWebhooks(job.userId);
      const relevantWebhooks = webhooks.filter(
        webhook => webhook.active && webhook.events.includes(event)
      );

      if (relevantWebhooks.length === 0) {
        console.log(`No webhooks configured for event ${event} and user ${job.userId}`);
        return;
      }

      // Create payload
      const payload: WebhookPayload = {
        event,
        jobId: job.id,
        userId: job.userId,
        timestamp: new Date().toISOString(),
        data: {
          job: this.sanitizeJobForWebhook(job),
          ...additionalData,
        },
      };

      // Trigger webhooks asynchronously
      const deliveryPromises = relevantWebhooks.map(webhook =>
        this.deliverWebhook(webhook, payload)
      );

      // Wait for all deliveries to complete (but don't block the main process)
      Promise.allSettled(deliveryPromises).then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`Webhook delivery summary for event ${event}: ${successful} successful, ${failed} failed`);
      });

    } catch (error) {
      console.error('Error triggering webhooks:', error);
    }
  }

  private async deliverWebhook(webhook: Webhook, payload: WebhookPayload): Promise<void> {
    // Create delivery record
    const deliveryId = await storage.createWebhookDelivery({
      webhookId: webhook.id,
      jobId: payload.jobId,
      event: payload.event,
      payload: payload as any,
      status: 'pending',
      attempts: 1,
    });

    try {
      const result = await this.attemptDelivery(webhook, payload);
      
      if (result.success) {
        // Mark as delivered
        await storage.updateWebhookDelivery(deliveryId, {
          status: 'delivered',
          httpStatus: result.httpStatus,
          responseBody: result.responseBody,
          deliveredAt: new Date(),
        });

        // Update webhook success count
        await storage.updateWebhookStats(webhook.id, { 
          successCount: webhook.successCount + 1,
          lastTriggered: new Date(),
        });

      } else {
        // Schedule retry
        await this.scheduleRetry(deliveryId, webhook, payload, 1, result);
      }

    } catch (error) {
      console.error(`Webhook delivery failed for ${webhook.url}:`, error);
      await this.scheduleRetry(deliveryId, webhook, payload, 1, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async attemptDelivery(webhook: Webhook, payload: WebhookPayload): Promise<DeliveryResult> {
    const signature = this.generateSignature(JSON.stringify(payload), webhook.secret);
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
          'User-Agent': 'OCR-Service-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseBody = await response.text();

      return {
        success: response.ok,
        httpStatus: response.status,
        responseBody: responseBody.substring(0, 1000), // Limit response body size
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async scheduleRetry(
    deliveryId: string,
    webhook: Webhook,
    payload: WebhookPayload,
    attemptNumber: number,
    lastResult: DeliveryResult
  ): Promise<void> {
    if (attemptNumber >= this.maxRetries) {
      // Max retries reached, mark as failed
      await storage.updateWebhookDelivery(deliveryId, {
        status: 'failed',
        httpStatus: lastResult.httpStatus,
        responseBody: lastResult.responseBody || lastResult.error,
        attempts: attemptNumber,
      });

      // Update webhook failure count
      await storage.updateWebhookStats(webhook.id, { 
        failureCount: webhook.failureCount + 1,
      });

      console.error(`Webhook delivery permanently failed after ${attemptNumber} attempts for ${webhook.url}`);
      return;
    }

    // Calculate next retry time with exponential backoff
    const delay = this.retryDelays[attemptNumber - 1] || this.retryDelays[this.retryDelays.length - 1];
    const nextRetryAt = new Date(Date.now() + delay);

    // Update delivery record with retry info
    await storage.updateWebhookDelivery(deliveryId, {
      attempts: attemptNumber,
      nextRetryAt,
      responseBody: lastResult.responseBody || lastResult.error,
      httpStatus: lastResult.httpStatus,
    });

    // Schedule the retry (in a real production system, you'd use a job queue like Bull/Agenda)
    setTimeout(async () => {
      try {
        const result = await this.attemptDelivery(webhook, payload);
        
        if (result.success) {
          await storage.updateWebhookDelivery(deliveryId, {
            status: 'delivered',
            httpStatus: result.httpStatus,
            responseBody: result.responseBody,
            deliveredAt: new Date(),
            attempts: attemptNumber + 1,
          });

          await storage.updateWebhookStats(webhook.id, { 
            successCount: webhook.successCount + 1,
            lastTriggered: new Date(),
          });

        } else {
          await this.scheduleRetry(deliveryId, webhook, payload, attemptNumber + 1, result);
        }

      } catch (error) {
        console.error(`Webhook retry ${attemptNumber + 1} failed:`, error);
        await this.scheduleRetry(deliveryId, webhook, payload, attemptNumber + 1, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, delay);
  }

  private generateSignature(payload: string, secret: string): string {
    return 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
  }

  public verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  private sanitizeJobForWebhook(job: Job): any {
    // Remove sensitive or unnecessary fields from job data
    const sanitized = { ...job };
    
    // Remove large text content to keep webhook payload manageable
    if (sanitized.rawText && sanitized.rawText.length > 1000) {
      sanitized.rawText = sanitized.rawText.substring(0, 1000) + '... (truncated)';
    }

    return sanitized;
  }

  // Test webhook endpoint
  async testWebhook(webhookId: string, userId: string): Promise<DeliveryResult> {
    const webhook = await storage.getWebhook(webhookId);
    if (!webhook || webhook.userId !== userId) {
      throw new Error('Webhook not found');
    }

    const testPayload: WebhookPayload = {
      event: 'webhook.test',
      jobId: 'test-job-id',
      userId,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhook: {
          id: webhook.id,
          url: webhook.url,
        },
      },
    };

    return await this.attemptDelivery(webhook, testPayload);
  }

  // Get webhook delivery statistics
  async getWebhookStats(webhookId: string, userId: string): Promise<any> {
    const webhook = await storage.getWebhook(webhookId);
    if (!webhook || webhook.userId !== userId) {
      throw new Error('Webhook not found');
    }

    const recentDeliveries = await storage.getWebhookDeliveries(webhookId, 50);
    
    const stats = {
      totalDeliveries: recentDeliveries.length,
      successfulDeliveries: recentDeliveries.filter(d => d.status === 'delivered').length,
      failedDeliveries: recentDeliveries.filter(d => d.status === 'failed').length,
      pendingDeliveries: recentDeliveries.filter(d => d.status === 'pending').length,
      lastDelivery: recentDeliveries[0]?.createdAt,
      successRate: 0,
    };

    if (stats.totalDeliveries > 0) {
      stats.successRate = Math.round((stats.successfulDeliveries / stats.totalDeliveries) * 100);
    }

    return {
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        successCount: webhook.successCount,
        failureCount: webhook.failureCount,
        lastTriggered: webhook.lastTriggered,
      },
      stats,
      recentDeliveries: recentDeliveries.slice(0, 10), // Last 10 deliveries
    };
  }
}

export const webhookService = new WebhookService();
