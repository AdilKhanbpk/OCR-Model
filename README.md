# Production-Grade OCR Service

A secure, scalable web service that accepts images and PDFs, extracts text and structured fields using Google Cloud Vision API and Document AI, returns normalized JSON/CSV/Excel, supports integrations, provides an admin dashboard, and implements monitoring, billing, and a retraining pipeline.

## 🚀 Features

### Core OCR Processing
- **Document Classification**: Automatically identifies document types (invoice, receipt, ID, bank statement, business card, form, generic)
- **Dual Processing**: Uses Google Document AI for specialized documents, falls back to Vision API for generic processing
- **Field Extraction**: Extracts and normalizes structured fields with validation and confidence scoring
- **Multi-format Support**: Processes images (JPEG, PNG, GIF, WebP, TIFF) and PDFs

### Human-in-the-Loop Review
- **Review Queue**: Web interface for reviewing low-confidence extractions
- **Field Correction**: Edit extracted fields with validation and notes
- **Correction Tracking**: Stores all corrections for retraining and audit purposes
- **Approval Workflow**: Approve extractions as-is or with corrections

### Webhook System
- **Reliable Delivery**: Retry logic with exponential backoff
- **HMAC Signatures**: Secure webhook verification with SHA-256 signatures
- **Event Types**: `job.completed`, `job.needs_review`, `job.failed`
- **Delivery Tracking**: Monitor webhook success/failure rates

### Export & Integrations
- **Multiple Formats**: Export to JSON, CSV, Excel
- **Batch Export**: Export multiple jobs with filtering options
- **Training Data**: Export corrected samples for ML retraining
- **Integration Ready**: Zapier-friendly webhook format

### Security & Compliance
- **API Key Authentication**: Secure API access with rate limiting
- **User Management**: Role-based access (user, admin)
- **Data Encryption**: TLS in transit, encrypted storage
- **Audit Logging**: Track all user actions and corrections

### Monitoring & Analytics
- **Usage Tracking**: Pages processed, API calls, costs by processor type
- **Performance Metrics**: Processing time, confidence scores, error rates
- **Billing Dashboard**: Usage reports and cost estimates
- **Admin Analytics**: System-wide statistics and user management

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │────│  Express Server  │────│   PostgreSQL    │
│   - Dashboard   │    │  - REST API      │    │   - Jobs        │
│   - Review UI   │    │  - Auth          │    │   - Users       │
│   - Admin       │    │  - File Upload   │    │   - Corrections │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Google Cloud    │
                       │  - Vision API    │
                       │  - Document AI   │
                       │  - Storage       │
                       └──────────────────┘
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Google Cloud Platform account
- (Optional) Stripe account for billing

### 1. Clone and Install

```bash
git clone <repository-url>
cd OcrEngine
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb ocr_service

# Run migrations
npm run db:push
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ocr_service"

# Google Cloud Configuration
GCP_PROJECT_ID="your-gcp-project-id"
GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
GCP_LOCATION="us"  # or your preferred location

# Document AI Processor IDs (optional - will use demo mode if not configured)
INVOICE_PROCESSOR_ID="your-invoice-processor-id"
ID_PROCESSOR_ID="your-id-processor-id"
BANK_STATEMENT_PROCESSOR_ID="your-bank-statement-processor-id"
RECEIPT_PROCESSOR_ID="your-receipt-processor-id"
FORM_PROCESSOR_ID="your-form-processor-id"

# Stripe Configuration (optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."

# Application Settings
NODE_ENV="development"
PORT="5000"
FRONTEND_URL="http://localhost:5000"

# Session Secret (generate a random string)
SESSION_SECRET="your-super-secret-session-key"
```

### 4. Google Cloud Setup

#### Enable APIs
```bash
gcloud services enable vision.googleapis.com
gcloud services enable documentai.googleapis.com
gcloud services enable storage.googleapis.com
```

#### Create Service Account
```bash
gcloud iam service-accounts create ocr-service \
    --display-name="OCR Service Account"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:ocr-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/documentai.apiUser"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:ocr-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/vision.imageAnnotator"

gcloud iam service-accounts keys create service-account-key.json \
    --iam-account=ocr-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### Create Document AI Processors (Optional)
```bash
# Create processors for specialized document types
gcloud ai document-processors create \
    --location=us \
    --processor-type=INVOICE_PROCESSOR \
    --display-name="Invoice Processor"
```

### 5. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The application will be available at `http://localhost:5000`

## 📚 API Documentation

### Authentication

All API endpoints require authentication via API key:

```bash
curl -H "Authorization: Bearer your-api-key" \
     https://your-domain.com/api/v1/ocr
```

### Core Endpoints

#### Upload Document
```http
POST /api/v1/ocr
Content-Type: multipart/form-data

file: [binary file data]
languageHints: "en,es" (optional)
detectHandwriting: "true" (optional)
```

#### Get Job Status
```http
GET /api/v1/jobs/{jobId}
```

#### Get Usage Statistics
```http
GET /api/v1/usage
```

### Webhook Configuration

#### Register Webhook
```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-domain.com/webhook",
  "secret": "your-webhook-secret",
  "events": ["job.completed", "job.needs_review"]
}
```

#### Webhook Payload Example
```json
{
  "event": "job.completed",
  "jobId": "job-uuid",
  "userId": "user-uuid",
  "timestamp": "2024-08-25T12:00:00Z",
  "data": {
    "job": {
      "id": "job-uuid",
      "filename": "invoice.pdf",
      "docType": "invoice",
      "status": "completed",
      "extractedFields": {
        "fields": [
          {
            "name": "invoice_number",
            "value": "INV-2024-001",
            "confidence": 0.98,
            "normalized": "INV-2024-001"
          }
        ]
      }
    }
  }
}
```

### Export Endpoints

#### Export Jobs
```http
POST /api/export/jobs
Content-Type: application/json

{
  "jobIds": ["job-1", "job-2"],
  "format": "csv",
  "includeRawText": false,
  "includeMetadata": true
}
```

## 🔧 Configuration

### Document Classification

The system automatically classifies documents using:
- Filename patterns
- Content analysis (keywords, patterns)
- Structural features (amounts, dates, addresses)

Confidence thresholds for human review:
- Invoice: 70%
- Receipt: 60%
- ID: 80%
- Bank Statement: 70%
- Business Card: 50%
- Form: 60%

### Field Extraction

Supported field types by document:

**Invoice**: invoice_number, invoice_date, due_date, vendor_name, total_amount, subtotal, tax
**Receipt**: merchant_name, receipt_date, total_amount, tax
**ID**: full_name, date_of_birth, id_number, expiry_date
**Bank Statement**: account_number, statement_date, balance
**Business Card**: full_name, company, phone, email, website

### Cost Estimation

Approximate costs per 1,000 pages:
- Vision API: $1.50
- Document AI (Invoice/ID/Bank): $50.00
- Document AI (Form): $20.00

## 🚀 Deployment

### Docker Deployment

```dockerfile
# Dockerfile included in project
docker build -t ocr-service .
docker run -p 5000:5000 --env-file .env ocr-service
```

### Cloud Run Deployment

```bash
# Build and deploy to Google Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/ocr-service
gcloud run deploy ocr-service \
    --image gcr.io/PROJECT_ID/ocr-service \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

## 📊 Monitoring

### Health Checks
- `GET /health` - Basic health check
- `GET /api/admin/stats` - System statistics (admin only)

### Metrics Tracked
- Processing throughput (pages/second)
- Average processing time
- Error rates by document type
- Cost per document type
- User activity and quotas

### Logging
- All API requests and responses
- Processing errors and retries
- Webhook delivery attempts
- User actions and corrections

## 🔒 Security

### API Security
- API key authentication with rate limiting
- CORS protection
- Request size limits (50MB)
- Input validation and sanitization

### Data Protection
- TLS encryption in transit
- Database encryption at rest
- Secure session management
- PII redaction capabilities

### Compliance
- GDPR data export/deletion endpoints
- Audit trail for all user actions
- Data retention policies
- User consent management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API examples

---

**Note**: This is a production-ready OCR service with enterprise features. For demo purposes, the system will work without Google Cloud credentials but will return mock data.
