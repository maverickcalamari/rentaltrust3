import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  Search, 
  Filter, 
  UserPlus,
  Users,
  Mail,
  Phone,
  Home,
  Calendar,
  Check,
  X
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Layout from "@/components/layout/layout";
import { formatDate, getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TenantWithDetails {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  unit: {
    id: number;
    unitNumber: string;
    property: {
      id: number;
      name: string;
    };
  };
  leaseStartDate: string;
  leaseEndDate: string;
  rentDueDay: number;
  isActive: boolean;
}

export default function Tenants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch tenants
  const { data: tenants, isLoading, error } = useQuery<TenantWithDetails[]>({
    queryKey: ["/api/tenants"],
  });
  
  if (error) {
    toast({
      title: "Error loading tenants",
      description: "Failed to load tenant data. Please try again.",
      variant: "destructive",
    });
  }
  
  // Filter tenants based on search term and status
  const filteredTenants = tenants?.filter(tenant => {
    // Status filter
    if (statusFilter) {
      if (statusFilter === "active" && !tenant.isActive) return false;
      if (statusFilter === "inactive" && tenant.isActive) return false;
    }
    
    // Search term filter
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      tenant.user.firstName.toLowerCase().includes(searchLower) ||
      tenant.user.lastName.toLowerCase().includes(searchLower) ||
      tenant.user.email.toLowerCase().includes(searchLower) ||
      tenant.unit.property.name.toLowerCase().includes(searchLower) ||
      tenant.unit.unitNumber.toLowerCase().includes(searchLower)
    );
  });
  
  // Function to check if lease is current
  const isLeaseActive = (endDate: string) => {
    return new Date(endDate) > new Date();
  };
  
  return (
    <Layout title="Tenants" description="Manage your property tenants">
      <div className="max-w-7xl mx-auto">
        {/* Action bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tenants..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {statusFilter ? `Filter: ${statusFilter}` : "Filter"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>All Tenants</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active Tenants</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>Inactive Tenants</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link href="/tenants/new">
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Tenants table */}
        <Card className="overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <CardTitle className="text-base font-medium">Tenants</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading tenants...</p>
              </div>
            ) : filteredTenants?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Users className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No tenants found</h3>
                <p className="text-gray-500 mb-4">Add your first tenant to get started</p>
                <Link href="/tenants/new">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Tenant
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property & Unit</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Lease Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants?.map((tenant) => (
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
                            <div className="text-xs text-gray-500">
                              Rent due: Day {tenant.rentDueDay}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start">
                          <Home className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <div className="text-sm">{tenant.unit.property.name}</div>
                            <div className="text-xs text-gray-500">Unit {tenant.unit.unitNumber}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                            <a href={`mailto:${tenant.user.email}`} className="hover:text-primary-600">
                              {tenant.user.email}
                            </a>
                          </div>
                          {tenant.user.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                              <a href={`tel:${tenant.user.phone}`} className="hover:text-primary-600">
                                {tenant.user.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <div className="text-sm">{formatDate(tenant.leaseStartDate)}</div>
                            <div className="text-xs text-gray-500">to {formatDate(tenant.leaseEndDate)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.isActive ? (
                          <Badge variant="outline" className="flex items-center bg-green-100 text-green-800 hover:bg-green-200 border-transparent">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent">
                            <X className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/tenants/${tenant.id}`}>
                          <Button variant="link" className="h-auto p-0">View Details</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
