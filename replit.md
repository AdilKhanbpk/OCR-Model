# OCR SaaS Application

## Overview

This is a production-ready OCR (Optical Character Recognition) SaaS application that provides both a web interface and REST API for document text extraction. The application integrates with Google Cloud Vision API to process images and PDFs, supporting multiple languages including English and Urdu. It features tiered subscription plans, API key management, usage tracking, and Stripe payment integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: TailwindCSS with CSS custom properties for theming (light/dark modes)
- **State Management**: TanStack Query for server state management and data fetching
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth integration with session-based authentication using express-session
- **API Structure**: RESTful API with separate routes for web dashboard and API endpoints
- **Middleware**: Custom authentication, rate limiting, and file upload handling
- **File Processing**: Multer for multipart form handling with memory storage

### Data Storage Solutions
- **Database**: PostgreSQL via Neon Database (@neondatabase/serverless)
- **ORM**: Drizzle ORM with connection pooling
- **Session Storage**: PostgreSQL table-based session storage using connect-pg-simple
- **Schema Management**: Drizzle migrations with shared schema definitions

### Authentication and Authorization
- **Primary Auth**: Replit OIDC integration with OpenID Connect
- **API Authentication**: Bearer token-based API key system with SHA-256 hashing
- **Session Management**: Express session with PostgreSQL persistence
- **Role-based Access**: User roles (user, admin) with middleware protection
- **Rate Limiting**: Plan-based request rate limiting (free: 10 RPM, pro: 30 RPM, business: 60 RPM)

### Core OCR Service Architecture
- **OCR Provider**: Google Cloud Vision API integration
- **Processing Types**: IMAGE_ANNOTATION and DOCUMENT_TEXT_DETECTION
- **File Support**: Images (JPEG, PNG, GIF, WebP), PDFs, and TIFF files
- **Language Support**: Multi-language processing with language hints
- **Job Processing**: Asynchronous job queue with status tracking (pending, processing, completed, failed)

### Payment and Subscription System
- **Payment Processor**: Stripe integration with webhook support
- **Plan Tiers**: Free (50 pages/month), Pro (2,000 pages/month), Business (10,000 pages/month)
- **Usage Tracking**: Monthly quota management with usage analytics
- **Billing**: Subscription-based billing with customer portal integration

## External Dependencies

### Third-party Services
- **Google Cloud Vision API**: OCR processing and document text detection
- **Stripe**: Payment processing, subscription management, and billing
- **Neon Database**: Managed PostgreSQL hosting
- **Replit Auth**: OIDC-based authentication provider

### Key Libraries and Frameworks
- **@google-cloud/vision**: Google Cloud Vision API client
- **@stripe/stripe-js** and **@stripe/react-stripe-js**: Stripe payment integration
- **drizzle-orm**: TypeScript ORM with PostgreSQL adapter
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **zod**: Runtime type validation and schema definition
- **multer**: File upload middleware for Express
- **passport**: Authentication middleware with OpenID Connect strategy

### Development and Build Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Server-side bundling for production
- **TailwindCSS**: Utility-first CSS framework
- **Drizzle-kit**: Database migration and introspection tools