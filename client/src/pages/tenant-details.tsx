import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { 
  User,
  Mail,
  Phone,
  Home,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Layout from "@/components/layout/layout";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TenantDetails() {
  const params = useParams();
  const [_, setLocation] = useLocation();
  const tenantId = parseInt(params.id);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch tenant details
  const { data: tenantData, isLoading, error } = useQuery({
    queryKey: [`/api/tenants/${tenantId}`],
    enabled: !isNaN(tenantId),
  });
  
  if (error) {
    toast({
      title: "Error loading tenant",
      description: "Failed to load tenant details. Please try again.",
      variant: "destructive",
    });
  }
  
  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/tenants/${tenantId}`);
    },
    onSuccess: () => {
      toast({
        title: "Tenant deleted",
        description: "The tenant has been successfully deactivated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      setLocation("/tenants");
    },
    onError: (error) => {
      toast({
        title: "Error deleting tenant",
        description: error.message || "Failed to delete tenant. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle tenant deletion
  const handleDeleteTenant = () => {
    deleteTenantMutation.mutate();
    setDeleteDialogOpen(false);
  };
  
  // Calculate lease status
  const calculateLeaseStatus = () => {
    if (!tenantData) return { status: 'unknown', label: 'Unknown' };
    
    const now = new Date();
    const startDate = new Date(tenantData.leaseStartDate);
    const endDate = new Date(tenantData.leaseEndDate);
    
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
  
  // Get payment status icon
  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading tenant details...</p>
          </div>
        ) : !tenantData ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <User className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Tenant not found</h3>
              <p className="text-gray-500 mb-4">The tenant you're looking for doesn't exist or you don't have access</p>
              <Link href="/tenants">
                <Button>Back to Tenants</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tenant Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-xl">
                    {getInitials(tenantData.user.firstName, tenantData.user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {tenantData.user.firstName} {tenantData.user.lastName}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Tenant at {tenantData.property.name}, Unit {tenantData.unit.unitNumber}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`ml-4 ${tenantData.isActive 
                    ? "bg-green-100 text-green-800 hover:bg-green-200 border-transparent" 
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent"}`}
                >
                  {tenantData.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Tenant
                </Button>
                <Button 
                  variant="destructive" 
                  className="gap-2"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
            
            {/* Tenant Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <a href={`mailto:${tenantData.user.email}`} className="text-sm text-primary-600 hover:underline">
                        {tenantData.user.email}
                      </a>
                    </div>
                  </div>
                  
                  {tenantData.user.phone && (
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <a href={`tel:${tenantData.user.phone}`} className="text-sm text-primary-600 hover:underline">
                          {tenantData.user.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start">
                    <Home className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Property & Unit</p>
                      <p className="text-sm text-gray-600">{tenantData.property.name}</p>
                      <p className="text-sm text-gray-600">Unit {tenantData.unit.unitNumber}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lease Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Lease Period</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(tenantData.leaseStartDate)} to {formatDate(tenantData.leaseEndDate)}
                      </p>
                      <Badge variant="outline" className={`mt-1 ${leaseStatus.color} border-transparent`}>
                        {leaseStatus.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Rent</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(Number(tenantData.unit.monthlyRent))} per month
                      </p>
                      <p className="text-sm text-gray-600">
                        Due on day {tenantData.rentDueDay} of each month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Status</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Paid</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(
                              tenantData.payments.filter(p => p.status === 'paid')
                                .reduce((sum, p) => sum + Number(p.amount), 0)
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Pending</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(
                              tenantData.payments.filter(p => p.status === 'pending')
                                .reduce((sum, p) => sum + Number(p.amount), 0)
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Overdue</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(
                              tenantData.payments.filter(p => p.status === 'overdue')
                                .reduce((sum, p) => sum + Number(p.amount), 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button variant="outline" className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Create Payment
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Tabs for Payments and Lease */}
            <Tabs defaultValue="payments" className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="payments">Payment History</TabsTrigger>
                <TabsTrigger value="lease">Lease Details</TabsTrigger>
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
                          <TableHead>Payment Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenantData.payments.length > 0 ? (
                          tenantData.payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{formatDate(payment.dueDate)}</TableCell>
                              <TableCell>
                                {payment.paymentDate ? formatDate(payment.paymentDate) : '-'}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(Number(payment.amount))}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getPaymentStatusIcon(payment.status)}
                                  <span className="capitalize">{payment.status}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {payment.paymentMethod || '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="link" className="h-auto p-0">View Details</Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              No payment history found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Lease Tab */}
              <TabsContent value="lease" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Lease Details</CardTitle>
                    <CardDescription>
                      Details of the current lease agreement
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Lease Period</h3>
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">Start: {formatDate(tenantData.leaseStartDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">End: {formatDate(tenantData.leaseEndDate)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Payment Terms</h3>
                        <div className="flex items-center space-x-2 mb-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">Monthly rent: {formatCurrency(Number(tenantData.unit.monthlyRent))}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">Due on: Day {tenantData.rentDueDay} of each month</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Property Details</h3>
                      <div className="flex items-start space-x-2 mb-1">
                        <Home className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm">{tenantData.property.name}</p>
                          <p className="text-sm">{tenantData.property.address}</p>
                          <p className="text-sm">{tenantData.property.city}, {tenantData.property.state} {tenantData.property.zip}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Unit Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Unit Number</p>
                          <p className="text-sm font-medium">{tenantData.unit.unitNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Bedrooms</p>
                          <p className="text-sm font-medium">{tenantData.unit.bedrooms}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Bathrooms</p>
                          <p className="text-sm font-medium">{tenantData.unit.bathrooms}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Square Feet</p>
                          <p className="text-sm font-medium">{tenantData.unit.sqft || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t flex justify-between">
                    <Button variant="outline">Download Lease</Button>
                    <Button>Renew Lease</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Delete Tenant Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to deactivate this tenant?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark {tenantData.user.firstName} {tenantData.user.lastName} as inactive. 
                    Their lease and payment history will be preserved, but they will no longer appear 
                    in active tenant lists.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteTenant}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </Layout>
  );
}
