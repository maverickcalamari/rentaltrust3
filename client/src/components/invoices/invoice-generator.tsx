import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface InvoiceGeneratorProps {
  className?: string;
}

export function InvoiceGenerator({ className }: InvoiceGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateInvoicesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-monthly-invoices', {
        body: { runDate: new Date().toISOString() }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setLastRun(new Date());
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast({
        title: 'Invoices Generated',
        description: `Successfully generated ${data.invoicesCreated} invoices for ${data.leasesProcessed} active leases.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate invoices. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleGenerateInvoices = () => {
    setIsGenerating(true);
    generateInvoicesMutation.mutate();
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          Monthly Invoice Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Active Leases</p>
            <p className="text-lg font-semibold">24</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mx-auto mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-lg font-semibold">{formatCurrency(28800)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Due Today</p>
            <p className="text-lg font-semibold">8</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">Automated Generation</p>
              <p className="text-xs text-gray-500">
                Runs daily at 6:00 AM for leases due today
              </p>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
          
          {lastRun && (
            <p className="text-xs text-gray-500 mb-3">
              Last run: {lastRun.toLocaleDateString()} at {lastRun.toLocaleTimeString()}
            </p>
          )}
          
          <Button 
            onClick={handleGenerateInvoices}
            disabled={isGenerating || generateInvoicesMutation.isPending}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Run Invoice Generation Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}