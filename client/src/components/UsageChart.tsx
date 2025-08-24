import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar } from 'lucide-react';
import { useState } from 'react';

interface UsageData {
  plan: string;
  pagesUsed: number;
  pagesLimit: number;
  requestCount: number;
  percentUsed: number;
  daysRemaining: number;
}

interface UsageChartProps {
  usage?: UsageData;
}

export default function UsageChart({ usage }: UsageChartProps) {
  const [timeframe, setTimeframe] = useState('30D');

  if (!usage) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading usage data...</p>
        </CardContent>
      </Card>
    );
  }

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600 dark:text-red-400';
    if (percent >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usage Analytics</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="capitalize">
                {usage.plan} Plan
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Main Usage Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {usage.pagesUsed.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Pages Used</div>
                <div className="text-xs text-muted-foreground mt-1">
                  of {usage.pagesLimit.toLocaleString()} total
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {usage.requestCount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">API Requests</div>
                <div className="text-xs text-muted-foreground mt-1">
                  This month
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getUsageColor(usage.percentUsed)}`}>
                  {usage.percentUsed}%
                </div>
                <div className="text-sm text-muted-foreground">Quota Used</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {usage.daysRemaining} days remaining
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly Usage</span>
                <span className="font-medium">
                  {usage.pagesUsed.toLocaleString()} / {usage.pagesLimit.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(usage.percentUsed)}`}
                  style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
                />
              </div>
              {usage.percentUsed >= 80 && (
                <div className="flex items-center justify-between text-sm">
                  <span className={getUsageColor(usage.percentUsed)}>
                    {usage.percentUsed >= 90 ? 'Critical: ' : 'Warning: '}
                    Approaching quota limit
                  </span>
                  <Button variant="link" size="sm" className="h-auto p-0">
                    Upgrade Plan
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Usage Trend</CardTitle>
            <div className="flex space-x-2">
              {['30D', '90D', '1Y'].map((period) => (
                <Button
                  key={period}
                  variant={timeframe === period ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeframe(period)}
                  data-testid={`timeframe-${period}`}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Usage chart will be displayed here
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Showing {timeframe} usage trends
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Images Processed</span>
                <span className="font-semibold">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">PDFs Processed</span>
                <span className="font-semibold">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Pages</span>
                <span className="font-semibold">{usage.pagesUsed.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Confidence</span>
                <span className="font-semibold text-green-600">97.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Language Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary rounded-full mr-3" />
                <span className="text-sm text-muted-foreground flex-1">English</span>
                <span className="text-sm font-medium">78%</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                <span className="text-sm text-muted-foreground flex-1">Urdu</span>
                <span className="text-sm font-medium">15%</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3" />
                <span className="text-sm text-muted-foreground flex-1">Arabic</span>
                <span className="text-sm font-medium">7%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" data-testid="export-csv">
              <Download className="w-4 h-4 mr-2" />
              Download CSV Report
            </Button>
            <Button variant="outline" className="flex-1" data-testid="export-pdf">
              <Download className="w-4 h-4 mr-2" />
              Usage Summary PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
