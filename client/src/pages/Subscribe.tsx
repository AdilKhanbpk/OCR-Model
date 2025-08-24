import { useState, useEffect } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, ArrowLeft } from 'lucide-react';

// Load Stripe (optional for now)
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to OCR Vision Pro!",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        data-testid="confirm-subscription"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Crown className="w-4 h-4 mr-2" />
            Subscribe to Pro
          </>
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (!stripePromise) {
      toast({
        title: "Billing Not Available",
        description: "Stripe billing is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }

    if (isAuthenticated) {
      // Create subscription as soon as the page loads
      apiRequest("POST", "/api/create-subscription", {})
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          toast({
            title: "Subscription Error",
            description: "Failed to initialize subscription. Please try again.",
            variant: "destructive",
          });
          console.error('Subscription creation error:', error);
        });
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!stripePromise) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center text-2xl">
                <Crown className="w-6 h-6 mr-2 text-yellow-500" />
                Billing Not Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground mb-4">
                Stripe billing is not configured. Please contact support to upgrade your plan.
              </p>
              <Button variant="outline" asChild className="w-full">
                <a href="/pricing">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Pricing
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!clientSecret) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Initializing subscription...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <a href="/pricing">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pricing
            </a>
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-4">Subscribe to Pro Plan</h1>
          <p className="text-muted-foreground">
            Upgrade to unlock advanced OCR features and higher usage limits.
          </p>
        </div>

        {/* Plan Summary */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-primary" />
              <span>Pro Plan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-bold text-foreground">$29</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ 2,000 pages per month</li>
              <li>✓ Advanced OCR processing</li>
              <li>✓ Webhook support</li>
              <li>✓ Priority support</li>
              <li>✓ Custom field extraction</li>
            </ul>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm />
            </Elements>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            🔒 Your payment information is secured by Stripe. We don't store your card details.
          </p>
          <p className="mt-2">
            You can cancel your subscription at any time from your dashboard.
          </p>
        </div>
      </div>
    </Layout>
  );
}
