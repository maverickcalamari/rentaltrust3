import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  linkText?: string;
  linkHref?: string;
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  linkText,
  linkHref,
  onClick
}: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {linkText && (
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            {linkHref ? (
              <a 
                href={linkHref} 
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                {linkText}
              </a>
            ) : (
              <button 
                onClick={onClick} 
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                {linkText}
              </button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
