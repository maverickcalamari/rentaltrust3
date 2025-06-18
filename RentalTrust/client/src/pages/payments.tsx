import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PaymentTable from "@/components/dashboard/payment-table";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Plus, Download, CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Payments() {
  const [_, setLocation] = useLocation();
  const [viewPaymentDetails, setViewPaymentDetails] = useState<any | null>(null);
  const { toast } = useToast();
  
  // Get query parameters for filtering
  const queryParams = new URLSearchParams(window.location.search);
  const filterParam = queryParams.get('filter');
  
  // Fetch payments data
  const { data: payments, isLoading, error } = useQuery({
    queryKey: ["/api/payments"],
  });
  
  if (error) {
    toast({
      title: "Error loading payments",
      description: "Failed to load payment data. Please try again.",
      variant: "destructive",
    });
  }
  
  // Filter payments based on URL param if provided
  const filteredPayments = payments?.filter(payment => {
    if (!filterParam) return true;
    return payment.status === filterParam;
  });
  
  // Calculate payment statistics
  const calculateStats = () => {
    if (!payments) return {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      paidPercent: 0
    };
    
    const total = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const paid = payments.filter(p => p.status === 'paid')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const pending = payments.filter(p => p.status === 'pending')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    const overdue = payments.filter(p => p.status === 'overdue')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    
    const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;
    
    return { total, paid, pending, overdue, paidPercent };
  };
  
  const stats = calculateStats();
  
  // Handle payment actions
  const handleViewPayment = (payment: any) => {
    setViewPaymentDetails(payment);
  };
  
  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your payment data is being exported",
    });
  };
  
  return (
    <Layout title="Payments" description="Track and manage rental payments">
      <div className="max-w-7xl mx-auto">
        {/* Payment Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Payments</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(stats.total)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">All payments tracked</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Paid</CardDescription>
              <CardTitle className="text-2xl text-green-600">{formatCurrency(stats.paid)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">{stats.paidPercent}% of total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">{formatCurrency(stats.pending)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Due soon</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Overdue</CardDescription>
              <CardTitle className="text-2xl text-red-600">{formatCurrency(stats.overdue)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Need attention</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end mb-6">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Payments
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Payment
            </Button>
          </div>
        </div>
        
        {/* Payment Table */}
        <PaymentTable 
          payments={filteredPayments || []}
          title="All Payments"
          onViewPayment={handleViewPayment}
          onExport={handleExport}
          isLoading={isLoading}
        />
        
        {/* Payment Details Dialog */}
        <Dialog open={!!viewPaymentDetails} onOpenChange={(open) => !open && setViewPaymentDetails(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                Viewing payment information for {viewPaymentDetails?.tenant?.user?.firstName} {viewPaymentDetails?.tenant?.user?.lastName}
              </DialogDescription>
            </DialogHeader>
            
            {viewPaymentDetails && (
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-primary" />
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold">{formatCurrency(Number(viewPaymentDetails.amount))}</h3>
                  <p className="text-sm text-gray-500">
                    {viewPaymentDetails.status === 'paid' ? 'Paid on ' : 'Due on '}
                    {new Date(viewPaymentDetails.paymentDate || viewPaymentDetails.dueDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Tenant</p>
                    <p className="text-sm">
                      {viewPaymentDetails.tenant.user.firstName} {viewPaymentDetails.tenant.user.lastName}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Property</p>
                    <p className="text-sm">
                      {viewPaymentDetails.tenant.unit.property.name}, Unit {viewPaymentDetails.tenant.unit.unitNumber}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-sm">
                      {new Date(viewPaymentDetails.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm">
                      {viewPaymentDetails.status.charAt(0).toUpperCase() + viewPaymentDetails.status.slice(1)}
                    </p>
                  </div>
                  
                  {viewPaymentDetails.paymentMethod && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Payment Method</p>
                      <p className="text-sm">
                        {viewPaymentDetails.paymentMethod}
                      </p>
                    </div>
                  )}
                  
                  {viewPaymentDetails.notes && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm">
                        {viewPaymentDetails.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter className="flex space-x-2 justify-end">
              {viewPaymentDetails?.status === 'pending' && (
                <Button variant="outline">
                  Mark as Paid
                </Button>
              )}
              <Button onClick={() => setViewPaymentDetails(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
