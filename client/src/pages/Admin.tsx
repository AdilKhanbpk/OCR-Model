import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, DollarSign, TrendingUp, Heart, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: adminStats, isLoading: isStatsLoading } = useQuery<{
    totalUsers: number;
    totalJobs: number;
    totalUsage: number;
    activeUsers: number;
  }>({
    queryKey: ['/api/admin/stats'],
    retry: false,
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery<{
    users: Array<{
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      plan?: string;
      role?: string;
      createdAt: string;
    }>;
    total: number;
  }>({
    queryKey: ['/api/admin/users'],
    retry: false,
  });

  const { data: jobsData, isLoading: isJobsLoading } = useQuery<{
    jobs: Array<{
      id: string;
      userId: string;
      status: string;
      filename: string;
      pages?: number;
      createdAt: string;
    }>;
    total: number;
  }>({
    queryKey: ['/api/admin/jobs'],
    retry: false,
  });

  // Check admin access
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading || isStatsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading admin panel...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access the admin panel.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'business':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'pro':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System management and user administration
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-muted rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'jobs', label: 'Jobs' },
            { id: 'system', label: 'System' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? 'secondary' : 'ghost'}
              onClick={() => setSelectedTab(tab.id)}
              className="flex-1"
              data-testid={`admin-tab-${tab.id}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-bold text-foreground">
                        {adminStats?.totalUsers?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                      <p className="text-3xl font-bold text-foreground">
                        {adminStats?.totalJobs?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pages Processed</p>
                      <p className="text-3xl font-bold text-foreground">
                        {adminStats?.totalUsage?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                      <p className="text-3xl font-bold text-foreground">
                        {adminStats?.activeUsers?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                      <span className="text-foreground font-medium">API Service</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                      <span className="text-foreground font-medium">Google Vision API</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                      <span className="text-foreground font-medium">Database</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {isUsersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.users?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.profileImageUrl} />
                              <AvatarFallback>
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPlanColor(user.plan)}>
                            {user.plan || 'free'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select defaultValue={user.plan || 'free'}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Jobs Tab */}
        {selectedTab === 'jobs' && (
          <Card>
            <CardHeader>
              <CardTitle>Job Management</CardTitle>
            </CardHeader>
            <CardContent>
              {isJobsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading jobs...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pages</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobsData?.jobs?.map((job: any) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-sm">
                          {job.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-sm">
                          {job.filename}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {job.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{job.pages}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* System Tab */}
        {selectedTab === 'system' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Clear Cache</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>View Logs</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full">
                  Emergency Stop
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
