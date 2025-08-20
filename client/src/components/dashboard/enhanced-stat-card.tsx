import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DivideIcon as LucideIcon } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";
import { DeltaIndicator } from "@/components/ui/delta-indicator";

interface EnhancedStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  sparklineData: Array<{ value: number }>;
  delta30d: number;
  delta90d: number;
  onClick?: () => void;
  className?: string;
}

export default function EnhancedStatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  sparklineData,
  delta30d,
  delta90d,
  onClick,
  className
}: EnhancedStatCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("flex-shrink-0 rounded-lg p-2", iconBgColor)}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
          <div className="flex-1 ml-3">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
        </div>
        
        <div className="mb-3">
          <Sparkline 
            data={sparklineData} 
            color={iconColor.includes('primary') ? '#3B82F6' : iconColor.includes('green') ? '#10B981' : '#F59E0B'} 
            height={32} 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <DeltaIndicator value={delta30d} period="30d" />
          <DeltaIndicator value={delta90d} period="90d" />
        </div>
      </CardContent>
    </Card>
  );
}