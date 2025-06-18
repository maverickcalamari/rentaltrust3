import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { 
  Building2, 
  Edit, 
  Trash2, 
  Plus, 
  Home, 
  User, 
  DollarSign,
  Bed,
  Bath,
  SquareIcon,
  Check,
  X
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Layout from "@/components/layout/layout";
import { formatCurrency, getInitials, formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PropertyDetails() {
  const params = useParams();
  const [_, setLocation] = useLocation();
  const propertyId = parseInt(params.id);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch property details
  const { data: property, isLoading, error } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !isNaN(propertyId),
  });
  
  if (error) {
    toast({
      title: "Error loading property",
      description: "Failed to load property details. Please try again.",
      variant: "destructive",
    });
  }
  
  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/properties/${propertyId}`);
    },
    onSuccess: () => {
      toast({
        title: "Property deleted",
        description: "The property has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setLocation("/properties");
    },
    onError: (error) => {
      toast({
        title: "Error deleting property",
        description: error.message || "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle property deletion
  const handleDeleteProperty = () => {
    deletePropertyMutation.mutate();
    setDeleteDialogOpen(false);
  };
  
  // Calculate occupancy rate
  const calculateOccupancyRate = () => {
    if (!property?.units || property.units.length === 0) return 0;
    const occupiedCount = property.units.filter(unit => unit.isOccupied).length;
    return Math.round((occupiedCount / property.units.length) * 100);
  };
  
  // Calculate monthly income
  const calculateMonthlyIncome = () => {
    if (!property?.units) return 0;
    return property.units.reduce((sum, unit) => {
      return sum + (unit.isOccupied ? Number(unit.monthlyRent) : 0);
    }, 0);
  };
  
  const occupancyRate = calculateOccupancyRate();
  const monthlyIncome = calculateMonthlyIncome();
  
  // Find all tenants for this property
  const getTenants = () => {
    // In a real app, this would be a separate API call
    // For now, we'll use mock data based on the units
    if (!property?.units) return [];
    
    return property.units
      .filter(unit => unit.isOccupied)
      .map((unit, index) => ({
        id: index + 1,
        user: {
          firstName: ['Sarah', 'Michael', 'Lisa', 'David', 'Emma'][index % 5],
          lastName: ['Johnson', 'Rodriguez', 'Washington', 'Chen', 'Miller'][index % 5],
          email: `tenant${index + 1}@example.com`
        },
        unit: {
          unitNumber: unit.unitNumber
        },
        leaseStartDate: new Date(2023, 0, 1).toISOString(),
        leaseEndDate: new Date(2023, 11, 31).toISOString(),
        rentDueDay: 1
      }));
  };
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading property details...</p>
          </div>
        ) : !property ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Building2 className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Property not found</h3>
              <p className="text-gray-500 mb-4">The property you're looking for doesn't exist or you don't have access</p>
              <Link href="/properties">
                <Button>Back to Properties</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Property Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-md bg-primary-100 flex items-center justify-center mr-4">
                  <Building2 className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{property.name}</h1>
                  <p className="text-sm text-gray-500">
                    {property.address}, {property.city}, {property.state} {property.zip}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={property.isActive 
                    ? "ml-4 bg-green-100 text-green-800 hover:bg-green-200 border-transparent" 
                    : "ml-4 bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent"
                  }
                >
                  {property.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Property
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
            
            {/* Property Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Units</CardDescription>
                  <CardTitle className="text-2xl">{property.totalUnits}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-500">
                    <Home className="h-4 w-4 mr-1 text-gray-400" />
                    {property.units.filter(u => u.isOccupied).length} occupied, 
                    {" "}{property.units.filter(u => !u.isOccupied).length} vacant
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Occupancy Rate</CardDescription>
                  <CardTitle className="text-2xl">{occupancyRate}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1 text-gray-400" />
                    {property.units.filter(u => u.isOccupied).length} tenants
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Monthly Income</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(monthlyIncome)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-500">
                    <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                    Avg {formatCurrency(monthlyIncome / (property.units.filter(u => u.isOccupied).length || 1))} per unit
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Tabs for Units and Tenants */}
            <Tabs defaultValue="units" className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="units">Units</TabsTrigger>
                <TabsTrigger value="tenants">Tenants</TabsTrigger>
              </TabsList>
              
              {/* Units Tab */}
              <TabsContent value="units" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                    <CardTitle className="text-base font-medium">Units</CardTitle>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Unit
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Unit #</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Rent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {property.units.map((unit) => (
                          <TableRow key={unit.id}>
                            <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                            <TableCell>
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Bed className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{unit.bedrooms} {unit.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Bath className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{unit.bathrooms} {unit.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}</span>
                                </div>
                                {unit.sqft && (
                                  <div className="flex items-center space-x-2">
                                    <SquareIcon className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">{unit.sqft} sq ft</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{formatCurrency(Number(unit.monthlyRent))}</div>
                              <div className="text-xs text-gray-500">per month</div>
                            </TableCell>
                            <TableCell>
                              {unit.isOccupied ? (
                                <Badge variant="outline" className="flex items-center space-x-1 bg-green-100 text-green-800 hover:bg-green-200 border-transparent">
                                  <Check className="h-3 w-3" />
                                  <span>Occupied</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="flex items-center space-x-1 bg-amber-100 text-amber-800 hover:bg-amber-200 border-transparent">
                                  <X className="h-3 w-3" />
                                  <span>Vacant</span>
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="ghost" size="sm" className="h-8 px-2">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!unit.isOccupied && (
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <UserPlus className="h-4 w-4" />
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
              
              {/* Tenants Tab */}
              <TabsContent value="tenants" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                    <CardTitle className="text-base font-medium">Tenants</CardTitle>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Tenant
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Unit #</TableHead>
                          <TableHead>Lease Period</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getTenants().length > 0 ? (
                          getTenants().map((tenant) => (
                            <TableRow key={tenant.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  <Avatar className="h-9 w-9 mr-3">
                                    <AvatarFallback className="bg-primary-100 text-primary-700">
                                      {getInitials(tenant.user.firstName, tenant.user.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{tenant.user.firstName} {tenant.user.lastName}</div>
                                    <div className="text-xs text-gray-500">{tenant.user.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                Unit {tenant.unit.unitNumber}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{formatDate(tenant.leaseStartDate)}</div>
                                <div className="text-xs text-gray-500">to {formatDate(tenant.leaseEndDate)}</div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="link" className="h-auto p-0">View Details</Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                              No tenants found for this property
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Delete Property Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this property?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the property
                    "{property.name}" and all associated units and tenant data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteProperty}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
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
