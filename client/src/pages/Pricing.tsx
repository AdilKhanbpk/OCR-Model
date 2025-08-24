import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import PricingCard from '@/components/PricingCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

const pricingPlans = [
  {
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Perfect for getting started with OCR',
    features: [
      '50 pages per month',
      'Basic OCR processing',
      'API access',
      'Email support',
      'Standard processing speed'
    ],
    buttonText: 'Get Started Free',
    buttonVariant: 'outline' as const,
    popular: false
  },
  {
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'Best for growing businesses and developers',
    features: [
      '2,000 pages per month',
      'Advanced OCR processing',
      'Webhook support',
      'Priority support',
      'Custom field extraction',
      'Faster processing',
      'Higher rate limits (30 RPM)'
    ],
    buttonText: 'Upgrade to Pro',
    popular: true
  },
  {
    name: 'Business',
    price: 99,
    period: 'month',
    description: 'For enterprise-scale document processing',
    features: [
      '10,000 pages per month',
      'Everything in Pro',
      'Team management',
      'SSO integration',
      'Dedicated support',
      'Priority queue',
      'Custom integrations',
      'SLA guarantees'
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'secondary' as const,
    popular: false
  }
];

const comparisonFeatures = [
  {
    feature: 'Pages per month',
    free: '50',
    pro: '2,000',
    business: '10,000',
  },
  {
    feature: 'File size limit',
    free: '10 MB',
    pro: '25 MB',
    business: '50 MB',
  },
  {
    feature: 'Rate limiting',
    free: '10 RPM',
    pro: '30 RPM',
    business: '60 RPM',
  },
  {
    feature: 'API access',
    free: true,
    pro: true,
    business: true,
  },
  {
    feature: 'Multi-language OCR',
    free: true,
    pro: true,
    business: true,
  },
  {
    feature: 'Webhook support',
    free: false,
    pro: true,
    business: true,
  },
  {
    feature: 'Custom field extraction',
    free: false,
    pro: true,
    business: true,
  },
  {
    feature: 'Team management',
    free: false,
    pro: false,
    business: true,
  },
  {
    feature: 'SSO integration',
    free: false,
    pro: false,
    business: true,
  },
  {
    feature: 'Support level',
    free: 'Email',
    pro: 'Priority',
    business: 'Dedicated',
  },
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isYearly, setIsYearly] = useState(false);

  const handleSelectPlan = (plan: any) => {
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }

    if (plan.name === 'Free') {
      toast({
        title: 'Already on Free plan',
        description: 'You are currently using the Free plan.',
      });
      return;
    }

    if (plan.name === 'Business') {
      toast({
        title: 'Contact Sales',
        description: 'Please contact our sales team for Business plan pricing.',
      });
      return;
    }

    // Redirect to subscription page
    window.location.href = '/subscribe';
  };

  const renderFeatureValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-400 mx-auto" />
      );
    }
    return <span className="text-center">{value}</span>;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-12 h-6 rounded-full p-0 ${isYearly ? 'bg-primary' : 'bg-muted'}`}
              data-testid="billing-toggle"
            >
              <div
                className={`absolute w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </Button>
            <span className={`text-sm ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="text-sm text-green-600 font-medium">Save 20%</span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan, index) => (
            <PricingCard
              key={index}
              plan={{
                ...plan,
                price: isYearly && plan.price > 0 ? Math.round(plan.price * 0.8 * 12) : plan.price,
                period: isYearly && plan.price > 0 ? 'year' : plan.period,
              }}
              onSelect={handleSelectPlan}
              currentPlan={user?.plan}
            />
          ))}
        </div>

        {/* Feature Comparison Table */}
        <Card className="mb-16">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-foreground">
                      Features
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-foreground">
                      Free
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-foreground">
                      Pro
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-foreground">
                      Business
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comparisonFeatures.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/25">
                      <td className="px-6 py-4 text-sm text-foreground font-medium">
                        {item.feature}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground text-center">
                        {renderFeatureValue(item.free)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground text-center">
                        {renderFeatureValue(item.pro)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground text-center">
                        {renderFeatureValue(item.business)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                What counts as a page?
              </h3>
              <p className="text-muted-foreground">
                Each image uploaded counts as one page. For PDFs, each page in the document counts separately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                What languages are supported?
              </h3>
              <p className="text-muted-foreground">
                We support 100+ languages including English, Urdu, Arabic, Chinese, and many more.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Is there a free trial?
              </h3>
              <p className="text-muted-foreground">
                Yes, our Free plan gives you 50 pages per month with no time limit and no credit card required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
