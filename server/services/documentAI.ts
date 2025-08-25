import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

interface DocumentAIOptions {
  languageHints?: string[];
  enableLayout?: boolean;
}

interface ProcessorConfig {
  projectId: string;
  location: string;
  processorId: string;
  processorVersion?: string;
}

interface DocumentAIResult {
  rawText: string;
  entities: Array<{
    type: string;
    mentionText: string;
    confidence: number;
    normalizedValue?: any;
    pageAnchor?: {
      pageRefs: Array<{
        page: number;
        boundingPoly?: {
          vertices: Array<{ x: number; y: number }>;
        };
      }>;
    };
  }>;
  pages: Array<{
    pageNumber: number;
    dimension: { width: number; height: number };
    blocks: Array<{
      text: string;
      boundingBox: { x: number; y: number; width: number; height: number };
      confidence: number;
    }>;
  }>;
  confidence: number;
  processorType: string;
  processorId: string;
}

export class DocumentAIService {
  private client: DocumentProcessorServiceClient | null;
  private processors: Map<string, ProcessorConfig>;

  constructor() {
    this.processors = new Map();
    
    try {
      if (process.env.GCP_PROJECT_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.client = new DocumentProcessorServiceClient({
          projectId: process.env.GCP_PROJECT_ID,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
        
        // Initialize processor configurations
        this.initializeProcessors();
      } else {
        this.client = null;
        console.log('Google Document AI not configured - running in demo mode');
      }
    } catch (error) {
      this.client = null;
      console.log('Google Document AI initialization failed - running in demo mode');
    }
  }

  private initializeProcessors() {
    const projectId = process.env.GCP_PROJECT_ID!;
    const location = process.env.GCP_LOCATION || 'us';

    // Configure available processors
    if (process.env.INVOICE_PROCESSOR_ID) {
      this.processors.set('invoice', {
        projectId,
        location,
        processorId: process.env.INVOICE_PROCESSOR_ID,
      });
    }

    if (process.env.ID_PROCESSOR_ID) {
      this.processors.set('id', {
        projectId,
        location,
        processorId: process.env.ID_PROCESSOR_ID,
      });
    }

    if (process.env.BANK_STATEMENT_PROCESSOR_ID) {
      this.processors.set('bank_statement', {
        projectId,
        location,
        processorId: process.env.BANK_STATEMENT_PROCESSOR_ID,
      });
    }

    if (process.env.RECEIPT_PROCESSOR_ID) {
      this.processors.set('receipt', {
        projectId,
        location,
        processorId: process.env.RECEIPT_PROCESSOR_ID,
      });
    }

    if (process.env.FORM_PROCESSOR_ID) {
      this.processors.set('form', {
        projectId,
        location,
        processorId: process.env.FORM_PROCESSOR_ID,
      });
    }
  }

  async processDocument(
    documentBuffer: Buffer,
    docType: string,
    mimeType: string,
    options: DocumentAIOptions = {}
  ): Promise<DocumentAIResult> {
    // If Document AI is not configured or processor not available, return demo data
    if (!this.client || !this.processors.has(docType)) {
      return this.generateDemoDocumentAIResult(docType);
    }

    try {
      const processorConfig = this.processors.get(docType)!;
      const name = `projects/${processorConfig.projectId}/locations/${processorConfig.location}/processors/${processorConfig.processorId}`;

      const request = {
        name,
        rawDocument: {
          content: documentBuffer.toString('base64'),
          mimeType,
        },
      };

      const [result] = await this.client.processDocument(request);
      
      if (!result.document) {
        throw new Error('No document returned from Document AI');
      }

      return this.parseDocumentAIResponse(result.document, processorConfig);
    } catch (error) {
      console.error('Document AI processing error:', error);
      throw new Error(`Document AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseDocumentAIResponse(document: any, processorConfig: ProcessorConfig): DocumentAIResult {
    const rawText = document.text || '';
    
    // Parse entities (structured fields)
    const entities = (document.entities || []).map((entity: any) => ({
      type: entity.type || 'unknown',
      mentionText: entity.mentionText || '',
      confidence: entity.confidence || 0,
      normalizedValue: entity.normalizedValue,
      pageAnchor: entity.pageAnchor,
    }));

    // Parse pages and blocks
    const pages = (document.pages || []).map((page: any, index: number) => ({
      pageNumber: index + 1,
      dimension: {
        width: page.dimension?.width || 0,
        height: page.dimension?.height || 0,
      },
      blocks: (page.blocks || []).map((block: any) => ({
        text: this.extractTextFromLayout(block, document.text),
        boundingBox: this.getBoundingBoxFromLayout(block),
        confidence: block.confidence || 0,
      })),
    }));

    // Calculate average confidence
    const allConfidences = entities
      .map((e: any) => e.confidence)
      .concat(pages.flatMap((p: any) => p.blocks.map((b: any) => b.confidence)))
      .filter((conf: number) => conf > 0);
    
    const confidence = allConfidences.length > 0 
      ? allConfidences.reduce((sum: number, conf: number) => sum + conf, 0) / allConfidences.length 
      : 0;

    return {
      rawText,
      entities,
      pages,
      confidence: Math.round(confidence * 100) / 100,
      processorType: 'document_ai',
      processorId: processorConfig.processorId,
    };
  }

  private extractTextFromLayout(layout: any, fullText: string): string {
    if (!layout.textAnchor?.textSegments) {
      return '';
    }

    return layout.textAnchor.textSegments
      .map((segment: any) => {
        const startIndex = parseInt(segment.startIndex) || 0;
        const endIndex = parseInt(segment.endIndex) || fullText.length;
        return fullText.substring(startIndex, endIndex);
      })
      .join('');
  }

  private getBoundingBoxFromLayout(layout: any): { x: number; y: number; width: number; height: number } {
    if (!layout.boundingPoly?.vertices || layout.boundingPoly.vertices.length < 4) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const vertices = layout.boundingPoly.vertices;
    const xs = vertices.map((v: any) => v.x || 0);
    const ys = vertices.map((v: any) => v.y || 0);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private generateDemoDocumentAIResult(docType: string): DocumentAIResult {
    const demoEntities = this.getDemoEntitiesForDocType(docType);
    
    return {
      rawText: `Demo Document AI result for ${docType}.\nThis is demonstration data.\nPlease configure Document AI processors for real processing.`,
      entities: demoEntities,
      pages: [
        {
          pageNumber: 1,
          dimension: { width: 595, height: 842 },
          blocks: [
            {
              text: `Demo ${docType} document`,
              boundingBox: { x: 50, y: 50, width: 495, height: 100 },
              confidence: 0.95,
            },
          ],
        },
      ],
      confidence: 0.95,
      processorType: 'document_ai_demo',
      processorId: `demo_${docType}_processor`,
    };
  }

  private getDemoEntitiesForDocType(docType: string) {
    const demoEntities: any = {
      invoice: [
        { type: 'invoice_number', mentionText: 'INV-2024-001', confidence: 0.98 },
        { type: 'total_amount', mentionText: '$1,234.56', confidence: 0.95, normalizedValue: { amount: 1234.56, currency: 'USD' } },
        { type: 'invoice_date', mentionText: '2024-08-25', confidence: 0.92 },
        { type: 'vendor_name', mentionText: 'Demo Vendor Inc.', confidence: 0.90 },
      ],
      receipt: [
        { type: 'merchant_name', mentionText: 'Demo Store', confidence: 0.95 },
        { type: 'total_amount', mentionText: '$45.67', confidence: 0.98, normalizedValue: { amount: 45.67, currency: 'USD' } },
        { type: 'receipt_date', mentionText: '2024-08-25', confidence: 0.93 },
      ],
      id: [
        { type: 'full_name', mentionText: 'John Demo Smith', confidence: 0.97 },
        { type: 'id_number', mentionText: 'ID123456789', confidence: 0.95 },
        { type: 'date_of_birth', mentionText: '1990-01-01', confidence: 0.92 },
        { type: 'expiry_date', mentionText: '2030-01-01', confidence: 0.90 },
      ],
      bank_statement: [
        { type: 'account_number', mentionText: '****1234', confidence: 0.95 },
        { type: 'statement_date', mentionText: '2024-08-25', confidence: 0.93 },
        { type: 'balance', mentionText: '$5,678.90', confidence: 0.96, normalizedValue: { amount: 5678.90, currency: 'USD' } },
      ],
    };

    return demoEntities[docType] || [
      { type: 'text_content', mentionText: 'Demo content', confidence: 0.90 },
    ];
  }

  getAvailableProcessors(): string[] {
    return Array.from(this.processors.keys());
  }

  hasProcessor(docType: string): boolean {
    return this.processors.has(docType);
  }
}

export const documentAIService = new DocumentAIService();
