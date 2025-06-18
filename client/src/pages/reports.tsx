import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon } from "lucide-react";
import Layout from "@/components/layout/layout";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Chart color palette
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Reports() {
  const [timeRange, setTimeRange] = useState("6months");
  const [activeTab, setActiveTab] = useState("income");
  const { toast } = useToast();
  
  // Fetch dashboard data which includes income info
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard"],
  });
  
  if (error) {
    toast({
      title: "Error loading reports",
      description: "Failed to load report data. Please try again.",
      variant: "destructive",
    });
  }
  
  const incomeData = dashboardData?.monthlyIncome || [];
  
  // Calculate totals for summary cards
  const calculateTotals = () => {
    if (!dashboardData) {
      return {
        totalIncome: 0,
        paidPercent: 0,
        occupancyRate: 0,
        pendingPayments: 0
      };
    }
    
    const totalIncome = incomeData.reduce((sum, month) => sum + month.amount, 0);
    
    // Calculate occupancy rate
    const totalUnits = dashboardData.properties.reduce((sum, property) => sum + property.totalUnits, 0);
    const occupiedUnits = dashboardData.properties.reduce((sum, property) => {
      return sum + property.units.filter(unit => unit.isOccupied).length;
    }, 0);
    
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    
    return {
      totalIncome,
      paidPercent: 94, // This would come from the backend
      occupancyRate,
      pendingPayments: dashboardData.upcomingPaymentsTotal,
    };
  };
  
  const totals = calculateTotals();
  
  // Generate mock data for the charts
  const generateOccupancyData = () => {
    // This would come from real data in production
    return [
      { name: "Occupied", value: totals.occupancyRate },
      { name: "Vacant", value: 100 - totals.occupancyRate }
    ];
  };
  
  const generatePropertyIncomeData = () => {
    if (!dashboardData?.properties) return [];
    
    return dashboardData.properties.map(property => {
      const monthlyIncome = property.units.reduce((sum, unit) => {
        return sum + (unit.isOccupied ? Number(unit.monthlyRent) : 0);
      }, 0);
      
      return {
        name: property.name,
        income: monthlyIncome
      };
    });
  };
  
  const handleExport = () => {
    toast({
      title: "Report export started",
      description: "Your report is being generated",
    });
  };
  
  return (
    <Layout title="Reports" description="View financial and occupancy reports for your properties">
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Income</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totals.totalIncome)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">For selected period</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>On-Time Payments</CardDescription>
              <CardTitle className="text-2xl">{totals.paidPercent}%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Payment reliability</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Occupancy Rate</CardDescription>
              <CardTitle className="text-2xl">{totals.occupancyRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Of total units</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Payments</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totals.pendingPayments)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500">Expected soon</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Report Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
        
        {/* Report Tabs & Charts */}
        <Card>
          <CardHeader className="pb-0">
            <Tabs defaultValue="income" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="income" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Income
                </TabsTrigger>
                <TabsTrigger value="occupancy" className="flex items-center">
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Occupancy
                </TabsTrigger>
                <TabsTrigger value="properties" className="flex items-center">
                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Properties
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500">Loading report data...</p>
              </div>
            ) : (
              <>
                {/* Income Tab */}
                {activeTab === "income" && (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={incomeData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis 
                          tickFormatter={(value) => `$${value}`}
                          width={80}
                        />
                        <Tooltip 
                          formatter={(value) => [`$${value}`, "Income"]}
                          labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {/* Occupancy Tab */}
                {activeTab === "occupancy" && (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={generateOccupancyData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {generateOccupancyData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Rate"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {/* Properties Tab */}
                {activeTab === "properties" && (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={generatePropertyIncomeData()}
                        layout="vertical"
                        margin={{
                          top: 20,
                          right: 30,
                          left: 100,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip 
                          formatter={(value) => [`$${value}`, "Monthly Income"]}
                        />
                        <Bar dataKey="income" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
