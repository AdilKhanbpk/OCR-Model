import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import Layout from '@/components/Layout';
import FileUpload from '@/components/FileUpload';
import StatsCard from '@/components/StatsCard';
import JobsList from '@/components/JobsList';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, TrendingUp, CheckCircle, Crown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);

  const { data: dashboardData, isLoading: isDashboardLoading, error } = useQuery<{
    usage: {
      plan: string;
      pagesUsed: number;
      pagesLimit: number;
      requestCount: number;
      percentUsed: number;
      daysRemaining: number;
    };
    recentJobs: Array<{
      id: string;
      filename: string;
      status: string;
      createdAt: string;
      pages?: number;
      confidence?: string;
    }>;
  }>({
    queryKey: ['/api/dashboard/stats'],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Handle API errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  const handleUploadComplete = (result: any) => {
    toast({
      title: 'Upload completed',
      description: `Document processed successfully with ${result.confidence}% confidence.`,
    });
  };

  const handleViewJob = (job: any) => {
    setSelectedJob(job);
    setIsJobDialogOpen(true);
  };

  const handleDownloadJob = (job: any) => {
    if (job.rawText) {
      const blob = new Blob([job.rawText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.filename}_extracted_text.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading || isDashboardLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const usage = dashboardData?.usage;
  const recentJobs = dashboardData?.recentJobs || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">OCR Dashboard</h1>
          <p className="text-muted-foreground">
            Upload images or PDFs and extract text with advanced OCR processing
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Pages Used"
            value={usage?.pagesUsed || 0}
            icon={FileText}
            iconColor="bg-primary/10 text-primary"
            progress={{
              value: usage?.pagesUsed || 0,
              max: usage?.pagesLimit || 50,
            }}
          />
          <StatsCard
            title="API Requests"
            value={usage?.requestCount || 0}
            icon={TrendingUp}
            iconColor="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
            trend={{
              value: "+12% from last month",
              isPositive: true,
            }}
          />
          <StatsCard
            title="Success Rate"
            value="99.7%"
            icon={CheckCircle}
            iconColor="bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
            subtitle="Excellent performance"
          />
          <StatsCard
            title="Current Plan"
            value={usage?.plan || 'Free'}
            icon={Crown}
            iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
            subtitle="Manage Subscription"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* File Upload */}
          <FileUpload onUploadComplete={handleUploadComplete} />

          {/* Recent Jobs */}
          <JobsList
            jobs={recentJobs}
            onViewJob={handleViewJob}
            onDownloadJob={handleDownloadJob}
          />
        </div>

        {/* Usage Warning */}
        {usage && usage.percentUsed >= 80 && (
          <Card className="mt-8 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    {usage.percentUsed >= 90 ? 'Quota Almost Exhausted' : 'Approaching Quota Limit'}
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    You've used {usage.pagesUsed} of {usage.pagesLimit} pages this month ({usage.percentUsed}%).
                    {usage.percentUsed >= 90 && ' Consider upgrading your plan to avoid service interruption.'}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <a href="/pricing">Upgrade Plan</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Job Details Dialog */}
      <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Job Details</span>
              <Badge variant="outline">{selectedJob?.status}</Badge>
            </DialogTitle>
            <DialogDescription>
              File: {selectedJob?.filename} • 
              Pages: {selectedJob?.pages} • 
              Confidence: {selectedJob?.confidence ? `${Math.round(parseFloat(selectedJob.confidence))}%` : 'N/A'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-4">
              {selectedJob.rawText && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Extracted Text</h4>
                  <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="text-sm text-foreground whitespace-pre-wrap">
                      {selectedJob.rawText}
                    </pre>
                  </div>
                </div>
              )}

              {selectedJob.structuredData && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Structured Data</h4>
                  <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                    <pre className="text-sm text-foreground">
                      {JSON.stringify(selectedJob.structuredData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedJob.error && (
                <div>
                  <h4 className="font-medium text-destructive mb-2">Error</h4>
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                    <p className="text-sm text-destructive">{selectedJob.error}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsJobDialogOpen(false)}>
                  Close
                </Button>
                {selectedJob.rawText && (
                  <Button onClick={() => handleDownloadJob(selectedJob)}>
                    Download Text
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
