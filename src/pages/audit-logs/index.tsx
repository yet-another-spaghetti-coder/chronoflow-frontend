import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DataTableLoading } from "@/components/data-table/data-table-skeleton";
import { useAuditLogs } from "@/hooks/audit-logs/useAuditLogs";
import { AuditLogColumns } from "./components/audit-log-table/columns";
import AuditLogTable from "./components/audit-log-table/data-table";
import AuditLogDetailDialog from "./components/audit-log-detail-dialog";
import type { AuditLog, AuditLogQuery } from "@/api/auditLogApi";
import { X } from "lucide-react";
import { format } from "date-fns";

const ALL = "all";

const MODULE_OPTIONS = [
  { label: "All Modules", value: ALL },
  { label: "User", value: "user" },
  { label: "Event", value: "event" },
  { label: "Task", value: "task" },
  { label: "Attendee", value: "attendee" },
  { label: "File", value: "file" },
  { label: "Security", value: "security" },
];

const TYPE_OPTIONS = [
  { label: "All Types", value: ALL },
  { label: "Security", value: "1" },
  { label: "Admin Action", value: "2" },
  { label: "Data Change", value: "3" },
  { label: "API Access", value: "4" },
];

function toQueryString(d: Date | undefined): string | undefined {
  if (!d) return undefined;
  return format(d, "yyyy-MM-dd HH:mm:ss");
}

export default function AuditLogsPage() {
  const [module, setModule] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const queryParams = useMemo<AuditLogQuery>(() => {
    const params: AuditLogQuery = { pageNo, pageSize };
    if (module !== ALL) params.module = module;
    if (type !== ALL) params.type = Number(type);
    if (startDate) params.startTime = toQueryString(startDate);
    if (endDate) params.endTime = toQueryString(endDate);
    return params;
  }, [module, type, startDate, endDate, pageNo, pageSize]);

  const { logs, total, loading, error } = useAuditLogs(queryParams);

  const onViewDetails = useCallback((log: AuditLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  }, []);

  const columns = useMemo(
    () => AuditLogColumns(onViewDetails),
    [onViewDetails]
  );

  const handlePageChange = useCallback((page: number) => {
    setPageNo(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPageNo(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setModule(ALL);
    setType(ALL);
    setStartDate(undefined);
    setEndDate(undefined);
    setPageNo(1);
  }, []);

  const hasFilters = module !== ALL || type !== ALL || startDate || endDate;

  return (
    <Card className="rounded-lg border-none">
      <CardHeader className="pb-2">
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription className="mt-1">
          Browse and filter system audit logs. Track user actions, security
          events, and administrative changes across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Filter bar */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Module
            </label>
            <Select value={module} onValueChange={(v) => { setModule(v); setPageNo(1); }}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                {MODULE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Type
            </label>
            <Select value={type} onValueChange={(v) => { setType(v); setPageNo(1); }}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Start Time
            </label>
            <div className="w-[220px]">
              <DateTimePicker date={startDate} setDateTime={setStartDate} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              End Time
            </label>
            <div className="w-[220px]">
              <DateTimePicker date={endDate} setDateTime={setEndDate} />
            </div>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={handleClearFilters}
            >
              Clear
              <X className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <DataTableLoading columnCount={10} />
            </div>
          </div>
        ) : error ? (
          <div className="py-6 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <AuditLogTable
                columns={columns}
                data={logs}
                total={total}
                pageNo={pageNo}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </div>
        )}
      </CardContent>

      <AuditLogDetailDialog
        log={selectedLog}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </Card>
  );
}
