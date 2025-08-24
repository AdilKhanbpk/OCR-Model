import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Rocket, 
  Book, 
  Check, 
  Languages, 
  FileText, 
  Code, 
  Receipt, 
  BarChart3, 
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  Heart
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Languages,
      title: 'Multi-Language Support',
      description: 'Extract text in 100+ languages including English, Urdu, Arabic, Chinese, and more with high accuracy.',
      color: 'bg-primary/10 text-primary'
    },
    {
      icon: FileText,
      title: 'PDF & Image Processing',
      description: 'Process images, multi-page PDFs, and TIFF files. Generate searchable PDFs with text overlay.',
      color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
    },
    {
      icon: Code,
      title: 'Developer-Friendly API',
      description: 'RESTful API with comprehensive documentation, SDKs, and webhook support for seamless integration.',
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
    },
    {
      icon: Receipt,
      title: 'Invoice & Receipt Extraction',
      description: 'Smart field extraction for invoices, receipts, and CNIC documents with structured JSON output.',
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
    },
    {
      icon: BarChart3,
      title: 'Usage Analytics',
      description: 'Detailed usage tracking, quota management, and analytics dashboard with exportable reports.',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'SOC 2 compliant, encrypted data transmission, rate limiting, and comprehensive audit logs.',
      color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
    }
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: 0,
      period: 'month',
      description: 'Perfect for getting started',
      features: [
        '50 pages per month',
        'Basic OCR processing',
        'API access',
        'Email support'
      ],
      buttonText: 'Get Started Free',
      popular: false
    },
    {
      name: 'Pro',
      price: 29,
      period: 'month',
      description: 'Best for growing businesses',
      features: [
        '2,000 pages per month',
        'Advanced OCR processing',
        'Webhook support',
        'Priority support',
        'Custom field extraction'
      ],
      buttonText: 'Upgrade to Pro',
      popular: true
    },
    {
      name: 'Business',
      price: 99,
      period: 'month',
      description: 'For enterprise needs',
      features: [
        '10,000 pages per month',
        'Everything in Pro',
        'Team management',
        'SSO integration',
        'Dedicated support'
      ],
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold text-foreground">OCR Vision</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/api/login" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="login-link">
                Sign In
              </a>
              <Button asChild data-testid="get-started-nav">
                <a href="/api/login">Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-purple-50/50 dark:to-purple-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Professional OCR API for{' '}
                <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Images & PDFs
                </span>
              </h1>
              <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
                Extract text from images and documents with Google Cloud Vision API. Support for English, Urdu, and 100+ languages. Fast, accurate, and developer-friendly.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all duration-200" data-testid="start-free-trial">
                  <a href="/api/login">
                    <Rocket className="w-5 h-5 mr-2" />
                    Start Free Trial
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild data-testid="view-docs">
                  <a href="#features">
                    <Book className="w-5 h-5 mr-2" />
                    View Documentation
                  </a>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  50 pages free monthly
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <Check className="w-4 h-4 text-green-500 mr-2" />
                  99.9% uptime SLA
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-card rounded-2xl shadow-2xl border border-border p-6">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Eye className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Dashboard Preview</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-xl p-4 border border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-foreground">Processing OCR...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Powerful OCR Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to extract text from images and documents with precision and speed.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade at any time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardContent className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <p className="text-muted-foreground mb-6">{plan.description}</p>
                    
                    <ul className="space-y-4 mb-8 text-left">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      variant={plan.popular ? 'default' : 'outline'}
                      className="w-full"
                      asChild
                      data-testid={`select-plan-${plan.name.toLowerCase()}`}
                    >
                      <a href="/api/login">{plan.buttonText}</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-foreground">2,847</div>
              <div className="text-sm text-muted-foreground">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-foreground">1.2M</div>
              <div className="text-sm text-muted-foreground">Documents Processed</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-foreground">99.8%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-foreground">24/7</div>
              <div className="text-sm text-muted-foreground">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers and businesses using OCR Vision for their document processing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all duration-200" data-testid="cta-start-free">
              <a href="/api/login">
                <Rocket className="w-5 h-5 mr-2" />
                Start Free Trial
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild data-testid="cta-contact-sales">
              <a href="/api/login">Contact Sales</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Eye className="h-8 w-8 text-primary mr-2" />
                <span className="text-xl font-bold text-foreground">OCR Vision</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Professional OCR API for images and PDFs with multi-language support and enterprise-grade security.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status Page</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 OCR Vision. All rights reserved.
            </p>
            <p className="text-muted-foreground text-sm mt-4 md:mt-0">
              Built with ❤️ for developers worldwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
