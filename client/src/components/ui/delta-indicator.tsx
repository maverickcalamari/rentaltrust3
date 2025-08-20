import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeltaIndicatorProps {
  value: number;
  period: '30d' | '90d';
  className?: string;
}

export function DeltaIndicator({ value, period, className }: DeltaIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  
  const colorClass = isPositive 
    ? 'text-green-600' 
    : isNegative 
    ? 'text-red-600' 
    : 'text-gray-400';

  return (
    <div className={cn('flex items-center text-xs', colorClass, className)}>
      <Icon className="h-3 w-3 mr-1" />
      <span className="font-medium">
        {isNeutral ? '0' : `${isPositive ? '+' : ''}${value.toFixed(1)}%`}
      </span>
      <span className="ml-1 text-gray-500">{period}</span>
    </div>
  );
}