import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

interface OCRSpaceOptions {
  language?: string;
  isOverlayRequired?: boolean;
  filetype?: string;
  detectOrientation?: boolean;
  isCreateSearchablePdf?: boolean;
  isSearchablePdfHideTextLayer?: boolean;
  scale?: boolean;
  isTable?: boolean;
  ocrEngine?: 1 | 2;
}

interface OCRSpaceResult {
  ParsedResults: Array<{
    TextOverlay?: {
      Lines: Array<{
        Words: Array<{
          WordText: string;
          Left: number;
          Top: number;
          Height: number;
          Width: number;
        }>;
      }>;
    };
    FileParseExitCode: number;
    ParsedText: string;
    ErrorMessage?: string;
    ErrorDetails?: string;
  }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string;
  ErrorDetails?: string;
  SearchablePDFURL?: string;
  ProcessingTimeInMilliseconds: string;
}

export class OCRSpaceService {
  private readonly apiKey: string;
  private readonly postEndpoint = 'https://api.ocr.space/parse/image';
  private readonly getEndpoint = 'https://api.ocr.space/parse/imageurl';

  private readonly supportedLanguages = {
    'ara': 'Arabic', 'bul': 'Bulgarian', 'chs': 'Chinese Simplified',
    'cht': 'Chinese Traditional', 'hrv': 'Croatian', 'cze': 'Czech',
    'dan': 'Danish', 'dut': 'Dutch', 'eng': 'English', 'fin': 'Finnish',
    'fre': 'French', 'ger': 'German', 'gre': 'Greek', 'hun': 'Hungarian',
    'kor': 'Korean', 'ita': 'Italian', 'jpn': 'Japanese', 'pol': 'Polish',
    'por': 'Portuguese', 'rus': 'Russian', 'slv': 'Slovenian',
    'spa': 'Spanish', 'swe': 'Swedish', 'tha': 'Thai', 'tur': 'Turkish',
    'ukr': 'Ukrainian', 'vnm': 'Vietnamese', 'auto': 'Auto-detect (Engine 2 only)'
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OCR_SPACE_API_KEY || 'helloworld';
    if (this.apiKey === 'helloworld') {
      console.warn('Using demo API key. Get your free key at https://ocr.space/ocrapi');
    }
  }

  async processFromUrl(url: string, options: OCRSpaceOptions = {}): Promise<OCRSpaceResult> {
    const params = this.buildParams(options);
    params.url = url;

    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${this.getEndpoint}?${queryString}`, {
        method: 'GET',
        timeout: 60000,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as OCRSpaceResult;
      return this.validateResponse(result);
    } catch (error) {
      throw new Error(`OCR from URL failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processFromFile(filePath: string, options: OCRSpaceOptions = {}): Promise<OCRSpaceResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const params = this.buildParams(options);
    const formData = new FormData();

    // Add parameters to form data
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Add file
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);
    const contentType = this.getContentType(path.extname(filePath).toLowerCase());
    
    formData.append('file', fileStream, {
      filename: fileName,
      contentType: contentType,
    });

    try {
      const response = await fetch(this.postEndpoint, {
        method: 'POST',
        body: formData,
        timeout: 120000, // 2 minutes for file uploads
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as OCRSpaceResult;
      return this.validateResponse(result);
    } catch (error) {
      throw new Error(`OCR from file failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processFromBuffer(buffer: Buffer, filename: string, options: OCRSpaceOptions = {}): Promise<OCRSpaceResult> {
    const params = this.buildParams(options);
    const formData = new FormData();

    // Add parameters to form data
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Add buffer as file
    const contentType = this.getContentType(path.extname(filename).toLowerCase());
    formData.append('file', buffer, {
      filename: filename,
      contentType: contentType,
    });

    try {
      const response = await fetch(this.postEndpoint, {
        method: 'POST',
        body: formData,
        timeout: 120000,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as OCRSpaceResult;
      return this.validateResponse(result);
    } catch (error) {
      throw new Error(`OCR from buffer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processFromBase64(base64Data: string, options: OCRSpaceOptions = {}): Promise<OCRSpaceResult> {
    if (!base64Data.startsWith('data:')) {
      throw new Error('Base64 string must include data URI prefix (e.g., data:image/jpeg;base64,...)');
    }

    const params = this.buildParams(options);
    params.base64Image = base64Data;

    try {
      const response = await fetch(this.postEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params).toString(),
        timeout: 120000,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as OCRSpaceResult;
      return this.validateResponse(result);
    } catch (error) {
      throw new Error(`OCR from base64 failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  extractText(result: OCRSpaceResult): string {
    const texts: string[] = [];
    
    for (const parsedResult of result.ParsedResults) {
      if (parsedResult.FileParseExitCode === 1) { // Success
        const text = parsedResult.ParsedText?.trim();
        if (text) {
          texts.push(text);
        }
      }
    }

    return texts.join('\n\n');
  }

  extractWordsWithPositions(result: OCRSpaceResult): Array<{
    page: number;
    line: number;
    wordIndex: number;
    text: string;
    left: number;
    top: number;
    height: number;
    width: number;
  }> {
    const wordsData: any[] = [];

    result.ParsedResults.forEach((parsedResult, pageIndex) => {
      if (parsedResult.FileParseExitCode === 1 && parsedResult.TextOverlay) {
        const lines = parsedResult.TextOverlay.Lines || [];
        
        lines.forEach((line, lineIndex) => {
          const words = line.Words || [];
          
          words.forEach((word, wordIndex) => {
            wordsData.push({
              page: pageIndex + 1,
              line: lineIndex + 1,
              wordIndex: wordIndex + 1,
              text: word.WordText || '',
              left: word.Left || 0,
              top: word.Top || 0,
              height: word.Height || 0,
              width: word.Width || 0,
            });
          });
        });
      }
    });

    return wordsData;
  }

  async downloadSearchablePdf(result: OCRSpaceResult, outputPath: string): Promise<boolean> {
    const pdfUrl = result.SearchablePDFURL;
    if (!pdfUrl) {
      console.warn('No searchable PDF URL found in response');
      return false;
    }

    try {
      const response = await fetch(pdfUrl, { timeout: 60000 });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const buffer = await response.buffer();
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`Searchable PDF saved to: ${outputPath}`);
      return true;
    } catch (error) {
      console.error(`Failed to download searchable PDF: ${error}`);
      return false;
    }
  }

  getSupportedLanguages(): Record<string, string> {
    return { ...this.supportedLanguages };
  }

  private buildParams(options: OCRSpaceOptions): Record<string, string> {
    const params: Record<string, string> = {
      apikey: this.apiKey,
      language: options.language || 'eng',
      isOverlayRequired: String(options.isOverlayRequired || false),
      detectOrientation: String(options.detectOrientation || false),
      isCreateSearchablePdf: String(options.isCreateSearchablePdf || false),
      isSearchablePdfHideTextLayer: String(options.isSearchablePdfHideTextLayer || false),
      scale: String(options.scale || false),
      isTable: String(options.isTable || false),
      OCREngine: String(options.ocrEngine || 1),
    };

    if (options.filetype) {
      params.filetype = options.filetype;
    }

    // Validate parameters
    if (!(options.language || 'eng') in this.supportedLanguages) {
      throw new Error(`Unsupported language: ${options.language}`);
    }

    if (options.ocrEngine && ![1, 2].includes(options.ocrEngine)) {
      throw new Error('OCR engine must be 1 or 2');
    }

    if (options.language === 'auto' && options.ocrEngine !== 2) {
      throw new Error('Auto-detect language is only available with OCR Engine 2');
    }

    return params;
  }

  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
      '.pdf': 'application/pdf',
    };

    return contentTypes[extension] || 'application/octet-stream';
  }

  private validateResponse(result: OCRSpaceResult): OCRSpaceResult {
    // Check for API errors
    if (result.IsErroredOnProcessing) {
      const errorMsg = result.ErrorMessage || 'Unknown error';
      const errorDetails = result.ErrorDetails || '';
      throw new Error(`OCR processing error: ${errorMsg}. Details: ${errorDetails}`);
    }

    // Check OCR exit code
    const ocrExitCode = result.OCRExitCode;
    if (ocrExitCode === 3) {
      throw new Error('All OCR processing failed');
    } else if (ocrExitCode === 4) {
      throw new Error('Fatal OCR error occurred');
    } else if (ocrExitCode === 2) {
      console.warn('Partial OCR success - some pages may have failed');
    }

    // Log processing time
    const processingTime = result.ProcessingTimeInMilliseconds || 'Unknown';
    console.log(`OCR completed in ${processingTime}ms`);

    return result;
  }
}

export const ocrSpaceService = new OCRSpaceService();
