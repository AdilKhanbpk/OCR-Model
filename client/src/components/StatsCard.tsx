import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  progress?: {
    value: number;
    max: number;
  };
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  trend,
  progress,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground" data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {(trend || subtitle || progress) && (
          <div className="mt-4">
            {trend && (
              <span
                className={`text-sm ${
                  trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtitle && !trend && (
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            )}
            {progress && (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    of {progress.max.toLocaleString()} {title.toLowerCase()}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((progress.value / progress.max) * 100, 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
