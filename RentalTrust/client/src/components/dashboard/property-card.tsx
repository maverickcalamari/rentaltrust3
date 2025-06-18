import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";

interface PropertyCardProps {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyIncome: number;
  isActive: boolean;
}

export default function PropertyCard({
  id,
  name,
  address,
  city,
  state,
  zip,
  totalUnits,
  occupiedUnits,
  monthlyIncome,
  isActive
}: PropertyCardProps) {
  const occupancyPercent = totalUnits > 0 
    ? Math.round((occupiedUnits / totalUnits) * 100) 
    : 0;
  
  return (
    <Card className="overflow-hidden border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-md bg-primary-100 flex items-center justify-center">
              <Home className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{name}</h3>
              <div className="ml-2 flex-shrink-0">
                {isActive ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 border-transparent">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {address}, {city}, {state} {zip}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500">Units</p>
                <p className="text-sm font-medium">{totalUnits}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Occupancy</p>
                <p className="text-sm font-medium">{occupancyPercent}%</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <div className="flex justify-between items-center w-full">
          <div className="text-sm">
            <span className="text-gray-500">Monthly Income:</span>
            <span className="font-medium text-gray-900 ml-1">
              {formatCurrency(monthlyIncome)}
            </span>
          </div>
          <Link href={`/properties/${id}`}>
            <Button 
              variant="link" 
              className="text-primary-600 hover:text-primary-700 p-0 h-auto"
            >
              Manage
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
