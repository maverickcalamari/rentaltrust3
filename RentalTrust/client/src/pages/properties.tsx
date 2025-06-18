import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Building2, 
  Grid2X2, 
  List 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
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
import PropertyCard from "@/components/dashboard/property-card";
import Layout from "@/components/layout/layout";
import { cn } from "@/lib/utils";
import { Property } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Properties() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  // Fetch properties
  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });
  
  if (error) {
    toast({
      title: "Error loading properties",
      description: "Failed to load properties. Please try again.",
      variant: "destructive",
    });
  }
  
  // Filter properties based on search term
  const filteredProperties = properties?.filter(property => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      property.name.toLowerCase().includes(searchLower) ||
      property.address.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower) ||
      property.state.toLowerCase().includes(searchLower) ||
      property.zip.toLowerCase().includes(searchLower)
    );
  });
  
  // Calculate stats for each property
  const propertyCards = filteredProperties?.map(property => {
    // In a real application, this data would come from the API
    // For now, we'll use placeholder data
    const occupiedUnits = Math.min(Math.floor(Math.random() * property.totalUnits) + 1, property.totalUnits);
    const monthlyIncome = occupiedUnits * 1200; // Average $1200 per unit
    
    return {
      ...property,
      occupiedUnits,
      monthlyIncome
    };
  });
  
  return (
    <Layout title="Properties" description="Manage your rental properties">
      <div className="max-w-7xl mx-auto">
        {/* Action bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search properties..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-r-none border-r",
                  view === "grid" ? "bg-gray-100" : ""
                )}
                onClick={() => setView("grid")}
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-l-none",
                  view === "list" ? "bg-gray-100" : ""
                )}
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>All Properties</DropdownMenuItem>
                <DropdownMenuItem>Active Properties</DropdownMenuItem>
                <DropdownMenuItem>Inactive Properties</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link href="/properties/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Properties list/grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading properties...</p>
          </div>
        ) : filteredProperties?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Building2 className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No properties found</h3>
              <p className="text-gray-500 mb-4">Add your first property to get started</p>
              <Link href="/properties/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propertyCards?.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                name={property.name}
                address={property.address}
                city={property.city}
                state={property.state}
                zip={property.zip}
                totalUnits={property.totalUnits}
                occupiedUnits={property.occupiedUnits}
                monthlyIncome={property.monthlyIncome}
                isActive={property.isActive}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <CardTitle className="text-base font-medium">Properties List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Monthly Income</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyCards?.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-md bg-primary-100 flex items-center justify-center mr-3">
                            <Building2 className="h-4 w-4 text-primary-600" />
                          </div>
                          {property.name}
                        </div>
                      </TableCell>
                      <TableCell>{property.address}, {property.city}</TableCell>
                      <TableCell>
                        {property.occupiedUnits}/{property.totalUnits}
                      </TableCell>
                      <TableCell>
                        {property.isActive ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 border-transparent">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">${property.monthlyIncome}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/properties/${property.id}`}>
                          <Button variant="link" className="h-auto p-0">Manage</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
