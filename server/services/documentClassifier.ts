interface ClassificationResult {
  docType: string;
  confidence: number;
  alternativeTypes?: Array<{ type: string; confidence: number }>;
}

interface DocumentFeatures {
  filename: string;
  mimeType: string;
  size: number;
  textSample?: string;
  hasNumbers: boolean;
  hasAmounts: boolean;
  hasDates: boolean;
  hasAddresses: boolean;
  hasPhoneNumbers: boolean;
  hasEmails: boolean;
  wordCount: number;
  lineCount: number;
}

export class DocumentClassifierService {
  private readonly patterns = {
    invoice: {
      keywords: ['invoice', 'bill', 'payment due', 'amount due', 'subtotal', 'tax', 'total', 'vendor', 'bill to'],
      amounts: /\$[\d,]+\.?\d*/g,
      invoiceNumbers: /(?:invoice|inv|bill)[\s#:]*([a-z0-9\-]+)/gi,
      dueDates: /(?:due|payment due|pay by)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
      weight: 1.0,
    },
    receipt: {
      keywords: ['receipt', 'thank you', 'store', 'purchase', 'transaction', 'card ending', 'change', 'cash'],
      amounts: /\$[\d,]+\.?\d*/g,
      receiptNumbers: /(?:receipt|trans|ref)[\s#:]*([a-z0-9\-]+)/gi,
      merchants: /(?:store|merchant|location)[\s:]*([a-z\s]+)/gi,
      weight: 0.9,
    },
    id: {
      keywords: ['license', 'identification', 'id card', 'passport', 'driver', 'expires', 'date of birth', 'dob'],
      idNumbers: /(?:id|license|passport)[\s#:]*([a-z0-9\-]+)/gi,
      dates: /(?:dob|born|expires?)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
      names: /(?:name|full name)[\s:]*([a-z\s]+)/gi,
      weight: 1.0,
    },
    bank_statement: {
      keywords: ['statement', 'account', 'balance', 'deposit', 'withdrawal', 'transaction', 'bank', 'checking', 'savings'],
      accountNumbers: /(?:account|acct)[\s#:]*([*\d\-]+)/gi,
      balances: /(?:balance|bal)[\s:]*\$?[\d,]+\.?\d*/gi,
      transactions: /(?:deposit|withdrawal|debit|credit)[\s:]*\$?[\d,]+\.?\d*/gi,
      weight: 0.95,
    },
    business_card: {
      keywords: ['phone', 'email', 'website', 'company', 'title', 'position', 'mobile', 'office'],
      phones: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
      emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      websites: /(?:www\.|https?:\/\/)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      weight: 0.8,
    },
    form: {
      keywords: ['form', 'application', 'please fill', 'signature', 'date signed', 'checkbox', 'select one'],
      checkboxes: /\[[\sx]\]|\(\s*\)|\(\s*x\s*\)/g,
      signatures: /(?:signature|sign here|signed)[\s:]*([a-z\s]+)/gi,
      fields: /(?:name|address|phone|email)[\s:]*_+/gi,
      weight: 0.7,
    },
  };

  async classifyDocument(
    filename: string,
    mimeType: string,
    size: number,
    textSample?: string
  ): Promise<ClassificationResult> {
    const features = this.extractFeatures(filename, mimeType, size, textSample);
    const scores = this.calculateTypeScores(features);
    
    // Sort by confidence score
    const sortedScores = Object.entries(scores)
      .map(([type, score]) => ({ type, confidence: score }))
      .sort((a, b) => b.confidence - a.confidence);

    const topResult = sortedScores[0];
    const alternatives = sortedScores.slice(1, 3); // Top 2 alternatives

    // If confidence is too low, classify as unknown
    if (topResult.confidence < 0.3) {
      return {
        docType: 'unknown',
        confidence: 1 - topResult.confidence,
        alternativeTypes: alternatives,
      };
    }

    // If it's clearly generic text without specific document patterns
    if (topResult.confidence < 0.5 && this.isGenericText(features)) {
      return {
        docType: 'generic',
        confidence: 0.8,
        alternativeTypes: alternatives,
      };
    }

    return {
      docType: topResult.type,
      confidence: Math.min(topResult.confidence, 0.99), // Cap at 99%
      alternativeTypes: alternatives,
    };
  }

  private extractFeatures(
    filename: string,
    mimeType: string,
    size: number,
    textSample?: string
  ): DocumentFeatures {
    const text = textSample || '';
    const lowerText = text.toLowerCase();

    return {
      filename: filename.toLowerCase(),
      mimeType,
      size,
      textSample: text,
      hasNumbers: /\d/.test(text),
      hasAmounts: /\$[\d,]+\.?\d*/.test(text),
      hasDates: /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text),
      hasAddresses: /\d+\s+[a-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard)/i.test(text),
      hasPhoneNumbers: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/.test(text),
      hasEmails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text),
      wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
      lineCount: text.split('\n').length,
    };
  }

  private calculateTypeScores(features: DocumentFeatures): Record<string, number> {
    const scores: Record<string, number> = {};
    const text = features.textSample || '';
    const lowerText = text.toLowerCase();

    for (const [docType, patterns] of Object.entries(this.patterns)) {
      let score = 0;

      // Filename-based scoring
      const filenameScore = this.getFilenameScore(features.filename, docType);
      score += filenameScore * 0.2;

      // Keyword matching
      const keywordScore = this.getKeywordScore(lowerText, patterns.keywords);
      score += keywordScore * 0.4;

      // Pattern matching
      const patternScore = this.getPatternScore(text, patterns);
      score += patternScore * 0.3;

      // Feature-based scoring
      const featureScore = this.getFeatureScore(features, docType);
      score += featureScore * 0.1;

      // Apply document type weight
      score *= patterns.weight;

      scores[docType] = Math.min(score, 1.0);
    }

    return scores;
  }

  private getFilenameScore(filename: string, docType: string): number {
    const typeKeywords: Record<string, string[]> = {
      invoice: ['invoice', 'bill', 'inv'],
      receipt: ['receipt', 'rcpt'],
      id: ['id', 'license', 'passport', 'dl'],
      bank_statement: ['statement', 'bank', 'account'],
      business_card: ['card', 'contact', 'business'],
      form: ['form', 'application', 'app'],
    };

    const keywords = typeKeywords[docType] || [];
    return keywords.some(keyword => filename.includes(keyword)) ? 1.0 : 0.0;
  }

  private getKeywordScore(text: string, keywords: string[]): number {
    const matches = keywords.filter(keyword => text.includes(keyword));
    return Math.min(matches.length / keywords.length, 1.0);
  }

  private getPatternScore(text: string, patterns: any): number {
    let score = 0;
    let patternCount = 0;

    // Check each pattern in the document type
    for (const [key, pattern] of Object.entries(patterns)) {
      if (key === 'keywords' || key === 'weight') continue;
      
      patternCount++;
      if (pattern instanceof RegExp) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          score += Math.min(matches.length / 3, 1.0); // Normalize by expected matches
        }
      }
    }

    return patternCount > 0 ? score / patternCount : 0;
  }

  private getFeatureScore(features: DocumentFeatures, docType: string): number {
    const featureWeights: Record<string, Record<string, number>> = {
      invoice: {
        hasAmounts: 0.8,
        hasDates: 0.6,
        hasAddresses: 0.4,
        hasNumbers: 0.3,
      },
      receipt: {
        hasAmounts: 0.9,
        hasDates: 0.5,
        hasNumbers: 0.4,
      },
      id: {
        hasDates: 0.7,
        hasNumbers: 0.6,
        hasAddresses: 0.5,
      },
      bank_statement: {
        hasAmounts: 0.9,
        hasDates: 0.8,
        hasNumbers: 0.7,
      },
      business_card: {
        hasPhoneNumbers: 0.9,
        hasEmails: 0.8,
        hasAddresses: 0.6,
      },
      form: {
        hasNumbers: 0.3,
        hasDates: 0.4,
      },
    };

    const weights = featureWeights[docType] || {};
    let score = 0;
    let totalWeight = 0;

    for (const [feature, weight] of Object.entries(weights)) {
      totalWeight += weight;
      if (features[feature as keyof DocumentFeatures]) {
        score += weight;
      }
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  private isGenericText(features: DocumentFeatures): boolean {
    // Heuristics for generic text documents
    return (
      features.wordCount > 100 &&
      !features.hasAmounts &&
      !features.hasPhoneNumbers &&
      !features.hasEmails &&
      features.lineCount > 10
    );
  }

  // Get confidence threshold for requiring human review
  getReviewThreshold(docType: string): number {
    const thresholds: Record<string, number> = {
      invoice: 0.7,
      receipt: 0.6,
      id: 0.8,
      bank_statement: 0.7,
      business_card: 0.5,
      form: 0.6,
      generic: 0.4,
      unknown: 0.3,
    };

    return thresholds[docType] || 0.6;
  }
}

export const documentClassifierService = new DocumentClassifierService();
