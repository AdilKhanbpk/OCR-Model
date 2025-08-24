import { ImageAnnotatorClient } from '@google-cloud/vision';

interface OCROptions {
  languageHints?: string[];
  detectHandwriting?: boolean;
  enableLayout?: boolean;
}

interface OCRResult {
  rawText: string;
  pages: Array<{
    width: number;
    height: number;
    blocks: Array<{
      text: string;
      bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      confidence: number;
    }>;
  }>;
  confidence: number;
}

export class GoogleVisionService {
  private client: ImageAnnotatorClient | null;

  constructor() {
    // Initialize with service account credentials from environment (optional for now)
    try {
      if (process.env.GCP_PROJECT_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.client = new ImageAnnotatorClient({
          projectId: process.env.GCP_PROJECT_ID,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
      } else {
        this.client = null;
        console.log('Google Cloud Vision API not configured - running in demo mode');
      }
    } catch (error) {
      this.client = null;
      console.log('Google Cloud Vision API initialization failed - running in demo mode');
    }
  }

  async processImage(imageBuffer: Buffer, options: OCROptions = {}): Promise<OCRResult> {
    // If Google Vision API is not configured, return demo data
    if (!this.client) {
      return this.generateDemoOCRResult(options.languageHints || ['en']);
    }

    try {
      const request = {
        image: {
          content: imageBuffer.toString('base64'),
        },
        features: [
          {
            type: 'DOCUMENT_TEXT_DETECTION' as const,
          },
        ],
        imageContext: {
          languageHints: options.languageHints || ['en'],
        },
      };

      const [result] = await this.client.annotateImage(request);
      
      if (result.error) {
        throw new Error(`Vision API error: ${result.error.message}`);
      }

      return this.parseVisionResponse(result);
    } catch (error) {
      console.error('Google Vision API error:', error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processPDF(gcsUri: string, options: OCROptions = {}): Promise<OCRResult> {
    // If Google Vision API is not configured, return demo data
    if (!this.client) {
      return this.generateDemoOCRResult(options.languageHints || ['en'], true);
    }

    try {
      const request = {
        requests: [
          {
            inputConfig: {
              gcsSource: {
                uri: gcsUri,
              },
              mimeType: 'application/pdf',
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION' as const,
              },
            ],
            imageContext: {
              languageHints: options.languageHints || ['en'],
            },
            outputConfig: {
              gcsDestination: {
                uri: `${gcsUri}_output/`,
              },
            },
          },
        ],
      };

      const [operation] = await this.client.asyncBatchAnnotateFiles(request);
      const [result] = await operation.promise();

      if (!result.responses || result.responses.length === 0) {
        throw new Error('No response from Vision API');
      }

      return this.parseAsyncVisionResponse(result.responses[0]);
    } catch (error) {
      console.error('Google Vision API PDF error:', error);
      throw new Error(`PDF OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseVisionResponse(response: any): OCRResult {
    const fullTextAnnotation = response.fullTextAnnotation;
    
    if (!fullTextAnnotation) {
      return {
        rawText: '',
        pages: [],
        confidence: 0,
      };
    }

    const rawText = fullTextAnnotation.text || '';
    const pages = fullTextAnnotation.pages?.map((page: any) => ({
      width: page.width || 0,
      height: page.height || 0,
      blocks: page.blocks?.map((block: any) => ({
        text: block.paragraphs?.map((p: any) => 
          p.words?.map((w: any) => 
            w.symbols?.map((s: any) => s.text).join('')
          ).join(' ')
        ).join('\n') || '',
        bbox: this.getBoundingBox(block.boundingBox),
        confidence: block.confidence || 0,
      })) || [],
    })) || [];

    // Calculate average confidence
    const allConfidences = pages.flatMap((page: any) => 
      page.blocks.map((block: any) => block.confidence)
    ).filter((conf: number) => conf > 0);
    
    const confidence = allConfidences.length > 0 
      ? allConfidences.reduce((sum: number, conf: number) => sum + conf, 0) / allConfidences.length 
      : 0;

    return {
      rawText,
      pages,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  private parseAsyncVisionResponse(response: any): OCRResult {
    // Parse the async response similar to sync response
    return this.parseVisionResponse(response);
  }

  private getBoundingBox(boundingBox: any): { x: number; y: number; width: number; height: number } {
    if (!boundingBox?.vertices || boundingBox.vertices.length < 4) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const vertices = boundingBox.vertices;
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

  private generateDemoOCRResult(languageHints: string[], isPdf = false): OCRResult {
    const isUrdu = languageHints.includes('ur');
    const demoText = isUrdu 
      ? "یہ ایک نمونہ OCR نتیجہ ہے۔\nیہ متن صرف ڈیمو کے لیے ہے۔\nبرائے کرم اپنا Google Cloud Vision API کلید شامل کریں۔"
      : "This is a demo OCR result.\nThis text is for demonstration purposes only.\nPlease add your Google Cloud Vision API credentials to process real documents.";

    return {
      rawText: demoText,
      pages: [
        {
          width: 595,
          height: 842,
          blocks: [
            {
              text: demoText,
              bbox: { x: 50, y: 50, width: 495, height: 200 },
              confidence: 0.95,
            },
          ],
        },
      ],
      confidence: 0.95,
    };
  }
}

export const googleVisionService = new GoogleVisionService();
