import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Clock,
  Target,
  Search
} from 'lucide-react';

export default function OCRForPDFs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">OCR Service Pro</h1>
                  <p className="text-sm text-gray-500">PDF Text Extraction</p>
                </div>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/ocr-for-images" className="text-gray-600 hover:text-gray-900">Image OCR</Link>
              <Link href="/ocr-for-invoices" className="text-gray-600 hover:text-gray-900">Invoice OCR</Link>
              <Link href="/ocr-for-id-cards" className="text-gray-600 hover:text-gray-900">ID Card OCR</Link>
              <Link href="/dashboard">
                <Button>Try Now</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Convert PDF to Text with
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent"> Advanced OCR</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Extract text from scanned PDFs, multi-page documents, and image-based PDFs. 
              Create searchable PDFs with our enterprise-grade OCR technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload PDF Now
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                <FileText className="w-5 h-5 mr-2" />
                View Demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Multi-page Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span>Searchable PDFs</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span>Batch Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Secure & Private</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Professional PDF OCR Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to extract text from PDFs and create searchable documents.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle>Multi-page Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Process entire PDF documents with hundreds of pages. Maintain page structure and formatting.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle>Searchable PDFs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Create searchable PDFs with invisible text layer. Perfect for archiving and document management.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-yellow-600" />
                </div>
                <CardTitle>Layout Preservation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Maintain original document layout, tables, and formatting in the extracted text output.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How to Convert PDF to Text
            </h2>
            <p className="text-xl text-gray-600">
              Simple process to extract text from any PDF document
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload PDF</h3>
              <p className="text-gray-600">
                Upload your scanned PDF or image-based PDF document.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">OCR Processing</h3>
              <p className="text-gray-600">
                Our AI analyzes each page and extracts all readable text.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Review & Edit</h3>
              <p className="text-gray-600">
                Review extracted text and make corrections if needed.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="text-xl font-semibold mb-2">Download</h3>
              <p className="text-gray-600">
                Get your text in multiple formats or as a searchable PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perfect for Every PDF OCR Need
            </h2>
            <p className="text-xl text-gray-600">
              From business documents to academic papers, we handle it all
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Scanned Documents', desc: 'Convert scanned papers and forms to editable text' },
              { title: 'Legal Documents', desc: 'Extract text from contracts, agreements, and legal papers' },
              { title: 'Academic Papers', desc: 'Digitize research papers and academic publications' },
              { title: 'Business Reports', desc: 'Convert business reports and presentations to text' },
              { title: 'Historical Documents', desc: 'Preserve and digitize historical records and archives' },
              { title: 'Technical Manuals', desc: 'Extract text from technical documentation and manuals' },
            ].map((useCase, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{useCase.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Convert Your PDFs to Text?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join professionals who trust our PDF OCR service for accurate text extraction.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
              <Upload className="w-5 h-5 mr-2" />
              Start Converting PDFs
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900">OCR Service Pro</span>
              </div>
              <p className="text-gray-600">
                Professional PDF OCR service for accurate text extraction and searchable PDF creation.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Services</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/ocr-for-images" className="hover:text-gray-900">Image OCR</Link></li>
                <li><Link href="/ocr-for-pdfs" className="hover:text-gray-900">PDF OCR</Link></li>
                <li><Link href="/ocr-for-invoices" className="hover:text-gray-900">Invoice OCR</Link></li>
                <li><Link href="/ocr-for-id-cards" className="hover:text-gray-900">ID Card OCR</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
              <ul className="space-y-2 text-gray-600">
                <li>Multi-page Processing</li>
                <li>Searchable PDFs</li>
                <li>Layout Preservation</li>
                <li>Batch Processing</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/about" className="hover:text-gray-900">About</Link></li>
                <li><Link href="/contact" className="hover:text-gray-900">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-gray-900">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-gray-900">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2024 OCR Service Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
