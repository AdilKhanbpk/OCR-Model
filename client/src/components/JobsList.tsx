import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FileImage, Download, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Job {
  id: string;
  filename: string;
  type?: string;
  status: string;
  pages?: number;
  confidence?: string;
  error?: string;
  createdAt: string;
  rawText?: string;
}

interface JobsListProps {
  jobs: Job[];
  onViewJob?: (job: Job) => void;
  onDownloadJob?: (job: Job) => void;
}

export default function JobsList({ jobs, onViewJob, onDownloadJob }: JobsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getFileIcon = (type: string) => {
    return type === 'pdf' ? (
      <FileText className="w-5 h-5 text-blue-600" />
    ) : (
      <FileImage className="w-5 h-5 text-green-600" />
    );
  };

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No jobs yet</h3>
          <p className="text-muted-foreground">
            Upload your first document to get started with OCR processing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Jobs</CardTitle>
        <Button variant="ghost" size="sm" data-testid="view-all-jobs">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {jobs.map((job, index) => (
            <div
              key={job.id}
              className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${
                index !== jobs.length - 1 ? 'border-b border-border' : ''
              }`}
              data-testid={`job-item-${job.id}`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getFileIcon(job.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {job.filename}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </span>
                    {job.pages && job.pages > 1 && (
                      <>
                        <span>•</span>
                        <span>{job.pages} pages</span>
                      </>
                    )}
                    {job.confidence && (
                      <>
                        <span>•</span>
                        <span>{Math.round(parseFloat(job.confidence))}% confidence</span>
                      </>
                    )}
                  </div>
                  {job.error && (
                    <p className="text-sm text-destructive mt-1">{job.error}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge variant={getStatusVariant(job.status)} className="flex items-center space-x-1">
                  {getStatusIcon(job.status)}
                  <span className="capitalize">{job.status}</span>
                </Badge>

                <div className="flex items-center space-x-1">
                  {job.status === 'completed' && onViewJob && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewJob(job)}
                      data-testid={`view-job-${job.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {job.status === 'completed' && onDownloadJob && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownloadJob(job)}
                      data-testid={`download-job-${job.id}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
