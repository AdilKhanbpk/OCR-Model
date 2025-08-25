interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
  normalized?: any;
  provenance?: {
    page: number;
    bbox?: { x: number; y: number; width: number; height: number };
  };
  fieldStatus: 'valid' | 'needs_review' | 'invalid';
  validationErrors?: string[];
}

interface FieldExtractionResult {
  fields: ExtractedField[];
  docType: string;
  overallConfidence: number;
  needsReview: boolean;
}

export class FieldExtractionService {
  private readonly fieldDefinitions = {
    invoice: {
      invoice_number: { required: true, type: 'string', patterns: [/(?:invoice|inv)[\s#:]*([a-z0-9\-]+)/gi] },
      invoice_date: { required: true, type: 'date', patterns: [/(?:date|invoice date)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi] },
      due_date: { required: false, type: 'date', patterns: [/(?:due|payment due|pay by)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi] },
      vendor_name: { required: true, type: 'string', patterns: [/(?:from|vendor|bill from)[\s:]*([a-z\s&.,]+)/gi] },
      vendor_tax_id: { required: false, type: 'string', patterns: [/(?:tax id|ein|vat)[\s#:]*([a-z0-9\-]+)/gi] },
      vendor_address: { required: false, type: 'address', patterns: [/\d+\s+[a-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard)/gi] },
      bill_to_name: { required: false, type: 'string', patterns: [/(?:bill to|to)[\s:]*([a-z\s&.,]+)/gi] },
      subtotal: { required: false, type: 'currency', patterns: [/(?:subtotal|sub total)[\s:]*\$?([\d,]+\.?\d*)/gi] },
      tax: { required: false, type: 'currency', patterns: [/(?:tax|vat)[\s:]*\$?([\d,]+\.?\d*)/gi] },
      total_amount: { required: true, type: 'currency', patterns: [/(?:total|amount due|balance due)[\s:]*\$?([\d,]+\.?\d*)/gi] },
      currency: { required: false, type: 'string', patterns: [/\$|USD|EUR|GBP|CAD/gi] },
    },
    receipt: {
      merchant_name: { required: true, type: 'string', patterns: [/^([A-Z\s&.,]+)$/gm] },
      receipt_date: { required: true, type: 'date', patterns: [/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g] },
      receipt_time: { required: false, type: 'time', patterns: [/(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)/gi] },
      total_amount: { required: true, type: 'currency', patterns: [/(?:total|amount)[\s:]*\$?([\d,]+\.?\d*)/gi] },
      tax: { required: false, type: 'currency', patterns: [/(?:tax|hst|gst)[\s:]*\$?([\d,]+\.?\d*)/gi] },
      payment_method: { required: false, type: 'string', patterns: [/(?:card ending|cash|credit|debit)[\s:]*([a-z0-9\s]+)/gi] },
      currency: { required: false, type: 'string', patterns: [/\$|USD|EUR|GBP|CAD/gi] },
    },
    id: {
      full_name: { required: true, type: 'string', patterns: [/(?:name|full name)[\s:]*([a-z\s]+)/gi] },
      given_name: { required: false, type: 'string', patterns: [/(?:first name|given name)[\s:]*([a-z\s]+)/gi] },
      family_name: { required: false, type: 'string', patterns: [/(?:last name|family name|surname)[\s:]*([a-z\s]+)/gi] },
      date_of_birth: { required: true, type: 'date', patterns: [/(?:dob|date of birth|born)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi] },
      id_number: { required: true, type: 'string', patterns: [/(?:id|license|dl)[\s#:]*([a-z0-9\-]+)/gi] },
      expiry_date: { required: false, type: 'date', patterns: [/(?:expires?|exp)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi] },
      document_type: { required: false, type: 'string', patterns: [/(?:driver|license|passport|id card)/gi] },
      country: { required: false, type: 'string', patterns: [/(?:country|nation)[\s:]*([a-z\s]+)/gi] },
    },
    bank_statement: {
      account_number: { required: true, type: 'string', patterns: [/(?:account|acct)[\s#:]*([*\d\-]+)/gi] },
      statement_date: { required: true, type: 'date', patterns: [/(?:statement date|as of)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi] },
      balance: { required: true, type: 'currency', patterns: [/(?:balance|bal)[\s:]*\$?([\d,]+\.?\d*)/gi] },
      bank_name: { required: false, type: 'string', patterns: [/^([A-Z\s&.,]+BANK[A-Z\s&.,]*)$/gm] },
      account_holder: { required: false, type: 'string', patterns: [/(?:account holder|name)[\s:]*([a-z\s]+)/gi] },
    },
    business_card: {
      full_name: { required: true, type: 'string', patterns: [/^([A-Z][a-z]+\s+[A-Z][a-z]+)$/gm] },
      company: { required: false, type: 'string', patterns: [/^([A-Z\s&.,]+(?:INC|LLC|CORP|LTD)[A-Z\s&.,]*)$/gm] },
      title: { required: false, type: 'string', patterns: [/(?:title|position)[\s:]*([a-z\s]+)/gi] },
      phone: { required: false, type: 'phone', patterns: [/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g] },
      email: { required: false, type: 'email', patterns: [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g] },
      website: { required: false, type: 'url', patterns: [/(?:www\.|https?:\/\/)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g] },
      address: { required: false, type: 'address', patterns: [/\d+\s+[a-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard)/gi] },
    },
  };

  async extractFields(
    rawText: string,
    docType: string,
    documentAIEntities?: any[],
    pages?: any[]
  ): Promise<FieldExtractionResult> {
    const fieldDefs = this.fieldDefinitions[docType as keyof typeof this.fieldDefinitions];
    if (!fieldDefs) {
      return {
        fields: [],
        docType,
        overallConfidence: 0,
        needsReview: true,
      };
    }

    const extractedFields: ExtractedField[] = [];

    // First, try to extract from Document AI entities if available
    if (documentAIEntities) {
      for (const entity of documentAIEntities) {
        const field = this.mapEntityToField(entity, docType);
        if (field) {
          extractedFields.push(field);
        }
      }
    }

    // Then, extract using regex patterns for any missing fields
    for (const [fieldName, fieldDef] of Object.entries(fieldDefs)) {
      const existingField = extractedFields.find(f => f.name === fieldName);
      if (!existingField) {
        const regexField = this.extractFieldWithRegex(rawText, fieldName, fieldDef, pages);
        if (regexField) {
          extractedFields.push(regexField);
        }
      }
    }

    // Validate and normalize all fields
    const validatedFields = extractedFields.map(field => this.validateAndNormalizeField(field, fieldDefs[field.name]));

    // Calculate overall confidence and review needs
    const confidences = validatedFields.map(f => f.confidence).filter(c => c > 0);
    const overallConfidence = confidences.length > 0 ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length : 0;
    
    const needsReview = this.determineReviewNeed(validatedFields, fieldDefs, overallConfidence);

    return {
      fields: validatedFields,
      docType,
      overallConfidence: Math.round(overallConfidence * 100) / 100,
      needsReview,
    };
  }

  private mapEntityToField(entity: any, docType: string): ExtractedField | null {
    // Map Document AI entity types to our field names
    const entityMappings: Record<string, Record<string, string>> = {
      invoice: {
        'invoice_number': 'invoice_number',
        'invoice_date': 'invoice_date',
        'due_date': 'due_date',
        'supplier_name': 'vendor_name',
        'total_amount': 'total_amount',
        'net_amount': 'subtotal',
        'total_tax_amount': 'tax',
        'currency': 'currency',
      },
      receipt: {
        'supplier_name': 'merchant_name',
        'receipt_date': 'receipt_date',
        'total_amount': 'total_amount',
        'total_tax_amount': 'tax',
      },
      // Add more mappings as needed
    };

    const mappings = entityMappings[docType];
    if (!mappings) return null;

    const fieldName = mappings[entity.type];
    if (!fieldName) return null;

    return {
      name: fieldName,
      value: entity.mentionText || '',
      confidence: entity.confidence || 0,
      normalized: entity.normalizedValue,
      provenance: entity.pageAnchor ? {
        page: entity.pageAnchor.pageRefs?.[0]?.page || 1,
        bbox: this.extractBoundingBox(entity.pageAnchor),
      } : undefined,
      fieldStatus: 'valid',
    };
  }

  private extractFieldWithRegex(
    text: string,
    fieldName: string,
    fieldDef: any,
    pages?: any[]
  ): ExtractedField | null {
    for (const pattern of fieldDef.patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const value = matches[1] || matches[0];
        return {
          name: fieldName,
          value: value.trim(),
          confidence: 0.7, // Lower confidence for regex extraction
          fieldStatus: 'valid',
        };
      }
    }
    return null;
  }

  private validateAndNormalizeField(field: ExtractedField, fieldDef: any): ExtractedField {
    const validatedField = { ...field };
    validatedField.validationErrors = [];

    try {
      switch (fieldDef.type) {
        case 'date':
          validatedField.normalized = this.normalizeDate(field.value);
          break;
        case 'currency':
          validatedField.normalized = this.normalizeCurrency(field.value);
          break;
        case 'phone':
          validatedField.normalized = this.normalizePhone(field.value);
          break;
        case 'email':
          validatedField.normalized = this.normalizeEmail(field.value);
          break;
        case 'address':
          validatedField.normalized = this.normalizeAddress(field.value);
          break;
        default:
          validatedField.normalized = field.value.trim();
      }

      // Validate the normalized value
      const isValid = this.validateFieldValue(validatedField.normalized, fieldDef.type);
      if (!isValid) {
        validatedField.fieldStatus = 'needs_review';
        validatedField.validationErrors?.push(`Invalid ${fieldDef.type} format`);
      }

    } catch (error) {
      validatedField.fieldStatus = 'invalid';
      validatedField.validationErrors?.push(`Normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return validatedField;
  }

  private normalizeDate(dateStr: string): string {
    // Try to parse various date formats and return ISO format
    const cleanDate = dateStr.replace(/[^\d\/\-]/g, '');
    const date = new Date(cleanDate);
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private normalizeCurrency(amountStr: string): { amount: number; currency: string } {
    const cleanAmount = amountStr.replace(/[^\d.,]/g, '');
    const amount = parseFloat(cleanAmount.replace(/,/g, ''));
    
    if (isNaN(amount)) {
      throw new Error('Invalid currency amount');
    }

    // Detect currency symbol
    let currency = 'USD'; // Default
    if (amountStr.includes('€')) currency = 'EUR';
    else if (amountStr.includes('£')) currency = 'GBP';
    else if (amountStr.includes('C$')) currency = 'CAD';

    return { amount, currency };
  }

  private normalizePhone(phoneStr: string): string {
    // Remove all non-digits
    const digits = phoneStr.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phoneStr; // Return original if can't normalize
  }

  private normalizeEmail(emailStr: string): string {
    return emailStr.toLowerCase().trim();
  }

  private normalizeAddress(addressStr: string): string {
    // Basic address normalization
    return addressStr.trim()
      .replace(/\s+/g, ' ')
      .replace(/\bst\b/gi, 'Street')
      .replace(/\bave\b/gi, 'Avenue')
      .replace(/\brd\b/gi, 'Road')
      .replace(/\bdr\b/gi, 'Drive');
  }

  private validateFieldValue(value: any, type: string): boolean {
    switch (type) {
      case 'date':
        return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
      case 'currency':
        return typeof value === 'object' && typeof value.amount === 'number' && !isNaN(value.amount);
      case 'phone':
        return typeof value === 'string' && /^\+?[\d\s\(\)\-]+$/.test(value);
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      default:
        return typeof value === 'string' && value.length > 0;
    }
  }

  private determineReviewNeed(fields: ExtractedField[], fieldDefs: any, overallConfidence: number): boolean {
    // Check if any required fields are missing
    const requiredFields = Object.entries(fieldDefs)
      .filter(([_, def]: [string, any]) => def.required)
      .map(([name, _]) => name);

    const extractedFieldNames = fields.map(f => f.name);
    const missingRequired = requiredFields.filter(name => !extractedFieldNames.includes(name));

    if (missingRequired.length > 0) return true;

    // Check if any fields need review
    const fieldsNeedingReview = fields.filter(f => f.fieldStatus === 'needs_review' || f.fieldStatus === 'invalid');
    if (fieldsNeedingReview.length > 0) return true;

    // Check overall confidence
    if (overallConfidence < 0.8) return true;

    return false;
  }

  private extractBoundingBox(pageAnchor: any): { x: number; y: number; width: number; height: number } | undefined {
    if (!pageAnchor?.pageRefs?.[0]?.boundingPoly?.vertices) return undefined;

    const vertices = pageAnchor.pageRefs[0].boundingPoly.vertices;
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
}

export const fieldExtractionService = new FieldExtractionService();
