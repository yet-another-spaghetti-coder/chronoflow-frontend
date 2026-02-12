import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AuditLog } from "@/api/auditLogApi";

type AuditLogDetailDialogProps = {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TYPE_LABELS: Record<number, string> = {
  1: "Security",
  2: "Admin Action",
  3: "Data Change",
  4: "API Access",
};

function formatJson(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="break-all">{children}</span>
    </div>
  );
}

export default function AuditLogDetailDialog({
  log,
  open,
  onOpenChange,
}: AuditLogDetailDialogProps) {
  if (!log) return null;

  const requestBody = formatJson(log.requestBody);
  const beforeData = formatJson(log.beforeData);
  const afterData = formatJson(log.afterData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            Full details for audit entry #{log.id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="divide-y">
            {/* General info */}
            <div className="pb-3">
              <Row label="ID">{log.id}</Row>
              <Row label="Trace ID">
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {log.traceId || "—"}
                </code>
              </Row>
              <Row label="Time">{log.createTime}</Row>
              <Row label="User ID">{log.userId}</Row>
              <Row label="IP Address">{log.userIp || "—"}</Row>
            </div>

            {/* Operation info */}
            <div className="py-3">
              <Row label="Module">
                <span className="capitalize">{log.module}</span>
              </Row>
              <Row label="Operation">{log.operation}</Row>
              <Row label="Type">
                {TYPE_LABELS[log.type] ?? `Type ${log.type}`}
              </Row>
              <Row label="Method">{log.method || "—"}</Row>
              <Row label="Request URL">
                <code className="text-xs bg-muted px-1 py-0.5 rounded break-all">
                  {log.requestUrl || "—"}
                </code>
              </Row>
            </div>

            {/* Target */}
            <div className="py-3">
              <Row label="Target Type">{log.targetType || "—"}</Row>
              <Row label="Target ID">{log.targetId || "—"}</Row>
            </div>

            {/* Result */}
            <div className="py-3">
              <Row label="Result">
                {log.resultCode === -1 ||
                (log.resultCode == null &&
                  /FAILED|DENIED|MISMATCH|REUSE_DETECTED|EXCEEDED/.test(
                    log.operation ?? ""
                  )) ? (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    Failed
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Success
                  </Badge>
                )}
              </Row>
              {log.resultMsg && (
                <Row label="Result Message">
                  <span className="text-red-600">{log.resultMsg}</span>
                </Row>
              )}
              <Row label="Duration">
                {log.duration != null ? `${log.duration}ms` : "—"}
              </Row>
            </div>

            {/* Request body */}
            {requestBody && (
              <div className="py-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Request Body
                </p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {requestBody}
                </pre>
              </div>
            )}

            {/* Before / After data */}
            {beforeData && (
              <div className="py-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Before Data
                </p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {beforeData}
                </pre>
              </div>
            )}
            {afterData && (
              <div className="py-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  After Data
                </p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {afterData}
                </pre>
              </div>
            )}

            {/* User agent */}
            {log.userAgent && (
              <div className="py-3">
                <Row label="User Agent">
                  <span className="text-xs">{log.userAgent}</span>
                </Row>
              </div>
            )}

            {/* Extra */}
            {log.extra && (
              <div className="py-3">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Extra
                </p>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {formatJson(log.extra) ?? log.extra}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
