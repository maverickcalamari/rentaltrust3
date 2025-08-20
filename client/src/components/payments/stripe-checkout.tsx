import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripeCheckoutProps {
  invoiceId: string;
  amount: number;
  description: string;
  onSuccess?: () => void;
}

export function StripeCheckout({ invoiceId, amount, description, onSuccess }: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach'>('card');
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          amount: Math.round(amount * 100), // Convert to cents
          paymentMethod,
        }),
      });

      const { clientSecret, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe Checkout
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: clientSecret,
      });

      if (stripeError) {
        throw stripeError;
      }

    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Amount Due</span>
            <span className="text-lg font-bold">{formatCurrency(amount)}</span>
          </div>
          <p className="text-xs text-gray-500">{description}</p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={paymentMethod === 'card' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('card')}
              className="flex items-center justify-center"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Credit Card
            </Button>
            <Button
              variant={paymentMethod === 'ach' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('ach')}
              className="flex items-center justify-center"
            >
              <Banknote className="h-4 w-4 mr-2" />
              Bank Transfer
            </Button>
          </div>

          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              {paymentMethod === 'card' ? 'Instant processing' : 'ACH: 3-5 business days'}
            </Badge>
          </div>
        </div>

        <Button 
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay {formatCurrency(amount)} with {paymentMethod === 'card' ? 'Card' : 'Bank Transfer'}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Secure payment powered by Stripe. Your payment information is encrypted and secure.
        </p>
      </CardContent>
    </Card>
  );
}