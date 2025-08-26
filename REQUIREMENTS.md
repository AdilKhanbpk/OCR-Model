# OCR Service Requirements & Dependencies

## 🖥️ System Requirements

### Operating System
- **Windows**: Windows 10/11 (current setup)
- **macOS**: macOS 10.15+ 
- **Linux**: Ubuntu 18.04+ or equivalent

### Runtime Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **PostgreSQL**: Version 14.0 or higher

## 📦 Core Dependencies

### Backend Dependencies (Node.js/TypeScript)
```json
{
  "express": "^4.21.2",           // Web framework
  "typescript": "5.6.3",          // TypeScript compiler
  "tsx": "^4.19.1",              // TypeScript execution
  "drizzle-orm": "^0.39.1",      // Database ORM
  "drizzle-kit": "^0.30.4",      // Database migrations
  "@neondatabase/serverless": "^0.10.4", // PostgreSQL driver
  "multer": "^2.0.2",            // File upload handling
  "nanoid": "^5.1.5",            // ID generation
  "zod": "^3.24.2",              // Schema validation
  "cross-env": "^7.0.3"          // Cross-platform env vars
}
```

### Google Cloud Dependencies
```json
{
  "@google-cloud/vision": "^5.3.3",      // Vision API
  "@google-cloud/documentai": "^8.8.0"   // Document AI (to be installed)
}
```

### Frontend Dependencies (React/Vite)
```json
{
  "react": "^18.3.1",            // UI framework
  "react-dom": "^18.3.1",        // React DOM
  "vite": "^5.4.19",             // Build tool
  "@tanstack/react-query": "^5.60.5", // Data fetching
  "wouter": "^3.3.5",            // Routing
  "tailwindcss": "^3.4.17"       // CSS framework
}
```

## 🗄️ Database Requirements

### PostgreSQL Setup
1. **Installation**: PostgreSQL 14+ with development headers
2. **Database**: Create database named `ocr_service`
3. **User**: Database user with full permissions
4. **Connection**: TCP/IP connections enabled

### Required Tables (Auto-created by migrations)
- `users` - User accounts and authentication
- `api_keys` - API key management
- `jobs` - OCR job tracking
- `usage_logs` - Usage and billing tracking
- `quotas` - Monthly usage quotas
- `webhooks` - Webhook configurations
- `webhook_deliveries` - Webhook delivery tracking
- `field_corrections` - Human review corrections
- `training_exports` - ML training data exports
- `integrations` - Third-party integrations
- `system_config` - System configuration

## 🌐 External API Requirements

### Google Cloud Platform (Optional - Demo mode available)
1. **Project**: GCP project with billing enabled
2. **APIs Enabled**:
   - Cloud Vision API
   - Document AI API
   - Cloud Storage API (for large files)
3. **Service Account**: With appropriate permissions
4. **Credentials**: Service account JSON key file

### OCR.space API (New Integration)
1. **API Key**: Free tier available at https://ocr.space/ocrapi
2. **Rate Limits**: Free tier limitations apply
3. **Supported Formats**: Images (JPG, PNG, GIF, WebP, TIFF), PDFs

### Stripe (Optional - for billing)
1. **Account**: Stripe account for payment processing
2. **API Keys**: Test and live keys
3. **Webhooks**: Configured for subscription events
4. **Products**: Pricing plans configured

## 🔧 Environment Configuration

### Required Environment Variables
```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ocr_service"

# Google Cloud (Optional - will use demo mode if not provided)
GCP_PROJECT_ID="your-gcp-project-id"
GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
GCP_LOCATION="us"

# Document AI Processors (Optional)
INVOICE_PROCESSOR_ID="your-invoice-processor-id"
ID_PROCESSOR_ID="your-id-processor-id"
BANK_STATEMENT_PROCESSOR_ID="your-bank-statement-processor-id"
RECEIPT_PROCESSOR_ID="your-receipt-processor-id"
FORM_PROCESSOR_ID="your-form-processor-id"

# OCR.space API (New)
OCR_SPACE_API_KEY="your-ocr-space-api-key"

# Stripe (Optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."

# Application Settings
NODE_ENV="development"
PORT="5000"
FRONTEND_URL="http://localhost:5000"
SESSION_SECRET="your-super-secret-session-key"
```

## 🚀 Installation Steps

### 1. System Prerequisites
```bash
# Install Node.js (Windows)
# Download from https://nodejs.org/

# Install PostgreSQL (Windows)
# Download from https://www.postgresql.org/download/windows/

# Verify installations
node --version  # Should be 18+
npm --version   # Should be 8+
psql --version  # Should be 14+
```

### 2. Project Setup
```bash
# Clone repository
git clone <repository-url>
cd OcrEngine

# Install dependencies
npm install

# Install additional Google Cloud dependency
npm install @google-cloud/documentai

# Install OCR.space dependencies (for Python integration)
pip install requests python-dotenv pillow
```

### 3. Database Setup
```bash
# Create database
createdb ocr_service

# Run migrations
npm run db:push
```

### 4. Environment Setup
```bash
# Copy environment template
copy .env.example .env

# Edit .env file with your configuration
notepad .env
```

### 5. Start Application
```bash
# Development (Windows)
npm run dev:win

# Or with cross-env (cross-platform)
npm run dev
```

## 🔍 API Endpoints Overview

### Public API (Requires API Key)
- `POST /api/v1/ocr` - Upload and process document
- `GET /api/v1/jobs/{id}` - Get job status and results
- `GET /api/v1/usage` - Get usage statistics

### Dashboard API (Requires Authentication)
- `GET /api/dashboard/stats` - Dashboard statistics
- `POST /api/dashboard/upload` - Upload via web interface
- `GET /api/jobs/review-queue` - Jobs needing review
- `POST /api/jobs/{id}/corrections` - Submit corrections

### Admin API (Requires Admin Role)
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/jobs` - Job management
- `POST /api/export/training-data` - Export training data

### Webhook API
- `POST /api/webhooks` - Register webhook
- `GET /api/webhooks` - List webhooks
- `DELETE /api/webhooks/{id}` - Delete webhook

## 📊 Performance Requirements

### Minimum Hardware
- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 10 GB free space
- **Network**: Stable internet connection

### Recommended Hardware
- **CPU**: 4+ cores, 2.5+ GHz
- **RAM**: 8+ GB
- **Storage**: 50+ GB SSD
- **Network**: High-speed internet for API calls

### Scalability Considerations
- **Database**: Connection pooling configured
- **File Storage**: Local storage (can be upgraded to cloud storage)
- **Processing**: Async job processing
- **Rate Limiting**: Configured per user plan

## 🔒 Security Requirements

### Authentication & Authorization
- API key authentication for external access
- Session-based authentication for web interface
- Role-based access control (user/admin)
- Rate limiting per API key

### Data Protection
- TLS encryption for all HTTP traffic
- Database connection encryption
- Secure session management
- Input validation and sanitization

### Compliance Features
- Audit logging for all user actions
- Data retention policies
- GDPR-compliant data export/deletion
- PII redaction capabilities (configurable)

## 🧪 Testing Requirements

### Test Data
- Sample documents for each document type
- Test images in various formats
- PDF documents with multiple pages
- Low-quality scans for testing

### Testing Tools
- Unit tests for all services
- Integration tests for API endpoints
- End-to-end tests for complete workflows
- Performance tests for load handling

## 📈 Monitoring & Logging

### Metrics Tracked
- Processing throughput (documents/hour)
- Average processing time per document type
- Error rates by processor type
- Cost per document processed
- User activity and quota usage

### Logging Requirements
- Application logs (info, warn, error)
- API request/response logs
- Database query logs (development)
- Webhook delivery logs
- User action audit logs

## 🔄 Backup & Recovery

### Data Backup
- Database backups (daily recommended)
- Configuration file backups
- User-uploaded file backups (if stored locally)
- Training data exports

### Recovery Procedures
- Database restoration procedures
- Application deployment rollback
- Configuration recovery
- Data migration procedures

This comprehensive requirements document ensures all dependencies and configurations are properly set up for the production-grade OCR service.
