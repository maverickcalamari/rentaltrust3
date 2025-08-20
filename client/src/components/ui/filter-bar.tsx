import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  Filter, 
  X, 
  Search 
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';

export interface FilterState {
  dateRange: DateRange | undefined;
  propertyId: string | null;
  unitId: string | null;
  tenantStatus: string | null;
  paymentStatus: string | null;
  search: string;
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  properties?: Array<{ id: string; name: string }>;
  units?: Array<{ id: string; unit_number: string; property_id: string }>;
}

export function FilterBar({ filters, onFiltersChange, properties = [], units = [] }: FilterBarProps) {
  const [location, setLocation] = useLocation();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Sync filters with URL
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.dateRange?.from) {
      params.set('from', format(filters.dateRange.from, 'yyyy-MM-dd'));
    }
    if (filters.dateRange?.to) {
      params.set('to', format(filters.dateRange.to, 'yyyy-MM-dd'));
    }
    if (filters.propertyId) params.set('property', filters.propertyId);
    if (filters.unitId) params.set('unit', filters.unitId);
    if (filters.tenantStatus) params.set('tenant_status', filters.tenantStatus);
    if (filters.paymentStatus) params.set('payment_status', filters.paymentStatus);
    if (filters.search) params.set('search', filters.search);

    const newUrl = params.toString() ? `${location.split('?')[0]}?${params.toString()}` : location.split('?')[0];
    if (newUrl !== location) {
      setLocation(newUrl);
    }
  }, [filters, location, setLocation]);

  // Load filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const fromDate = params.get('from');
    const toDate = params.get('to');
    
    const urlFilters: FilterState = {
      dateRange: fromDate && toDate ? {
        from: new Date(fromDate),
        to: new Date(toDate)
      } : undefined,
      propertyId: params.get('property'),
      unitId: params.get('unit'),
      tenantStatus: params.get('tenant_status'),
      paymentStatus: params.get('payment_status'),
      search: params.get('search') || '',
    };

    onFiltersChange(urlFilters);
  }, []);

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: undefined,
      propertyId: null,
      unitId: null,
      tenantStatus: null,
      paymentStatus: null,
      search: '',
    });
  };

  const removeFilter = (key: keyof FilterState) => {
    onFiltersChange({
      ...filters,
      [key]: key === 'search' ? '' : key === 'dateRange' ? undefined : null,
    });
  };

  const setQuickDateRange = (days: number) => {
    const to = new Date();
    const from = days === 30 ? subDays(to, 30) : subMonths(to, 3);
    onFiltersChange({
      ...filters,
      dateRange: { from, to }
    });
    setIsCalendarOpen(false);
  };

  const activeFilterCount = [
    filters.dateRange,
    filters.propertyId,
    filters.unitId,
    filters.tenantStatus,
    filters.paymentStatus,
    filters.search
  ].filter(Boolean).length;

  const filteredUnits = units.filter(unit => 
    !filters.propertyId || unit.property_id === filters.propertyId
  );

  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* Main Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Date Range */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, "LLL dd")} -{" "}
                    {format(filters.dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(filters.dateRange.from, "LLL dd, y")
                )
              ) : (
                "Pick a date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange(30)}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickDateRange(90)}
                >
                  Last 90 days
                </Button>
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange?.from}
              selected={filters.dateRange}
              onSelect={(range) => onFiltersChange({ ...filters, dateRange: range })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Property Filter */}
        <Select
          value={filters.propertyId || ''}
          onValueChange={(value) => onFiltersChange({ 
            ...filters, 
            propertyId: value || null,
            unitId: null // Reset unit when property changes
          })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Properties</SelectItem>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Unit Filter */}
        <Select
          value={filters.unitId || ''}
          onValueChange={(value) => onFiltersChange({ ...filters, unitId: value || null })}
          disabled={!filters.propertyId}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Units" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Units</SelectItem>
            {filteredUnits.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                Unit {unit.unit_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tenant Status Filter */}
        <Select
          value={filters.tenantStatus || ''}
          onValueChange={(value) => onFiltersChange({ ...filters, tenantStatus: value || null })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tenant Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Tenants</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Payment Status Filter */}
        <Select
          value={filters.paymentStatus || ''}
          onValueChange={(value) => onFiltersChange({ ...filters, paymentStatus: value || null })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Payments</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear All ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.dateRange && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.dateRange.from && filters.dateRange.to
                ? `${format(filters.dateRange.from, "MMM dd")} - ${format(filters.dateRange.to, "MMM dd")}`
                : 'Date range'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('dateRange')}
              />
            </Badge>
          )}
          
          {filters.propertyId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {properties.find(p => p.id === filters.propertyId)?.name || 'Property'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('propertyId')}
              />
            </Badge>
          )}
          
          {filters.unitId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Unit {units.find(u => u.id === filters.unitId)?.unit_number || ''}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('unitId')}
              />
            </Badge>
          )}
          
          {filters.tenantStatus && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.tenantStatus === 'active' ? 'Active Tenants' : 'Inactive Tenants'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('tenantStatus')}
              />
            </Badge>
          )}
          
          {filters.paymentStatus && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.paymentStatus.charAt(0).toUpperCase() + filters.paymentStatus.slice(1)} Payments
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('paymentStatus')}
              />
            </Badge>
          )}
          
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('search')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}