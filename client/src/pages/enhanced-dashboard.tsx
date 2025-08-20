import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Building2, 
  Users, 
  CreditCard, 
  AlertCircle, 
  Plus, 
  UserPlus,
  TrendingUp,
  Calendar,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import EnhancedStatCard from "@/components/dashboard/enhanced-stat-card";
import { FilterBar, FilterState } from "@/components/ui/filter-bar";
import { DetailsDrawer } from "@/components/ui/details-drawer";
import { InvoiceGenerator } from "@/components/invoices/invoice-generator";
import Layout from "@/components/layout/layout";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useFilters } from "@/hooks/use-filters";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { subDays, format } from 'date-fns';

export default function EnhancedDashboard() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_view')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch properties for filter
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name')
        .eq('organization_id', user?.user_metadata?.organization_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch units for filter
  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_number, property_id')
        .in('property_id', properties?.map(p => p.id) || []);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!properties,
  });

  const {
    filters,
    updateFilters,
  } = useFilters([], {
    searchFields: [],
  });

  // Generate mock sparkline data
  const generateSparklineData = (baseValue: number, variance: number = 0.1) => {
    return Array.from({ length: 30 }, (_, i) => ({
      value: baseValue + (Math.random() - 0.5) * baseValue * variance
    }));
  };

  // Calculate deltas (mock data)
  const calculateDelta = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const kpiData = useMemo(() => {
    if (!dashboardData) return [];

    return [
      {
        id: 'properties',
        title: 'Properties',
        value: dashboardData.properties_count || 0,
        icon: Building2,
        iconColor: 'text-primary-600',
        iconBgColor: 'bg-primary-100',
        sparklineData: generateSparklineData(dashboardData.properties_count || 0, 0.05),
        delta30d: calculateDelta(dashboardData.properties_count || 0, (dashboardData.properties_count || 0) * 0.95),
        delta90d: calculateDelta(dashboardData.properties_count || 0, (dashboardData.properties_count || 0) * 0.9),
        trendData: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
          value: (dashboardData.properties_count || 0) + Math.floor(Math.random() * 3) - 1
        })),
        contributors: [
          { name: 'Maple Apartments', value: 4, percentage: 40 },
          { name: 'Oak Street Complex', value: 3, percentage: 30 },
          { name: 'Pine View Condos', value: 3, percentage: 30 },
        ],
        quickActions: [
          { label: 'Add New Property', onClick: () => {} },
          { label: 'View All Properties', onClick: () => {} },
          { label: 'Property Performance Report', onClick: () => {} },
        ]
      },
      {
        id: 'tenants',
        title: 'Active Tenants',
        value: dashboardData.tenants_count || 0,
        icon: Users,
        iconColor: 'text-green-600',
        iconBgColor: 'bg-green-100',
        sparklineData: generateSparklineData(dashboardData.tenants_count || 0, 0.08),
        delta30d: calculateDelta(dashboardData.tenants_count || 0, (dashboardData.tenants_count || 0) * 0.92),
        delta90d: calculateDelta(dashboardData.tenants_count || 0, (dashboardData.tenants_count || 0) * 0.85),
        trendData: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
          value: (dashboardData.tenants_count || 0) + Math.floor(Math.random() * 5) - 2
        })),
        contributors: [
          { name: 'New Leases', value: 8, percentage: 50 },
          { name: 'Renewals', value: 6, percentage: 37.5 },
          { name: 'Transfers', value: 2, percentage: 12.5 },
        ],
        quickActions: [
          { label: 'Add New Tenant', onClick: () => {} },
          { label: 'View All Tenants', onClick: () => {} },
          { label: 'Lease Expiration Report', onClick: () => {} },
        ]
      },
      {
        id: 'revenue',
        title: 'Monthly Revenue',
        value: formatCurrency(dashboardData.monthly_revenue || 0),
        icon: CreditCard,
        iconColor: 'text-blue-600',
        iconBgColor: 'bg-blue-100',
        sparklineData: generateSparklineData(dashboardData.monthly_revenue || 0, 0.12),
        delta30d: calculateDelta(dashboardData.monthly_revenue || 0, (dashboardData.monthly_revenue || 0) * 0.88),
        delta90d: calculateDelta(dashboardData.monthly_revenue || 0, (dashboardData.monthly_revenue || 0) * 0.82),
        trendData: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
          value: (dashboardData.monthly_revenue || 0) + (Math.random() - 0.5) * (dashboardData.monthly_revenue || 0) * 0.2
        })),
        contributors: [
          { name: 'Rent Payments', value: 24000, percentage: 85 },
          { name: 'Late Fees', value: 800, percentage: 3 },
          { name: 'Other Income', value: 3200, percentage: 12 },
        ],
        quickActions: [
          { label: 'Generate Invoices', onClick: () => {} },
          { label: 'View Payment History', onClick: () => {} },
          { label: 'Revenue Report', onClick: () => {} },
        ]
      },
      {
        id: 'overdue',
        title: 'Overdue Payments',
        value: formatCurrency(dashboardData.overdue_amount || 0),
        icon: AlertCircle,
        iconColor: 'text-red-600',
        iconBgColor: 'bg-red-100',
        sparklineData: generateSparklineData(dashboardData.overdue_amount || 0, 0.3),
        delta30d: calculateDelta(dashboardData.overdue_amount || 0, (dashboardData.overdue_amount || 0) * 1.2),
        delta90d: calculateDelta(dashboardData.overdue_amount || 0, (dashboardData.overdue_amount || 0) * 1.5),
        trendData: Array.from({ length: 30 }, (_, i) => ({
          date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
          value: Math.max(0, (dashboardData.overdue_amount || 0) + (Math.random() - 0.7) * (dashboardData.overdue_amount || 0) * 0.5)
        })),
        contributors: [
          { name: 'Unit 101 - Maple Apts', value: 1200, percentage: 40 },
          { name: 'Unit 205 - Oak Complex', value: 950, percentage: 32 },
          { name: 'Unit 304 - Pine View', value: 850, percentage: 28 },
        ],
        quickActions: [
          { label: 'Send Reminders', onClick: () => {} },
          { label: 'Apply Late Fees', onClick: () => {} },
          { label: 'Contact Tenants', onClick: () => {} },
        ]
      },
    ];
  }, [dashboardData]);

  const handleKPIClick = (kpiId: string) => {
    setSelectedKPI(kpiId);
    setDrawerOpen(true);
  };

  const selectedKPIData = kpiData.find(kpi => kpi.id === selectedKPI);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Global Filter Bar */}
        <FilterBar
          filters={filters}
          onFiltersChange={updateFilters}
          properties={properties || []}
          units={units || []}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
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

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi) => (
            <EnhancedStatCard
              key={kpi.id}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              iconColor={kpi.iconColor}
              iconBgColor={kpi.iconBgColor}
              sparklineData={kpi.sparklineData}
              delta30d={kpi.delta30d}
              delta90d={kpi.delta90d}
              onClick={() => handleKPIClick(kpi.id)}
            />
          ))}
        </div>

        {/* Invoice Generator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InvoiceGenerator className="lg:col-span-1" />
          
          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Due This Week</p>
                  <p className="text-xl font-bold">12 Invoices</p>
                  <p className="text-xs text-gray-500">{formatCurrency(14400)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Collection Rate</p>
                  <p className="text-xl font-bold">94.2%</p>
                  <p className="text-xs text-green-600">+2.1% vs last month</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Open Tickets</p>
                  <p className="text-xl font-bold">7</p>
                  <p className="text-xs text-orange-600">3 urgent</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Drawer */}
        {selectedKPIData && (
          <DetailsDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            title={selectedKPIData.title}
            description={`Detailed analysis for ${selectedKPIData.title.toLowerCase()}`}
            trendData={selectedKPIData.trendData}
            contributors={selectedKPIData.contributors}
            quickActions={selectedKPIData.quickActions}
          />
        )}
      </div>
    </Layout>
  );
}