import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

interface IncomeData {
  month: string;
  amount: number;
}

interface MonthlyIncomeChartProps {
  incomeData: IncomeData[];
  totalCollected?: number;
  averageMonthly?: number;
  onTimePercent?: number;
  projectedNext?: number;
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-sm">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-primary-600 font-semibold">
          {formatCurrency(payload[0].value as number)}
        </p>
      </div>
    );
  }

  return null;
};

export default function MonthlyIncomeChart({
  incomeData,
  totalCollected,
  averageMonthly,
  onTimePercent,
  projectedNext,
  isLoading = false
}: MonthlyIncomeChartProps) {
  const [timeRange, setTimeRange] = useState("6months");
  
  const chartData = !isLoading && incomeData && incomeData.length > 0 
    ? incomeData 
    : Array(6).fill(0).map((_, i) => ({
        month: format(new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000), "MMM ''yy"),
        amount: 0
      })).reverse();
  
  const timePeriodOptions = [
    { value: "6months", label: "Last 6 months" },
    { value: "12months", label: "Last 12 months" },
    { value: "ytd", label: "Year to date" }
  ];
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-medium">Monthly Income Overview</CardTitle>
        <Select
          defaultValue={timeRange}
          onValueChange={setTimeRange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {timePeriodOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="mt-2 text-sm text-gray-500">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value}`}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="amount" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Total Collected</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(totalCollected || 0)}
                </p>
                <p className="text-xs text-success-500 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  8.2% from last period
                </p>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Average Monthly</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(averageMonthly || 0)}
                </p>
                <p className="text-xs text-success-500 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  3.5% from last period
                </p>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">On-time Payments</p>
                <p className="text-xl font-semibold text-gray-900">{onTimePercent || 0}%</p>
                <p className="text-xs text-success-500 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  2.1% from last period
                </p>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Projected Next Month</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(projectedNext || 0)}
                </p>
                <p className="text-xs text-success-500 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  1.9% from current
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
