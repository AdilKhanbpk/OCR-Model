// Demo Data Generator for OCR Results
// Generates realistic OCR results for different document types when database is disabled

interface DemoOCRResult {
  rawText: string;
  structuredData: any;
  extractedFields: {
    fields: Array<{
      name: string;
      value: string;
      confidence: number;
      normalized?: any;
      fieldStatus: 'valid' | 'needs_review' | 'invalid';
      validationErrors?: string[];
    }>;
    overallConfidence: number;
    needsReview: boolean;
  };
  confidence: number;
  processingTime: number;
}

export class DemoDataGenerator {
  private readonly demoData = {
    invoice: {
      rawText: `ACME CORPORATION
123 Business Street
New York, NY 10001
Phone: (555) 123-4567

INVOICE

Invoice #: INV-2024-001
Date: August 25, 2024
Due Date: September 24, 2024

Bill To:
Demo Company Inc.
456 Client Avenue
Los Angeles, CA 90210

Description                    Qty    Unit Price    Total
Web Development Services        40     $125.00      $5,000.00
UI/UX Design                   20     $100.00      $2,000.00
Project Management             10     $150.00      $1,500.00

                              Subtotal: $8,500.00
                                   Tax: $765.00
                                 Total: $9,265.00

Payment Terms: Net 30
Thank you for your business!`,
      fields: [
        { name: 'invoice_number', value: 'INV-2024-001', confidence: 0.98, normalized: 'INV-2024-001', fieldStatus: 'valid' as const },
        { name: 'invoice_date', value: 'August 25, 2024', confidence: 0.95, normalized: '2024-08-25', fieldStatus: 'valid' as const },
        { name: 'due_date', value: 'September 24, 2024', confidence: 0.93, normalized: '2024-09-24', fieldStatus: 'valid' as const },
        { name: 'vendor_name', value: 'ACME CORPORATION', confidence: 0.97, normalized: 'ACME CORPORATION', fieldStatus: 'valid' as const },
        { name: 'bill_to_name', value: 'Demo Company Inc.', confidence: 0.94, normalized: 'Demo Company Inc.', fieldStatus: 'valid' as const },
        { name: 'subtotal', value: '$8,500.00', confidence: 0.96, normalized: { amount: 8500.00, currency: 'USD' }, fieldStatus: 'valid' as const },
        { name: 'tax', value: '$765.00', confidence: 0.92, normalized: { amount: 765.00, currency: 'USD' }, fieldStatus: 'valid' as const },
        { name: 'total_amount', value: '$9,265.00', confidence: 0.98, normalized: { amount: 9265.00, currency: 'USD' }, fieldStatus: 'valid' as const },
        { name: 'currency', value: 'USD', confidence: 0.99, normalized: 'USD', fieldStatus: 'valid' as const },
      ],
    },
    receipt: {
      rawText: `STARBUCKS COFFEE
Store #1234
123 Main Street
Seattle, WA 98101

Receipt #: 1234567890
Date: 08/25/2024 2:45 PM
Cashier: Sarah

Grande Latte                   $5.45
Blueberry Muffin              $3.25
Extra Shot                    $0.75

Subtotal:                     $9.45
Tax:                          $0.85
Total:                       $10.30

Payment: Credit Card ****1234
Thank you for visiting!`,
      fields: [
        { name: 'merchant_name', value: 'STARBUCKS COFFEE', confidence: 0.97, normalized: 'STARBUCKS COFFEE', fieldStatus: 'valid' as const },
        { name: 'receipt_date', value: '08/25/2024', confidence: 0.95, normalized: '2024-08-25', fieldStatus: 'valid' as const },
        { name: 'receipt_time', value: '2:45 PM', confidence: 0.90, normalized: '14:45', fieldStatus: 'valid' as const },
        { name: 'total_amount', value: '$10.30', confidence: 0.98, normalized: { amount: 10.30, currency: 'USD' }, fieldStatus: 'valid' as const },
        { name: 'tax', value: '$0.85', confidence: 0.93, normalized: { amount: 0.85, currency: 'USD' }, fieldStatus: 'valid' as const },
        { name: 'payment_method', value: 'Credit Card ****1234', confidence: 0.89, normalized: 'Credit Card', fieldStatus: 'valid' as const },
        { name: 'currency', value: 'USD', confidence: 0.99, normalized: 'USD', fieldStatus: 'valid' as const },
      ],
    },
    id: {
      rawText: `DRIVER LICENSE
STATE OF CALIFORNIA

DL 12345678
DOB: 01/15/1990
EXP: 01/15/2028

JOHN MICHAEL SMITH
123 DEMO STREET
LOS ANGELES CA 90210

CLASS: C
RESTRICTIONS: NONE
ENDORSEMENTS: NONE`,
      fields: [
        { name: 'full_name', value: 'JOHN MICHAEL SMITH', confidence: 0.96, normalized: 'John Michael Smith', fieldStatus: 'valid' as const },
        { name: 'given_name', value: 'JOHN', confidence: 0.94, normalized: 'John', fieldStatus: 'valid' as const },
        { name: 'family_name', value: 'SMITH', confidence: 0.95, normalized: 'Smith', fieldStatus: 'valid' as const },
        { name: 'date_of_birth', value: '01/15/1990', confidence: 0.97, normalized: '1990-01-15', fieldStatus: 'valid' as const },
        { name: 'id_number', value: 'DL 12345678', confidence: 0.98, normalized: 'DL12345678', fieldStatus: 'valid' as const },
        { name: 'expiry_date', value: '01/15/2028', confidence: 0.93, normalized: '2028-01-15', fieldStatus: 'valid' as const },
        { name: 'document_type', value: 'DRIVER LICENSE', confidence: 0.99, normalized: 'Driver License', fieldStatus: 'valid' as const },
        { name: 'country', value: 'USA', confidence: 0.95, normalized: 'United States', fieldStatus: 'valid' as const },
      ],
    },
    bank_statement: {
      rawText: `FIRST NATIONAL BANK
Monthly Statement

Account Holder: Jane Demo
Account Number: ****5678
Statement Period: July 1 - July 31, 2024

Beginning Balance:        $2,450.00
Total Deposits:          $3,200.00
Total Withdrawals:       $1,850.00
Ending Balance:          $3,800.00

Recent Transactions:
07/30 Direct Deposit     $1,200.00
07/28 ATM Withdrawal      -$100.00
07/25 Online Purchase     -$45.67`,
      fields: [
        { name: 'bank_name', value: 'FIRST NATIONAL BANK', confidence: 0.97, normalized: 'First National Bank', fieldStatus: 'valid' as const },
        { name: 'account_holder', value: 'Jane Demo', confidence: 0.95, normalized: 'Jane Demo', fieldStatus: 'valid' as const },
        { name: 'account_number', value: '****5678', confidence: 0.93, normalized: '****5678', fieldStatus: 'valid' as const },
        { name: 'statement_date', value: 'July 31, 2024', confidence: 0.94, normalized: '2024-07-31', fieldStatus: 'valid' as const },
        { name: 'balance', value: '$3,800.00', confidence: 0.98, normalized: { amount: 3800.00, currency: 'USD' }, fieldStatus: 'valid' as const },
      ],
    },
    business_card: {
      rawText: `JOHN SMITH
Senior Software Engineer

TECH SOLUTIONS INC.
john.smith@techsolutions.com
(555) 987-6543
www.techsolutions.com

123 Innovation Drive
San Francisco, CA 94105`,
      fields: [
        { name: 'full_name', value: 'JOHN SMITH', confidence: 0.96, normalized: 'John Smith', fieldStatus: 'valid' as const },
        { name: 'company', value: 'TECH SOLUTIONS INC.', confidence: 0.94, normalized: 'Tech Solutions Inc.', fieldStatus: 'valid' as const },
        { name: 'title', value: 'Senior Software Engineer', confidence: 0.92, normalized: 'Senior Software Engineer', fieldStatus: 'valid' as const },
        { name: 'phone', value: '(555) 987-6543', confidence: 0.95, normalized: '(555) 987-6543', fieldStatus: 'valid' as const },
        { name: 'email', value: 'john.smith@techsolutions.com', confidence: 0.97, normalized: 'john.smith@techsolutions.com', fieldStatus: 'valid' as const },
        { name: 'website', value: 'www.techsolutions.com', confidence: 0.89, normalized: 'https://www.techsolutions.com', fieldStatus: 'valid' as const },
        { name: 'address', value: '123 Innovation Drive, San Francisco, CA 94105', confidence: 0.88, normalized: '123 Innovation Drive, San Francisco, CA 94105', fieldStatus: 'valid' as const },
      ],
    },
    form: {
      rawText: `APPLICATION FORM

Name: ________________
Address: ______________
Phone: _______________
Email: _______________

Please check one:
☐ Option A
☑ Option B
☐ Option C

Signature: ____________
Date: ________________`,
      fields: [
        { name: 'document_type', value: 'APPLICATION FORM', confidence: 0.95, normalized: 'Application Form', fieldStatus: 'valid' as const },
        { name: 'selected_option', value: 'Option B', confidence: 0.87, normalized: 'Option B', fieldStatus: 'needs_review' as const, validationErrors: ['Low confidence checkbox detection'] },
      ],
    },
    generic: {
      rawText: `This is a sample document with generic text content.
It contains multiple paragraphs and various information
that doesn't fit into any specific document category.

The OCR system has successfully extracted this text
with high accuracy and confidence levels.

This demonstrates the generic text extraction
capabilities of the OCR service.`,
      fields: [
        { name: 'text_content', value: 'Generic document text extracted successfully', confidence: 0.92, normalized: 'Generic document text extracted successfully', fieldStatus: 'valid' as const },
      ],
    },
  };

  generateDemoResult(filename: string, docType: string): DemoOCRResult {
    console.log(`🎭 [DEMO] Generating demo OCR result for ${docType}: ${filename}`);

    const demoType = docType in this.demoData ? docType as keyof typeof this.demoData : 'generic';
    const demo = this.demoData[demoType];

    // Add some randomness to confidence scores
    const fields = demo.fields.map(field => ({
      ...field,
      confidence: Math.max(0.7, field.confidence + (Math.random() - 0.5) * 0.1), // Slight variation
    }));

    // Calculate overall confidence
    const overallConfidence = fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length;

    // Determine if needs review (lower confidence or validation errors)
    const needsReview = overallConfidence < 0.9 || fields.some(f => f.fieldStatus === 'needs_review' || f.fieldStatus === 'invalid');

    // Simulate processing time
    const processingTime = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds

    const result: DemoOCRResult = {
      rawText: demo.rawText,
      structuredData: {
        pages: [
          {
            width: 595,
            height: 842,
            blocks: [
              {
                text: demo.rawText.split('\n')[0],
                boundingBox: { x: 50, y: 50, width: 495, height: 30 },
                confidence: 0.95,
              },
            ],
          },
        ],
        confidence: overallConfidence,
        processorType: 'demo_mode',
      },
      extractedFields: {
        fields,
        overallConfidence: Math.round(overallConfidence * 100) / 100,
        needsReview,
      },
      confidence: Math.round(overallConfidence * 100) / 100,
      processingTime,
    };

    console.log(`✨ [DEMO] Generated result: ${fields.length} fields, ${Math.round(overallConfidence * 100)}% confidence, ${needsReview ? 'needs review' : 'approved'}`);

    return result;
  }

  generateRandomDocType(): string {
    const types = ['invoice', 'receipt', 'id', 'bank_statement', 'business_card', 'form', 'generic'];
    return types[Math.floor(Math.random() * types.length)];
  }

  generateDemoJobId(): string {
    return `demo-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate demo data for different scenarios
  generateLowConfidenceResult(filename: string, docType: string): DemoOCRResult {
    const result = this.generateDemoResult(filename, docType);
    
    // Lower all confidence scores
    result.extractedFields.fields = result.extractedFields.fields.map(field => ({
      ...field,
      confidence: Math.max(0.4, field.confidence - 0.3),
      fieldStatus: field.confidence < 0.6 ? 'needs_review' as const : field.fieldStatus,
    }));

    result.extractedFields.overallConfidence = 0.65;
    result.extractedFields.needsReview = true;
    result.confidence = 0.65;

    console.log(`⚠️ [DEMO] Generated low-confidence result for review queue`);
    return result;
  }

  generateErrorResult(filename: string, error: string): any {
    console.log(`❌ [DEMO] Generating error result: ${error}`);
    return {
      error,
      rawText: '',
      structuredData: null,
      extractedFields: { fields: [], overallConfidence: 0, needsReview: false },
      confidence: 0,
      processingTime: 500,
    };
  }
}

export const demoDataGenerator = new DemoDataGenerator();
