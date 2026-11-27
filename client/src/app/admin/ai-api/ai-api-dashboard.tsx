"use client";

import React, { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  useAiApiKeysQuery,
  useCreateAiApiKeyMutation,
  useDeleteAiApiKeyMutation,
  useUpdateAiApiKeyMutation,
} from "@/services/queries/super-admin";
import type { AiApiKeyRecord } from "@/types/admin";
import { AiApiSkeleton } from "./ai-api-skeleton";

function safeFormatDate(value?: string | null, pattern = "MMM d, yyyy") {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, pattern);
}

function safeFormatRelative(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return formatDistanceToNow(d, { addSuffix: true });
}

function maskApiKey(value?: string | null) {
  if (!value) return "—";
  const trimmed = value.trim();
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 6)}••••••••${trimmed.slice(-4)}`;
}

export function AiApiDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>(
    {}
  );
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [togglingKeyId, setTogglingKeyId] = useState<string | null>(null);

  // Create / Update Dialog state
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<AiApiKeyRecord | null>(null);
  const [keyNameInput, setKeyNameInput] = useState("Gemini API Key");
  const [keyValueInput, setKeyValueInput] = useState("");
  const [keyIsActiveInput, setKeyIsActiveInput] = useState(true);
  const [showDialogKeyValue, setShowDialogKeyValue] = useState(false);

  // Delete confirmation state
  const [pendingDeleteKey, setPendingDeleteKey] =
    useState<AiApiKeyRecord | null>(null);

  const {
    data: aiKeysResponse,
    isPending: isLoading,
    isFetching,
    refetch,
  } = useAiApiKeysQuery();

  const createMutation = useCreateAiApiKeyMutation();
  const updateMutation = useUpdateAiApiKeyMutation();
  const deleteMutation = useDeleteAiApiKeyMutation();

  const aiKeys = useMemo(
    () => (aiKeysResponse?.success ? aiKeysResponse.data ?? [] : []),
    [aiKeysResponse]
  );

  const summary = useMemo(() => {
    const activeList = aiKeys.filter((k) => k.isActive);
    const unhealthyCount = aiKeys.filter((k) => k.isHealthy === false).length;
    return {
      total: aiKeys.length,
      active: activeList.length,
      inactive: aiKeys.length - activeList.length,
      unhealthy: unhealthyCount,
      healthy: aiKeys.length - unhealthyCount,
      primaryKey: activeList[0] ?? null,
    };
  }, [aiKeys]);

  const filteredKeys = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return aiKeys.filter((record) => {
      if (statusFilter === "active" && !record.isActive) return false;
      if (statusFilter === "inactive" && record.isActive) return false;
      if (!query) return true;
      return (
        record.name.toLowerCase().includes(query) ||
        record._id.toLowerCase().includes(query)
      );
    });
  }, [aiKeys, searchTerm, statusFilter]);

  const hasActiveFilters =
    statusFilter !== "all" || Boolean(searchTerm.trim());

  if (isLoading && !aiKeysResponse) {
    return <AiApiSkeleton />;
  }

  const handleRefresh = async () => {
    const result = await refetch();
    if (result.data?.success) {
      toast.success("AI API keys refreshed");
    } else {
      toast.error(result.data?.message || "Failed to refresh AI API keys");
    }
  };

  const openCreateDialog = () => {
    setEditingKey(null);
    setKeyNameInput("Gemini API Key");
    setKeyValueInput("");
    setKeyIsActiveInput(true);
    setShowDialogKeyValue(false);
    setKeyDialogOpen(true);
  };

  const openEditDialog = (record: AiApiKeyRecord) => {
    setEditingKey(record);
    setKeyNameInput(record.name || "Gemini API Key");
    setKeyValueInput(record.ai_api_key || "");
    setKeyIsActiveInput(Boolean(record.isActive));
    setShowDialogKeyValue(false);
    setKeyDialogOpen(true);
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = keyValueInput.trim();
    const trimmedName = keyNameInput.trim() || "Gemini API Key";

    if (!trimmedKey) {
      toast.error("Please enter a valid AI API key");
      return;
    }

    if (editingKey) {
      const res = await updateMutation.mutateAsync({
        id: editingKey._id,
        name: trimmedName,
        ai_api_key: trimmedKey,
        isActive: keyIsActiveInput,
      });
      if (res.success) {
        setKeyDialogOpen(false);
        setEditingKey(null);
      }
    } else {
      const res = await createMutation.mutateAsync({
        name: trimmedName,
        ai_api_key: trimmedKey,
        isActive: keyIsActiveInput,
      });
      if (res.success) {
        setKeyDialogOpen(false);
      }
    }
  };

  const handleToggleStatus = async (
    record: AiApiKeyRecord,
    nextActive: boolean
  ) => {
    setTogglingKeyId(record._id);
    try {
      await updateMutation.mutateAsync({
        id: record._id,
        isActive: nextActive,
      });
    } finally {
      setTogglingKeyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteKey) return;
    const res = await deleteMutation.mutateAsync(pendingDeleteKey._id);
    if (res.success) {
      setPendingDeleteKey(null);
    }
  };

  const toggleRevealKey = (id: string) => {
    setRevealedKeyIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyKey = async (record: AiApiKeyRecord) => {
    if (!record.ai_api_key) return;
    try {
      await navigator.clipboard.writeText(record.ai_api_key);
      setCopiedKeyId(record._id);
      toast.success(`Copied "${record.name}" to clipboard`);
      setTimeout(() => {
        setCopiedKeyId((current) => (current === record._id ? null : current));
      }, 2000);
    } catch {
      toast.error("Failed to copy API key to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                AI API Keys
              </h1>

              <Badge
                variant="outline"
                className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium gap-1"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Root Control
              </Badge>

              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium",
                  summary.active > 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                )}
              >
                {summary.active > 0
                  ? `${summary.active} Active`
                  : "No Active Key"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Create, update, and rotate encrypted Gemini API keys served to
              credit-plan desktop app users.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="gap-1.5"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
              />
              Refresh
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={openCreateDialog}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add AI API Key
            </Button>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      {aiKeysResponse && !aiKeysResponse.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load AI API keys</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{aiKeysResponse.message || "Request failed"}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {summary.unhealthy > 0 && (
        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Encryption key mismatch detected</AlertTitle>
          <AlertDescription>
            {summary.unhealthy} stored key(s) cannot be decrypted with the
            active <code>GEMINI_ENCODER_KEY</code>. Edit and re-save those
            key(s) to re-encrypt them.
          </AlertDescription>
        </Alert>
      )}

      {summary.total > 0 && summary.active === 0 && (
        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>No active AI API key enabled</AlertTitle>
          <AlertDescription>
            Credit-plan desktop app users require at least one active AI API key
            to process requests. Enable an existing key or create a new one.
          </AlertDescription>
        </Alert>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Keys
            </CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {summary.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Encrypted at rest (AES-256-CBC)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Keys
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {summary.active}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  summary.active > 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                )}
              >
                {summary.active > 0 ? "Serving" : "Paused"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
              {summary.inactive} inactive key(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Primary Client Key
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold tracking-tight truncate">
              {summary.primaryKey?.name || "None"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {summary.primaryKey
                ? `Updated ${safeFormatRelative(
                  summary.primaryKey.updatedAt ||
                  summary.primaryKey.createdAt
                ) || safeFormatDate(summary.primaryKey.updatedAt)
                }`
                : "No active key assigned"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Encryption Health
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums">
                {summary.healthy}/{summary.total}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  summary.unhealthy === 0
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                )}
              >
                {summary.unhealthy === 0 ? "Healthy" : "Attention"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Validated against active encoder key
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI API Key Directory */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Configured AI API Keys
                </CardTitle>
                <Badge variant="secondary" className="tabular-nums text-xs">
                  {summary.total} Total
                </Badge>
              </div>
              <CardDescription className="mt-1">
                Manage key labels, rotate Gemini API secrets, and toggle
                runtime availability.
              </CardDescription>
            </div>
          </div>

          {aiKeys.length > 0 && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    {
                      key: "all" as const,
                      label: "All Keys",
                      count: summary.total,
                    },
                    {
                      key: "active" as const,
                      label: "Active",
                      count: summary.active,
                    },
                    {
                      key: "inactive" as const,
                      label: "Inactive",
                      count: summary.inactive,
                    },
                  ] as const
                ).map((pill) => {
                  const active = statusFilter === pill.key;
                  return (
                    <button
                      key={pill.key}
                      type="button"
                      onClick={() => setStatusFilter(pill.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>{pill.label}</span>
                      <span
                        className={cn(
                          "tabular-nums text-[11px]",
                          active ? "opacity-80" : "text-muted-foreground"
                        )}
                      >
                        {pill.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 flex-1 lg:max-w-sm lg:justify-end">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter keys by name or ID..."
                    className="pl-9 pr-8 h-9"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear AI key search"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    className="h-9 px-2.5 text-xs gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {aiKeys.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 px-4 text-center space-y-3">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  No AI API keys configured yet
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Add a Gemini API key so credit-plan desktop app users can
                  receive an encrypted runtime key automatically.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={openCreateDialog}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Create First AI API Key
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Key Name</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKeys.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-sm text-muted-foreground"
                        >
                          No AI API keys match your current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredKeys.map((record) => {
                        const isRevealed = Boolean(revealedKeyIds[record._id]);
                        const isCopied = copiedKeyId === record._id;
                        const isPrimary =
                          record._id === summary.primaryKey?._id;
                        const isToggling = togglingKeyId === record._id;

                        return (
                          <TableRow key={record._id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-medium text-sm">
                                    {record.name}
                                  </span>
                                  {isPrimary && (
                                    <Badge
                                      variant="outline"
                                      className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] py-0 px-1.5"
                                    >
                                      Primary Client Key
                                    </Badge>
                                  )}
                                  {record.isHealthy === false && (
                                    <Badge
                                      variant="outline"
                                      className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] py-0 px-1.5"
                                    >
                                      Re-save Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] font-mono text-muted-foreground">
                                  {record._id}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                                  {isRevealed
                                    ? record.ai_api_key
                                    : maskApiKey(record.ai_api_key)}
                                </code>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => toggleRevealKey(record._id)}
                                  aria-label={
                                    isRevealed ? "Hide API key" : "Show API key"
                                  }
                                  title={
                                    isRevealed ? "Hide API key" : "Show API key"
                                  }
                                >
                                  {isRevealed ? (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleCopyKey(record)}
                                  aria-label="Copy API key"
                                  title="Copy API key"
                                >
                                  {isCopied ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <Switch
                                  checked={record.isActive}
                                  disabled={
                                    isToggling || updateMutation.isPending
                                  }
                                  onCheckedChange={(checked) =>
                                    handleToggleStatus(record, checked)
                                  }
                                  aria-label={`Toggle ${record.name} status`}
                                />
                                {record.isActive ? (
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs gap-1"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-muted-foreground text-xs"
                                  >
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              <div>
                                {safeFormatDate(
                                  record.updatedAt || record.createdAt
                                )}
                              </div>
                              {safeFormatRelative(
                                record.updatedAt || record.createdAt
                              ) && (
                                  <div className="text-[11px]">
                                    {safeFormatRelative(
                                      record.updatedAt || record.createdAt
                                    )}
                                  </div>
                                )}
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="inline-flex items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(record)}
                                  className="h-8 px-2.5 text-xs gap-1"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setPendingDeleteKey(record)}
                                  disabled={deleteMutation.isPending}
                                  className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 dark:text-rose-400"
                                  aria-label={`Delete ${record.name}`}
                                  title="Delete key"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y rounded-lg border">
                {filteredKeys.length === 0 ? (
                  <div className="py-8 px-4 text-center text-sm text-muted-foreground">
                    No AI API keys match your current filters.
                  </div>
                ) : (
                  filteredKeys.map((record) => {
                    const isRevealed = Boolean(revealedKeyIds[record._id]);
                    const isCopied = copiedKeyId === record._id;
                    const isPrimary = record._id === summary.primaryKey?._id;
                    const isToggling = togglingKeyId === record._id;

                    return (
                      <div key={record._id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-medium text-sm truncate">
                                {record.name}
                              </span>
                              {isPrimary && (
                                <Badge
                                  variant="outline"
                                  className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] py-0 px-1.5"
                                >
                                  Primary
                                </Badge>
                              )}
                              {record.isHealthy === false && (
                                <Badge
                                  variant="outline"
                                  className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] py-0 px-1.5"
                                >
                                  Re-save Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-muted-foreground truncate">
                              {record._id}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(record)}
                              className="h-8 px-2.5 text-xs gap-1"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setPendingDeleteKey(record)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 dark:text-rose-400"
                              aria-label={`Delete ${record.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs font-mono">
                            {isRevealed
                              ? record.ai_api_key
                              : maskApiKey(record.ai_api_key)}
                          </code>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => toggleRevealKey(record._id)}
                            aria-label={
                              isRevealed ? "Hide API key" : "Show API key"
                            }
                          >
                            {isRevealed ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => handleCopyKey(record)}
                            aria-label="Copy API key"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={record.isActive}
                              disabled={isToggling || updateMutation.isPending}
                              onCheckedChange={(checked) =>
                                handleToggleStatus(record, checked)
                              }
                              aria-label={`Toggle ${record.name} status`}
                            />
                            <span className="text-xs font-medium">
                              {record.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Updated{" "}
                            {safeFormatDate(
                              record.updatedAt || record.createdAt
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit AI API Key Dialog */}
      <Dialog
        open={keyDialogOpen}
        onOpenChange={(open) => {
          setKeyDialogOpen(open);
          if (!open) {
            setEditingKey(null);
            setShowDialogKeyValue(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingKey ? "Update AI API Key" : "Add AI API Key"}
            </DialogTitle>
            <DialogDescription>
              {editingKey
                ? "Update the label, rotate the secret key, or change its active status. Keys are encrypted at rest with AES-256-CBC."
                : "Add a new Gemini AI API key. It will be encrypted at rest and made available to credit-plan desktop app users when active."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDialogSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-key-name">Key Label</Label>
              <Input
                id="ai-key-name"
                placeholder="e.g. Gemini Production Key"
                value={keyNameInput}
                onChange={(e) => setKeyNameInput(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-key-secret">AI API Key</Label>
              <div className="relative">
                <Input
                  id="ai-key-secret"
                  type={showDialogKeyValue ? "text" : "password"}
                  placeholder="AIzaSy..."
                  value={keyValueInput}
                  onChange={(e) => setKeyValueInput(e.target.value)}
                  className="pr-10 font-mono text-sm"
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowDialogKeyValue((prev) => !prev)}
                  aria-label={
                    showDialogKeyValue ? "Hide API key" : "Show API key"
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showDialogKeyValue ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Stored encrypted in MongoDB using{" "}
                <code className="text-[11px]">GEMINI_ENCODER_KEY</code>.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="ai-key-active" className="text-sm font-medium">
                  Active Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  Allow desktop clients on credit plans to use this key
                </p>
              </div>
              <Switch
                id="ai-key-active"
                checked={keyIsActiveInput}
                onCheckedChange={setKeyIsActiveInput}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setKeyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="gap-1.5"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {editingKey
                  ? updateMutation.isPending
                    ? "Saving Changes..."
                    : "Save Changes"
                  : createMutation.isPending
                    ? "Creating..."
                    : "Create API Key"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete AI API Key AlertDialog */}
      <AlertDialog
        open={Boolean(pendingDeleteKey)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteKey(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AI API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {pendingDeleteKey?.name}
              </span>
              ? If no other active key remains, credit-plan desktop app users
              will no longer receive an AI API key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
