import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  maskedKey?: string;
  lastUsed?: string;
  createdAt: string;
}

export default function ApiKeyManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<{ key: string; name: string } | null>(null);
  const [showCreatedKey, setShowCreatedKey] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['/api/api-keys'],
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('POST', '/api/api-keys', { name });
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedKey({ key: data.key, name: data.name });
      setNewKeyName('');
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      toast({
        title: 'API key created',
        description: 'Your new API key has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create API key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      toast({
        title: 'API key deleted',
        description: 'The API key has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete API key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: 'API key has been copied to your clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy API key to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your API key.',
        variant: 'destructive',
      });
      return;
    }
    createKeyMutation.mutate(newKeyName.trim());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
          <p className="text-muted-foreground mt-2">
            Manage your API keys for programmatic access
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-api-key">
              <Plus className="w-4 h-4 mr-2" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for programmatic access to the OCR API.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Production API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  data-testid="api-key-name-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateKey}
                disabled={createKeyMutation.isPending}
                data-testid="confirm-create-api-key"
              >
                {createKeyMutation.isPending ? 'Creating...' : 'Create Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Created Key Display */}
      {createdKey && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">
              API Key Created Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Key Name</Label>
                <p className="font-medium">{createdKey.name}</p>
              </div>
              <div>
                <Label>API Key</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-3 bg-background border rounded font-mono text-sm">
                    {showCreatedKey ? createdKey.key : '•'.repeat(createdKey.key.length)}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCreatedKey(!showCreatedKey)}
                    data-testid="toggle-key-visibility"
                  >
                    {showCreatedKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(createdKey.key)}
                    data-testid="copy-created-key"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> This is the only time you'll see the full API key.
                  Make sure to copy it and store it securely.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setCreatedKey(null)}
                className="w-full"
              >
                I've saved the key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading API keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No API keys</h3>
              <p className="text-muted-foreground mb-4">
                Create your first API key to start using the OCR API programmatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Last Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {apiKeys.map((key: ApiKey) => (
                    <tr key={key.id} data-testid={`api-key-row-${key.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {key.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm bg-muted px-3 py-1 rounded border">
                            {key.maskedKey}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(key.maskedKey || '')}
                            data-testid={`copy-key-${key.id}`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {key.lastUsed
                          ? formatDistanceToNow(new Date(key.lastUsed), { addSuffix: true })
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              data-testid={`delete-key-${key.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the API key "{key.name}"?
                                This action cannot be undone and will immediately invalidate the key.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteKeyMutation.mutate(key.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Key
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            Quick Start Example
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 dark:text-blue-200 mb-4">
            Use your API key to process documents programmatically:
          </p>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <code className="text-green-400 text-sm whitespace-pre">
{`curl -X POST https://api.ocrvision.com/v1/ocr \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "languageHints=en,ur" \\
  -F "searchablePdf=true"`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
