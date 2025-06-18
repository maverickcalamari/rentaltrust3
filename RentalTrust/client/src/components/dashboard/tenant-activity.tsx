import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Payment } from "@shared/schema";
import { Link } from "wouter";

interface TenantActivity extends Payment {
  tenant: {
    user: {
      firstName: string;
      lastName: string;
    };
    unit: {
      unitNumber: string;
      property: {
        name: string;
      };
    };
  };
}

interface TenantActivityListProps {
  activities: TenantActivity[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export default function TenantActivityList({
  activities,
  onLoadMore,
  hasMore = false,
  isLoading = false
}: TenantActivityListProps) {
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="text-sm font-medium text-success-500 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Payment received
          </span>
        );
      case 'pending':
        return (
          <span className="text-sm font-medium text-warning-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Payment pending
          </span>
        );
      case 'overdue':
        return (
          <span className="text-sm font-medium text-danger-500 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Payment overdue
          </span>
        );
      default:
        return (
          <span className="text-sm font-medium text-gray-900">
            {status}
          </span>
        );
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-3 border-b border-gray-200">
        <CardTitle className="text-lg font-medium">Recent Tenant Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No recent activities</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <li key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Avatar>
                      <AvatarFallback className="bg-primary-100 text-primary-800">
                        {activity.tenant.user.firstName[0]}
                        {activity.tenant.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.tenant.user.firstName} {activity.tenant.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.tenant.unit.property.name}, Unit {activity.tenant.unit.unitNumber}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-col items-end">
                      {getStatusText(activity.status)}
                      <span className="text-xs text-gray-500">
                        {formatDate(activity.paymentDate || activity.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {(hasMore || activities.length > 0) && (
        <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-center">
          {onLoadMore ? (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary-600 font-medium hover:text-primary-500"
              onClick={onLoadMore}
              disabled={!hasMore || isLoading}
            >
              {isLoading ? "Loading..." : "Load more"}
            </Button>
          ) : (
            <Link href="/payments">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary-600 font-medium hover:text-primary-500"
              >
                View all
              </Button>
            </Link>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
