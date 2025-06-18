import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Home, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  FileText,
  Bell
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TenantPortal() {
  const { user } = useAuth();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const { toast } = useToast();
  
  // Fetch tenant portal data
  const { data: portalData, isLoading, error } = useQuery({
    queryKey: ["/api/tenant-portal"],
    enabled: !!user && user.userType === "tenant",
  });
  
  if (error) {
    toast({
      title: "Error loading portal",
      description: "Failed to load tenant portal data. Please try again.",
      variant: "destructive",
    });
  }
  
  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return await apiRequest("POST", `/api/payments/${paymentId}/process`, { paymentMethod });
    },
    onSuccess: () => {
      toast({
        title: "Payment successful",
        description: "Your payment has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-portal"] });
      setPaymentDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Payment failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle payment processing
  const handleProcessPayment = () => {
    if (selectedPayment) {
      processPaymentMutation.mutate(selectedPayment.id);
    }
  };
  
  // Open payment dialog with selected payment
  const openPaymentDialog = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentDialogOpen(true);
  };
  
  // Calculate lease status
  const calculateLeaseStatus = () => {
    if (!portalData) return { status: 'unknown', label: 'Unknown', color: '' };
    
    const now = new Date();
    const startDate = new Date(portalData.tenant.leaseStartDate);
    const endDate = new Date(portalData.tenant.leaseEndDate);
    
    if (now < startDate) {
      return { 
        status: 'upcoming', 
        label: 'Upcoming',
        color: 'bg-blue-100 text-blue-800' 
      };
    } else if (now > endDate) {
      return { 
        status: 'expired', 
        label: 'Expired',
        color: 'bg-red-100 text-red-800' 
      };
    } else {
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 30) {
        return { 
          status: 'expiring-soon', 
          label: `Expiring Soon (${daysRemaining} days)`,
          color: 'bg-yellow-100 text-yellow-800'
        };
      }
      return { 
        status: 'active', 
        label: 'Active',
        color: 'bg-green-100 text-green-800'
      };
    }
  };
  
  const leaseStatus = calculateLeaseStatus();
  
  // Get upcoming and due payments
  const getUpcomingPayments = () => {
    if (!portalData) return [];
    
    return portalData.payments.filter(payment => 
      payment.status === 'pending' || payment.status === 'overdue'
    ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };
  
  const upcomingPayments = getUpcomingPayments();
  
  return (
    <div className="h-screen flex flex-col bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <h1 className="ml-2 text-xl font-semibold text-primary">RentEZ</h1>
        </div>
        
        {user && (
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2 relative">
              <Bell className="h-5 w-5" />
              {portalData?.notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
            
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary-100 text-primary-700">
                {user.firstName[0]}{user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="ml-2 text-sm font-medium">{user.firstName} {user.lastName}</span>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading your tenant portal...</p>
          </div>
        ) : !portalData ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Home className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Tenant profile not found</h3>
              <p className="text-gray-500 mb-4">We couldn't find your tenant profile. Please contact your landlord.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.firstName}!</h1>
              <p className="text-gray-500">Manage your rental and payments</p>
            </div>
            
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Payment Due Card */}
              {upcomingPayments.length > 0 && (
                <Card className={upcomingPayments[0].status === 'overdue' ? 'border-red-300' : ''}>
                  <CardHeader className="pb-2">
                    <CardDescription>
                      {upcomingPayments[0].status === 'overdue' ? 'Overdue Payment' : 'Upcoming Payment'}
                    </CardDescription>
                    <CardTitle className="text-2xl">{formatCurrency(Number(upcomingPayments[0].amount))}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      Due on {formatDate(upcomingPayments[0].dueDate)}
                      {upcomingPayments[0].status === 'overdue' && (
                        <Badge variant="outline" className="ml-2 bg-red-100 text-red-800 border-transparent">
                          Overdue
                        </Badge>
                      )}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => openPaymentDialog(upcomingPayments[0])}
                    >
                      Pay Now
                    </Button>
                  </CardFooter>
                </Card>
              )}
              
              {/* Lease Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Lease Status</CardDescription>
                  <CardTitle className="text-lg">
                    <Badge variant="outline" className={`${leaseStatus.color} border-transparent`}>
                      {leaseStatus.label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm flex items-center text-gray-600 mb-1">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    From {formatDate(portalData.tenant.leaseStartDate)}
                  </p>
                  <p className="text-sm flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    To {formatDate(portalData.tenant.leaseEndDate)}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    View Lease
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Landlord Contact Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Your Landlord</CardDescription>
                  <CardTitle className="text-lg">{portalData.landlord.firstName} {portalData.landlord.lastName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm flex items-center text-gray-600 mb-1">
                    <Mail className="h-4 w-4 mr-1 text-gray-400" />
                    <a href={`mailto:${portalData.landlord.email}`} className="text-primary-600 hover:underline">
                      {portalData.landlord.email}
                    </a>
                  </p>
                  {portalData.landlord.phone && (
                    <p className="text-sm flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-1 text-gray-400" />
                      <a href={`tel:${portalData.landlord.phone}`} className="text-primary-600 hover:underline">
                        {portalData.landlord.phone}
                      </a>
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Contact Landlord
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Tabs for Payments and Property */}
            <Tabs defaultValue="payments" className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="property">My Rental</TabsTrigger>
              </TabsList>
              
              {/* Payments Tab */}
              <TabsContent value="payments" className="mt-6">
                <Card>
                  <CardHeader className="px-6 py-4 border-b border-gray-200">
                    <CardTitle className="text-base font-medium">Payment History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portalData.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.dueDate)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(Number(payment.amount))}</TableCell>
                            <TableCell>
                              {payment.status === 'paid' ? (
                                <Badge variant="outline" className="flex items-center space-x-1 bg-green-100 text-green-800 border-transparent">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Paid</span>
                                </Badge>
                              ) : payment.status === 'pending' ? (
                                <Badge variant="outline" className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 border-transparent">
                                  <Clock className="h-3 w-3" />
                                  <span>Pending</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="flex items-center space-x-1 bg-red-100 text-red-800 border-transparent">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Overdue</span>
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {payment.paymentDate ? formatDate(payment.paymentDate) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {payment.status === 'paid' ? (
                                <Button variant="ghost" size="sm" className="h-8">
                                  <Download className="h-4 w-4 mr-2" />
                                  Receipt
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8"
                                  onClick={() => openPaymentDialog(payment)}
                                >
                                  Pay Now
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Property Tab */}
              <TabsContent value="property" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Property Details</CardTitle>
                      <CardDescription>
                        Information about your rental property
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start">
                        <Home className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium">{portalData.property.name}</h3>
                          <p className="text-sm text-gray-600">{portalData.property.address}</p>
                          <p className="text-sm text-gray-600">{portalData.property.city}, {portalData.property.state} {portalData.property.zip}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <DollarSign className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium">Rent Information</h3>
                          <p className="text-sm text-gray-600">
                            Monthly Rent: {formatCurrency(Number(portalData.unit.monthlyRent))}
                          </p>
                          <p className="text-sm text-gray-600">
                            Due on day {portalData.tenant.rentDueDay} of each month
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Unit Details</CardTitle>
                      <CardDescription>
                        Information about your specific unit
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium mb-1">Unit Number</h3>
                          <p className="text-sm text-gray-600">{portalData.unit.unitNumber}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-1">Size</h3>
                          <p className="text-sm text-gray-600">{portalData.unit.sqft || 'N/A'} sq ft</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-1">Bedrooms</h3>
                          <p className="text-sm text-gray-600">{portalData.unit.bedrooms}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-1">Bathrooms</h3>
                          <p className="text-sm text-gray-600">{portalData.unit.bathrooms}</p>
                        </div>
                      </div>
                      
                      {portalData.unit.description && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium mb-1">Description</h3>
                          <p className="text-sm text-gray-600">{portalData.unit.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
      
      {/* Payment Dialog */}
      {selectedPayment && (
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make a Payment</DialogTitle>
              <DialogDescription>
                Complete your rent payment securely
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 mb-2">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{formatCurrency(Number(selectedPayment.amount))}</h3>
                <p className="text-sm text-gray-500">
                  Due on {formatDate(selectedPayment.dueDate)}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-md text-sm">
                <p className="font-medium mb-2">Payment Summary</p>
                <div className="flex justify-between">
                  <span>Rent</span>
                  <span>{formatCurrency(Number(selectedPayment.amount))}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Processing Fee</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(Number(selectedPayment.amount))}</span>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleProcessPayment}
                disabled={processPaymentMutation.isPending}
              >
                {processPaymentMutation.isPending ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
