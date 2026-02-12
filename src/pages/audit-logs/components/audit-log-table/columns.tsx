import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { AuditLog } from "@/api/auditLogApi";

const TYPE_MAP: Record<number, { label: string; className: string }> = {
  1: {
    label: "Security",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  2: {
    label: "Admin Action",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  3: {
    label: "Data Change",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  4: {
    label: "API Access",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

function formatTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-SG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export const AuditLogColumns = (
  onViewDetails: (log: AuditLog) => void
): ColumnDef<AuditLog>[] => [
  {
    accessorKey: "createTime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Time" />
    ),
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm">
        {formatTime(row.getValue("createTime"))}
      </div>
    ),
  },
  {
    accessorKey: "operation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Operation" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate text-sm">
        {row.getValue("operation")}
      </div>
    ),
  },
  {
    accessorKey: "module",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Module" />
    ),
    cell: ({ row }) => (
      <div className="text-sm capitalize">{row.getValue("module")}</div>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as number;
      const info = TYPE_MAP[type] ?? {
        label: `Type ${type}`,
        className: "bg-gray-100 text-gray-800 border-gray-200",
      };
      return <Badge className={info.className}>{info.label}</Badge>;
    },
  },
  {
    accessorKey: "userId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="User ID" />
    ),
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("userId")}</div>
    ),
  },
  {
    id: "target",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Target" />
    ),
    accessorFn: (row) =>
      [row.targetType, row.targetId].filter(Boolean).join(" #"),
    cell: ({ row }) => {
      const orig = row.original;
      if (!orig.targetType && !orig.targetId) return <div className="text-sm text-muted-foreground">—</div>;
      return (
        <div className="text-sm">
          {orig.targetType}
          {orig.targetId ? ` #${orig.targetId}` : ""}
        </div>
      );
    },
  },
  {
    accessorKey: "resultCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Result" />
    ),
    cell: ({ row }) => {
      const code = row.getValue("resultCode") as number | null;
      const op = row.original.operation ?? "";
      const failed =
        code === -1 ||
        (code == null && /FAILED|DENIED|MISMATCH|REUSE_DETECTED|EXCEEDED/.test(op));
      return failed ? (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Failed
        </Badge>
      ) : (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Success
        </Badge>
      );
    },
  },
  {
    accessorKey: "duration",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
    cell: ({ row }) => {
      const ms = row.getValue("duration") as number;
      return <div className="text-sm">{ms != null ? `${ms}ms` : "—"}</div>;
    },
  },
  {
    accessorKey: "userIp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="IP" />
    ),
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("userIp") || "—"}</div>
    ),
  },
  {
    id: "actions",
    header: "Details",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewDetails(row.original)}
      >
        <Eye className="mr-1 h-4 w-4" />
        View
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
