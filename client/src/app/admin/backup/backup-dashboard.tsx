"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog";
import {
  Database,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  HardDrive,
  Calendar,
  Activity,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useBackupConnectionQuery,
  useBackupStatusQuery,
  useBackupHistoryQuery,
  useTriggerBackupMutation,
} from "@/services/queries/backup-queries";

export function BackupDashboard() {
  const [testingConnection, setTestingConnection] = useState(false);

  const {
    data: connectionResponse,
    isLoading: connectionLoading,
    refetch: refetchConnection,
  } = useBackupConnectionQuery();

  const {
    data: statusResponse,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useBackupStatusQuery();

  const {
    data: historyResponse,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useBackupHistoryQuery();

  const triggerBackupMutation = useTriggerBackupMutation();

  const connectionData = connectionResponse?.success
    ? connectionResponse.data
    : null;
  const statusData = statusResponse?.success ? statusResponse.data : null;
  const historyData = historyResponse?.success ? historyResponse.data : [];

  const loading = connectionLoading || statusLoading || historyLoading;

  const refetchAll = async () => {
    await Promise.all([refetchConnection(), refetchStatus(), refetchHistory()]);
  };

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const result = await refetchConnection();
      if (result.data?.success) {
        toast.success("Backup database connection successful");
      } else {
        toast.error("Backup database connection failed");
      }
    } catch  {
      toast.error("Failed to test connection");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      const result = await triggerBackupMutation.mutateAsync();
      if (result.success) {
        toast.success("Database backup completed successfully");
      } else {
        toast.error(result.message || "Backup failed");
      }
    } catch {
      toast.error("Failed to trigger backup");
    }
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Success
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Failed
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading backup dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Backup Management
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage database backups
          </p>
        </div>
        <Button onClick={refetchAll} variant="outline" className="w-fit">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Connection Status
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {connectionData ? (
                getStatusBadge(connectionData.success)
              ) : (
                <Badge variant="outline">Unknown</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {connectionData?.database || "Not connected"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusData?.totalBackups || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {statusData?.successfulBackups || 0} successful,{" "}
              {statusData?.failedBackups || 0} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {statusData?.lastBackup?.timestamp
                ? format(new Date(statusData.lastBackup.timestamp), "PPp")
                : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">
              {statusData?.lastBackup?.success ? "Successful" : "_"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Next Scheduled
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {statusData?.nextScheduledBackup
                ? format(new Date(statusData.nextScheduledBackup), "PPp")
                : "Not scheduled"}
            </div>
            <p className="text-xs text-muted-foreground">
              Every Friday at 12:00 PM UTC
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Controls</CardTitle>
          <CardDescription>
            Test connection or manually trigger a database backup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleTestConnection}
              disabled={testingConnection}
              variant="outline"
            >
              {testingConnection ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Activity className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={triggerBackupMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {triggerBackupMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="mr-2 h-4 w-4" />
                  )}
                  Trigger Backup Now
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Trigger Database Backup</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately start a full database backup to the
                    backup database. All collections will be synced. This
                    process may take several minutes depending on the database
                    size. Are you sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleTriggerBackup}>
                    Start Backup
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Last Backup Details */}
      {statusData?.lastBackup && (
        <Card>
          <CardHeader>
            <CardTitle>Last Backup Details</CardTitle>
            <CardDescription>
              Information from the most recent backup operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <div className="mt-1">
                    {getStatusBadge(statusData.lastBackup.success)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Duration
                  </p>
                  <p className="text-sm font-bold mt-1">
                    {statusData.lastBackup.duration}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Collections
                  </p>
                  <p className="text-sm font-bold mt-1">
                    {statusData.lastBackup.collections.successful}/
                    {statusData.lastBackup.collections.total}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Documents
                  </p>
                  <p className="text-sm font-bold mt-1">
                    {statusData.lastBackup.totalDocuments.toLocaleString()}
                  </p>
                </div>
              </div>
              {statusData.lastBackup.error && (
                <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700">
                      {statusData.lastBackup.error}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            Recent backup operations and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyData && historyData.length > 0 ? (
            <div className="space-y-3">
              {historyData.map((backup) => (
                <div
                  key={backup._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {backup.success ? (
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">
                          {format(new Date(backup.timestamp), "PPp")}
                        </p>
                        {getStatusBadge(backup.success)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {backup.collections.successful}/
                        {backup.collections.total} collections •{" "}
                        {backup.totalDocuments.toLocaleString()} documents •{" "}
                        {backup.duration}
                      </p>
                      {backup.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {backup.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:block text-xs text-muted-foreground">
                    {backup.triggeredBy}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No backup history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
