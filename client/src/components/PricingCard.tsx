import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PricingPlan {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonVariant?: 'default' | 'outline' | 'secondary';
}

interface PricingCardProps {
  plan: PricingPlan;
  onSelect?: (plan: PricingPlan) => void;
  currentPlan?: string;
}

export default function PricingCard({ plan, onSelect, currentPlan }: PricingCardProps) {
  const { isAuthenticated } = useAuth();
  const isCurrentPlan = currentPlan?.toLowerCase() === plan.name.toLowerCase();

  return (
    <Card className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
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
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          
          <Button
            variant={isCurrentPlan ? 'secondary' : (plan.buttonVariant || 'default')}
            className={`w-full ${plan.popular ? 'shadow-lg hover:shadow-xl' : ''}`}
            onClick={() => onSelect?.(plan)}
            disabled={isCurrentPlan}
            data-testid={`select-plan-${plan.name.toLowerCase()}`}
          >
            {isCurrentPlan ? 'Current Plan' : plan.buttonText}
          </Button>

          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground mt-4">
              Sign up required to get started
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
