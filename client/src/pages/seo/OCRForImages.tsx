import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileImage, 
  Upload, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Star,
  Clock,
  Target
} from 'lucide-react';

export default function OCRForImages() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* SEO Meta Tags would be handled by a head manager */}
      
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileImage className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">OCR Service Pro</h1>
                  <p className="text-sm text-gray-500">Image Text Extraction</p>
                </div>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/ocr-for-pdfs" className="text-gray-600 hover:text-gray-900">PDF OCR</Link>
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
              Extract Text from Images with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI-Powered OCR</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Convert JPG, PNG, GIF, WebP, and TIFF images to editable text instantly. 
              Our advanced OCR technology supports 25+ languages with 99% accuracy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Image Now
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                <FileImage className="w-5 h-5 mr-2" />
                View Demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>99% Accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Secure Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span>Instant Results</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>25+ Languages</span>
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
              Why Choose Our Image OCR Service?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Advanced AI technology meets user-friendly design for the best image text extraction experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>High Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our AI-powered OCR achieves 99% accuracy on clear images and 95% on challenging documents.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Process images in under 3 seconds. Batch processing available for multiple images.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle>Multi-Language</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Supports 25+ languages including English, Spanish, French, German, Chinese, and more.
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
              How to Extract Text from Images
            </h2>
            <p className="text-xl text-gray-600">
              Simple 3-step process to convert your images to text
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Image</h3>
              <p className="text-gray-600">
                Drag and drop or click to upload your JPG, PNG, GIF, WebP, or TIFF image file.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
              <p className="text-gray-600">
                Our advanced OCR engine analyzes your image and extracts all readable text with high accuracy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Download Results</h3>
              <p className="text-gray-600">
                Get your extracted text in multiple formats: plain text, JSON, CSV, or searchable PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Formats */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Supported Image Formats
            </h2>
            <p className="text-xl text-gray-600">
              We support all major image formats for maximum compatibility
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {['JPG/JPEG', 'PNG', 'GIF', 'WebP', 'TIFF'].map((format) => (
              <div key={format} className="text-center p-6 border rounded-lg hover:shadow-md transition-shadow">
                <FileImage className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">{format}</h3>
                <p className="text-sm text-gray-600 mt-1">Fully Supported</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Extract Text from Your Images?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who trust our OCR service for accurate text extraction.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Upload className="w-5 h-5 mr-2" />
              Start Free Trial
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
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileImage className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900">OCR Service Pro</span>
              </div>
              <p className="text-gray-600">
                Professional OCR service for accurate text extraction from images and documents.
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
                <li>25+ Languages</li>
                <li>99% Accuracy</li>
                <li>Batch Processing</li>
                <li>API Access</li>
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
