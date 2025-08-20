import { useState, useCallback, useMemo } from 'react';
import { FilterState } from '@/components/ui/filter-bar';
import { isWithinInterval, parseISO } from 'date-fns';

export function useFilters<T>(data: T[], filterConfig: {
  searchFields: (keyof T)[];
  dateField?: keyof T;
  propertyField?: keyof T;
  unitField?: keyof T;
  tenantStatusField?: keyof T;
  paymentStatusField?: keyof T;
}) {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    propertyId: null,
    unitId: null,
    tenantStatus: null,
    paymentStatus: null,
    search: '',
  });

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = filterConfig.searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(searchLower);
        });
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (filters.dateRange && filterConfig.dateField) {
        const itemDate = item[filterConfig.dateField];
        if (itemDate) {
          const date = typeof itemDate === 'string' ? parseISO(itemDate) : itemDate as Date;
          if (filters.dateRange.from && filters.dateRange.to) {
            if (!isWithinInterval(date, { 
              start: filters.dateRange.from, 
              end: filters.dateRange.to 
            })) {
              return false;
            }
          }
        }
      }

      // Property filter
      if (filters.propertyId && filterConfig.propertyField) {
        if (item[filterConfig.propertyField] !== filters.propertyId) return false;
      }

      // Unit filter
      if (filters.unitId && filterConfig.unitField) {
        if (item[filterConfig.unitField] !== filters.unitId) return false;
      }

      // Tenant status filter
      if (filters.tenantStatus && filterConfig.tenantStatusField) {
        const status = item[filterConfig.tenantStatusField];
        if (filters.tenantStatus === 'active' && !status) return false;
        if (filters.tenantStatus === 'inactive' && status) return false;
      }

      // Payment status filter
      if (filters.paymentStatus && filterConfig.paymentStatusField) {
        if (item[filterConfig.paymentStatusField] !== filters.paymentStatus) return false;
      }

      return true;
    });
  }, [data, filters, filterConfig]);

  const updateFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  return {
    filters,
    filteredData,
    updateFilters,
    hasActiveFilters: Object.values(filters).some(value => 
      value !== null && value !== undefined && value !== ''
    ),
  };
}