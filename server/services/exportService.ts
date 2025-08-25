import { Job } from '@shared/schema';
import { storage } from '../storage';

interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeRawText?: boolean;
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  docTypes?: string[];
}

interface ExportResult {
  data: string | Buffer;
  filename: string;
  mimeType: string;
}

export class ExportService {
  async exportJobs(userId: string, jobIds: string[], options: ExportOptions): Promise<ExportResult> {
    // Fetch jobs
    const jobs = await Promise.all(
      jobIds.map(id => storage.getJob(id))
    );

    // Filter out null jobs and verify ownership
    const validJobs = jobs.filter((job): job is Job => {
      return job !== undefined && job.userId === userId;
    });

    if (validJobs.length === 0) {
      throw new Error('No valid jobs found for export');
    }

    // Apply filters
    let filteredJobs = validJobs;

    if (options.dateRange) {
      filteredJobs = filteredJobs.filter(job => {
        const jobDate = new Date(job.createdAt!);
        return jobDate >= options.dateRange!.start && jobDate <= options.dateRange!.end;
      });
    }

    if (options.docTypes && options.docTypes.length > 0) {
      filteredJobs = filteredJobs.filter(job => 
        job.docType && options.docTypes!.includes(job.docType)
      );
    }

    // Generate export based on format
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(filteredJobs, options);
      case 'csv':
        return this.exportAsCSV(filteredJobs, options);
      case 'xlsx':
        return this.exportAsExcel(filteredJobs, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private exportAsJSON(jobs: Job[], options: ExportOptions): ExportResult {
    const exportData = jobs.map(job => this.transformJobForExport(job, options));
    
    const data = JSON.stringify(exportData, null, 2);
    const timestamp = new Date().toISOString().split('T')[0];
    
    return {
      data,
      filename: `ocr-export-${timestamp}.json`,
      mimeType: 'application/json',
    };
  }

  private exportAsCSV(jobs: Job[], options: ExportOptions): ExportResult {
    if (jobs.length === 0) {
      throw new Error('No jobs to export');
    }

    // Determine columns based on document types
    const allFields = new Set<string>();
    const baseColumns = ['jobId', 'filename', 'docType', 'status', 'confidence', 'createdAt'];
    
    jobs.forEach(job => {
      if (job.extractedFields && typeof job.extractedFields === 'object') {
        const fields = (job.extractedFields as any).fields || [];
        fields.forEach((field: any) => {
          allFields.add(field.name);
        });
      }
    });

    const columns = [...baseColumns, ...Array.from(allFields).sort()];
    
    if (options.includeRawText) {
      columns.push('rawText');
    }

    // Generate CSV header
    const csvRows = [columns.join(',')];

    // Generate CSV data rows
    jobs.forEach(job => {
      const row: string[] = [];
      
      // Base columns
      row.push(this.escapeCsvValue(job.id));
      row.push(this.escapeCsvValue(job.filename));
      row.push(this.escapeCsvValue(job.docType || ''));
      row.push(this.escapeCsvValue(job.status));
      row.push(this.escapeCsvValue(job.confidence || ''));
      row.push(this.escapeCsvValue(job.createdAt?.toISOString() || ''));

      // Field columns
      const extractedFields = this.getExtractedFieldsMap(job);
      allFields.forEach(fieldName => {
        const fieldValue = extractedFields[fieldName] || '';
        row.push(this.escapeCsvValue(fieldValue));
      });

      // Raw text if requested
      if (options.includeRawText) {
        row.push(this.escapeCsvValue(job.rawText || ''));
      }

      csvRows.push(row.join(','));
    });

    const data = csvRows.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];

    return {
      data,
      filename: `ocr-export-${timestamp}.csv`,
      mimeType: 'text/csv',
    };
  }

  private exportAsExcel(jobs: Job[], options: ExportOptions): ExportResult {
    // For now, return CSV format with Excel MIME type
    // In a full implementation, you'd use a library like 'exceljs'
    const csvResult = this.exportAsCSV(jobs, options);
    
    return {
      data: csvResult.data,
      filename: csvResult.filename.replace('.csv', '.xlsx'),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private transformJobForExport(job: Job, options: ExportOptions): any {
    const exportJob: any = {
      jobId: job.id,
      filename: job.filename,
      docType: job.docType,
      docTypeConfidence: job.docTypeConfidence,
      status: job.status,
      pages: job.pages,
      processorType: job.processorType,
      confidence: job.confidence,
      needsReview: job.needsReview,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };

    // Add extracted fields
    if (job.extractedFields) {
      exportJob.extractedFields = job.extractedFields;
    }

    // Add raw text if requested
    if (options.includeRawText && job.rawText) {
      exportJob.rawText = job.rawText;
    }

    // Add metadata if requested
    if (options.includeMetadata) {
      exportJob.metadata = {
        size: job.size,
        mime: job.mime,
        languageHints: job.languageHints,
        detectHandwriting: job.detectHandwriting,
        processingTime: job.processingTime,
        costEstimate: job.costEstimate,
      };
    }

    return exportJob;
  }

  private getExtractedFieldsMap(job: Job): Record<string, string> {
    const fieldsMap: Record<string, string> = {};
    
    if (job.extractedFields && typeof job.extractedFields === 'object') {
      const fields = (job.extractedFields as any).fields || [];
      fields.forEach((field: any) => {
        if (field.name && field.value !== undefined) {
          // Use normalized value if available, otherwise use raw value
          let value = field.value;
          if (field.normalized) {
            if (typeof field.normalized === 'object') {
              value = JSON.stringify(field.normalized);
            } else {
              value = field.normalized.toString();
            }
          }
          fieldsMap[field.name] = value.toString();
        }
      });
    }

    return fieldsMap;
  }

  private escapeCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = value.toString();
    
    // If the value contains comma, newline, or quote, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  // Generate export for specific document type with template
  async exportByDocumentType(userId: string, docType: string, options: ExportOptions): Promise<ExportResult> {
    // Get all jobs of this document type for the user
    const allJobs = await storage.getUserJobs(userId, 1000); // Get a large number
    const filteredJobs = allJobs.filter(job => job.docType === docType && job.status === 'completed');

    if (filteredJobs.length === 0) {
      throw new Error(`No completed ${docType} jobs found`);
    }

    return this.exportJobs(userId, filteredJobs.map(j => j.id), options);
  }

  // Generate training dataset export
  async exportTrainingData(docType: string, includeCorrections = true): Promise<ExportResult> {
    // Get all completed jobs of this type
    const allJobs = await storage.getJobsByStatus('completed');
    const docTypeJobs = allJobs.filter(job => job.docType === docType);

    const trainingData = [];

    for (const job of docTypeJobs) {
      const trainingExample: any = {
        id: job.id,
        filename: job.filename,
        docType: job.docType,
        rawText: job.rawText,
        originalExtraction: job.extractedFields,
      };

      // Include corrections if available and requested
      if (includeCorrections) {
        const corrections = await storage.getJobCorrections(job.id);
        if (corrections.length > 0) {
          trainingExample.corrections = corrections.map(c => ({
            fieldName: c.fieldName,
            originalValue: c.originalValue,
            correctedValue: c.correctedValue,
            correctionType: c.correctionType,
          }));
        }
      }

      trainingData.push(trainingExample);
    }

    const data = trainingData.map(example => JSON.stringify(example)).join('\n');
    const timestamp = new Date().toISOString().split('T')[0];

    return {
      data,
      filename: `training-data-${docType}-${timestamp}.jsonl`,
      mimeType: 'application/jsonl',
    };
  }

  // Get export statistics
  async getExportStats(userId: string): Promise<any> {
    const jobs = await storage.getUserJobs(userId, 1000);
    
    const stats = {
      totalJobs: jobs.length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      jobsByDocType: {} as Record<string, number>,
      jobsByMonth: {} as Record<string, number>,
      averageConfidence: 0,
    };

    // Calculate stats
    let totalConfidence = 0;
    let confidenceCount = 0;

    jobs.forEach(job => {
      // Doc type stats
      if (job.docType) {
        stats.jobsByDocType[job.docType] = (stats.jobsByDocType[job.docType] || 0) + 1;
      }

      // Monthly stats
      if (job.createdAt) {
        const monthKey = job.createdAt.toISOString().substring(0, 7); // YYYY-MM
        stats.jobsByMonth[monthKey] = (stats.jobsByMonth[monthKey] || 0) + 1;
      }

      // Confidence stats
      if (job.confidence) {
        totalConfidence += parseFloat(job.confidence);
        confidenceCount++;
      }
    });

    if (confidenceCount > 0) {
      stats.averageConfidence = Math.round((totalConfidence / confidenceCount) * 100) / 100;
    }

    return stats;
  }
}

export const exportService = new ExportService();
