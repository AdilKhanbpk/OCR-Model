import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit3, 
  Save,
  RotateCcw,
  FileText,
  Calendar,
  DollarSign,
  User,
  Building,
  Phone,
  Mail
} from 'lucide-react';

interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
  normalized?: any;
  fieldStatus: 'valid' | 'needs_review' | 'invalid';
  validationErrors?: string[];
}

interface ReviewJob {
  id: string;
  filename: string;
  docType: string;
  docTypeConfidence: number;
  status: string;
  extractedFields: {
    fields: ExtractedField[];
    overallConfidence: number;
    needsReview: boolean;
  };
  rawText: string;
  createdAt: string;
}

const fieldIcons: Record<string, any> = {
  invoice_number: FileText,
  invoice_date: Calendar,
  due_date: Calendar,
  total_amount: DollarSign,
  subtotal: DollarSign,
  tax: DollarSign,
  vendor_name: Building,
  bill_to_name: User,
  merchant_name: Building,
  receipt_date: Calendar,
  full_name: User,
  date_of_birth: Calendar,
  phone: Phone,
  email: Mail,
  default: FileText,
};

export default function ReviewQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<ReviewJob | null>(null);
  const [editingFields, setEditingFields] = useState<Record<string, string>>({});
  const [correctionNotes, setCorrectionNotes] = useState('');

  // Fetch jobs that need review
  const { data: reviewJobs, isLoading } = useQuery<ReviewJob[]>({
    queryKey: ['/api/jobs/review-queue'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Submit field corrections
  const submitCorrectionsMutation = useMutation({
    mutationFn: async (data: { jobId: string; corrections: any[]; notes: string }) => {
      const response = await fetch(`/api/jobs/${data.jobId}/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corrections: data.corrections, notes: data.notes }),
      });
      if (!response.ok) throw new Error('Failed to submit corrections');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Corrections submitted',
        description: 'Field corrections have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/review-queue'] });
      setSelectedJob(null);
      setEditingFields({});
      setCorrectionNotes('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit corrections',
        variant: 'destructive',
      });
    },
  });

  // Approve job without changes
  const approveJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/jobs/${jobId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve job');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Job approved',
        description: 'Job has been approved and marked as completed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/review-queue'] });
      setSelectedJob(null);
    },
  });

  const handleFieldEdit = (fieldName: string, value: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmitCorrections = () => {
    if (!selectedJob) return;

    const corrections = Object.entries(editingFields).map(([fieldName, correctedValue]) => {
      const originalField = selectedJob.extractedFields.fields.find(f => f.name === fieldName);
      return {
        fieldName,
        originalValue: originalField?.value || '',
        correctedValue,
        originalConfidence: originalField?.confidence || 0,
        correctionType: 'manual',
      };
    });

    submitCorrectionsMutation.mutate({
      jobId: selectedJob.id,
      corrections,
      notes: correctionNotes,
    });
  };

  const getFieldIcon = (fieldName: string) => {
    const IconComponent = fieldIcons[fieldName] || fieldIcons.default;
    return <IconComponent className="w-4 h-4" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      valid: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      needs_review: { variant: 'secondary', icon: AlertTriangle, color: 'text-yellow-600' },
      invalid: { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
    };

    const config = variants[status] || variants.needs_review;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      {/* Review Queue List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Review Queue ({reviewJobs?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {reviewJobs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <p>No jobs need review!</p>
                <p className="text-sm">All extractions are looking good.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewJobs?.map((job) => (
                  <Card 
                    key={job.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedJob?.id === job.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium truncate">{job.filename}</h4>
                          <p className="text-sm text-muted-foreground">
                            {job.docType} • {Math.round(job.docTypeConfidence * 100)}% confidence
                          </p>
                        </div>
                        <Badge variant="secondary">{job.extractedFields.fields.length} fields</Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Overall: {Math.round(job.extractedFields.overallConfidence * 100)}%</span>
                        <span>•</span>
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Review Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {selectedJob ? 'Review Details' : 'Select a job to review'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedJob ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {/* Job Info */}
                <div>
                  <h4 className="font-medium mb-2">Document Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Filename</Label>
                      <p className="font-mono">{selectedJob.filename}</p>
                    </div>
                    <div>
                      <Label>Document Type</Label>
                      <p>{selectedJob.docType} ({Math.round(selectedJob.docTypeConfidence * 100)}%)</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Extracted Fields */}
                <div>
                  <h4 className="font-medium mb-4">Extracted Fields</h4>
                  <div className="space-y-4">
                    {selectedJob.extractedFields.fields.map((field, index) => {
                      const isEditing = editingFields.hasOwnProperty(field.name);
                      const editValue = editingFields[field.name] || field.value;

                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getFieldIcon(field.name)}
                              <Label className="font-medium">
                                {field.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${getConfidenceColor(field.confidence)}`}>
                                {Math.round(field.confidence * 100)}%
                              </span>
                              {getStatusBadge(field.fieldStatus)}
                            </div>
                          </div>

                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editValue}
                                onChange={(e) => handleFieldEdit(field.name, e.target.value)}
                                placeholder="Enter corrected value"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newFields = { ...editingFields };
                                    delete newFields[field.name];
                                    setEditingFields(newFields);
                                  }}
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="font-mono text-sm bg-muted p-2 rounded">
                                {field.value || '(empty)'}
                              </p>
                              {field.normalized && (
                                <p className="text-xs text-muted-foreground">
                                  Normalized: {JSON.stringify(field.normalized)}
                                </p>
                              )}
                              {field.validationErrors && field.validationErrors.length > 0 && (
                                <div className="text-xs text-red-600">
                                  Issues: {field.validationErrors.join(', ')}
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFieldEdit(field.name, field.value)}
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Correction Notes */}
                <div>
                  <Label htmlFor="notes">Correction Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={correctionNotes}
                    onChange={(e) => setCorrectionNotes(e.target.value)}
                    placeholder="Add notes about the corrections made..."
                    className="mt-2"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmitCorrections}
                    disabled={Object.keys(editingFields).length === 0 || submitCorrectionsMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Submit Corrections ({Object.keys(editingFields).length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => approveJobMutation.mutate(selectedJob.id)}
                    disabled={approveJobMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve As-Is
                  </Button>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="w-12 h-12 mx-auto mb-4" />
              <p>Select a job from the queue to start reviewing</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
