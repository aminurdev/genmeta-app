"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  useRefreshUsersManagementMutation,
  useUserStatsQuery,
} from "@/services/queries/admin-dashboard";
import { CreateAppUserDialog } from "@/components/admin/users/create-app-user-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import StatisticsContent from "./statistics-content";
import AppUserList from "./appuser-list";

function formatRelativeTime(value?: string | null): string {
  if (!value) return "Just now";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Just now";
  return formatDistanceToNow(parsed, { addSuffix: true });
}

export default function AdminUsersPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeQueryParams, setActiveQueryParams] = useState("page=1&limit=10");

  const { data: statsRes } = useUserStatsQuery();
  const refreshMutation = useRefreshUsersManagementMutation();

  const generatedAt =
    statsRes?.success && statsRes.data?.meta?.generatedAt
      ? statsRes.data.meta.generatedAt
      : null;

  const handleRefreshAll = async () => {
    try {
      const { statsRes: nextStats, usersRes } =
        await refreshMutation.mutateAsync(activeQueryParams);

      if (!nextStats.success || !usersRes.success) {
        toast.error(
          (!nextStats.success ? nextStats.message : null) ||
            (!usersRes.success ? usersRes.message : null) ||
            "Failed to refresh user data"
        );
        return;
      }

      const synced =
        nextStats.data?.meta?.syncedExpiredPlans ??
        usersRes.data?.meta?.syncedExpiredPlans ??
        0;

      if (synced > 0) {
        toast.success(
          `Users refreshed & ${synced} expired plan${synced === 1 ? "" : "s"} reconciled`
        );
      } else {
        toast.success("Users & statistics refreshed");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh user data"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Users &amp; Licenses
            </h1>
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-0.5 rounded-full border bg-muted/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Synced {formatRelativeTime(generatedAt)}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage platform accounts, desktop app profiles, plans, credits, and
            device bindings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshMutation.isPending}
            className="gap-2"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                refreshMutation.isPending && "animate-spin"
              )}
            />
            <span>{refreshMutation.isPending ? "Syncing..." : "Refresh"}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create App User</span>
          </Button>
        </div>
      </div>

      {/* KPI & Analytics Section */}
      <StatisticsContent
        onSyncPlans={handleRefreshAll}
        isSyncing={refreshMutation.isPending}
      />

      {/* User Directory */}
      <AppUserList
        onOpenCreateDialog={() => setCreateDialogOpen(true)}
        onQueryParamsChange={setActiveQueryParams}
      />

      {/* Provision App User Dialog */}
      <CreateAppUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
