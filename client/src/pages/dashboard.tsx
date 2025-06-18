import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Building2, Users, CreditCard, AlertCircle, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/dashboard/stat-card";
import PaymentTable from "@/components/dashboard/payment-table";
import PropertyCard from "@/components/dashboard/property-card";
import TenantActivityList from "@/components/dashboard/tenant-activity";
import MonthlyIncomeChart from "@/components/dashboard/income-chart";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard"],
    enabled: !!user && user.userType === "landlord",
  });
  
  if (error) {
    toast({
      title: "Error loading dashboard",
      description: "Failed to load dashboard data. Please try again.",
      variant: "destructive",
    });
  }
  
  // Calculate monthly income stats
  const calculateStats = () => {
    if (!dashboardData || !dashboardData.monthlyIncome) return {
      total: 0,
      average: 0,
      onTime: 0,
      projected: 0
    };
    
    const total = dashboardData.monthlyIncome.reduce((sum, month) => sum + month.amount, 0);
    const average = total / dashboardData.monthlyIncome.length || 0;
    
    // Assuming the last value in monthlyIncome is the most recent
    const lastMonth = dashboardData.monthlyIncome[dashboardData.monthlyIncome.length - 1]?.amount || 0;
    const projected = Math.round(lastMonth * 1.02); // 2% increase projection
    
    return {
      total,
      average,
      onTime: 94, // This would come from the backend in a real application
      projected
    };
  };
  
  const stats = calculateStats();
  
  // Mock functions for demonstration
  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your data is being exported to CSV",
    });
  };
  
  const handleViewPayment = (payment: any) => {
    setLocation(`/payments/${payment.id}`);
  };
  
  return (
    <Layout title="Landlord Dashboard" description="Overview of your rental properties and financial status">
      <div className="max-w-7xl mx-auto">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 md:absolute md:right-6 md:top-6">
          <Link href="/properties/new">
            <Button className="inline-flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </Link>
          <Link href="/tenants/new">
            <Button variant="outline" className="inline-flex items-center">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
          </Link>
        </div>

        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
            title="Properties"
            value={isLoading ? "..." : dashboardData?.propertiesCount || 0}
            icon={Building2}
            iconColor="text-primary-600"
            iconBgColor="bg-primary-100"
            linkText="View all"
            linkHref="/properties"
          />
          <StatCard
            title="Active Tenants"
            value={isLoading ? "..." : dashboardData?.tenantsCount || 0}
            icon={Users}
            iconColor="text-green-500"
            iconBgColor="bg-green-100"
            linkText="View all"
            linkHref="/tenants"
          />
          <StatCard
            title="Upcoming Payments"
            value={isLoading ? "..." : `$${dashboardData?.upcomingPaymentsTotal || 0}`}
            icon={CreditCard}
            iconColor="text-yellow-500"
            iconBgColor="bg-yellow-100"
            linkText="View details"
            linkHref="/payments"
          />
          <StatCard
            title="Overdue Payments"
            value={isLoading ? "..." : `$${dashboardData?.overduePaymentsTotal || 0}`}
            icon={AlertCircle}
            iconColor="text-red-500"
            iconBgColor="bg-red-100"
            linkText="View details"
            linkHref="/payments?filter=overdue"
          />
        </div>

        {/* Payment Status Section */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Status</h2>
          <PaymentTable 
            payments={dashboardData?.tenantActivity || []}
            onViewPayment={handleViewPayment}
            onExport={handleExport}
            isLoading={isLoading}
          />
        </div>

        {/* Properties and Tenant Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Properties Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Properties</h2>
              <Link href="/properties">
                <a className="text-sm font-medium text-primary-600 hover:text-primary-500">View all</a>
              </Link>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
                  Loading properties...
                </div>
              ) : dashboardData?.properties && dashboardData.properties.length > 0 ? (
                dashboardData.properties.slice(0, 3).map((property) => {
                  // Calculate occupancy and monthly income for the property
                  const occupiedUnits = property.units.filter(unit => unit.isOccupied).length;
                  const monthlyIncome = property.units.reduce((sum, unit) => {
                    return sum + (unit.isOccupied ? Number(unit.monthlyRent) : 0);
                  }, 0);
                  
                  return (
                    <PropertyCard
                      key={property.id}
                      id={property.id}
                      name={property.name}
                      address={property.address}
                      city={property.city}
                      state={property.state}
                      zip={property.zip}
                      totalUnits={property.totalUnits}
                      occupiedUnits={occupiedUnits}
                      monthlyIncome={monthlyIncome}
                      isActive={property.isActive}
                    />
                  );
                })
              ) : (
                <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
                  No properties found. Add your first property to get started.
                </div>
              )}
            </div>
          </div>

          {/* Tenants Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Tenant Activity</h2>
              <Link href="/tenants">
                <a className="text-sm font-medium text-primary-600 hover:text-primary-500">View all tenants</a>
              </Link>
            </div>
            <TenantActivityList 
              activities={dashboardData?.tenantActivity || []}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Monthly Income Overview */}
        <div className="mb-8">
          <MonthlyIncomeChart 
            incomeData={dashboardData?.monthlyIncome || []}
            totalCollected={stats.total}
            averageMonthly={stats.average}
            onTimePercent={stats.onTime}
            projectedNext={stats.projected}
            isLoading={isLoading}
          />
        </div>
      </div>
    </Layout>
  );
}
