import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ExportExcel } from "@/components/export-excel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { AuditLog } from "@/api/auditLogApi";

type AuditLogTableProps = {
  columns: ColumnDef<AuditLog, unknown>[];
  data: AuditLog[];
  total: number;
  pageNo: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AuditLogTable({
  columns,
  data,
  total,
  pageNo,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AuditLogTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: { pageIndex: pageNo - 1, pageSize },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount,
  });

  const excelExportData = React.useMemo(() => {
    return data.map((log) => ({
      Time: log.createTime,
      Operation: log.operation,
      Module: log.module,
      Type:
        log.type === 1
          ? "Security"
          : log.type === 2
            ? "Admin Action"
            : log.type === 3
              ? "Data Change"
              : "API Access",
      "User ID": log.userId,
      Target: [log.targetType, log.targetId].filter(Boolean).join(" #"),
      Result:
        log.resultCode === -1 ||
        (log.resultCode == null &&
          /FAILED|DENIED|MISMATCH|REUSE_DETECTED|EXCEEDED/.test(log.operation ?? ""))
          ? "Failed"
          : "Success",
      "Duration (ms)": log.duration,
      IP: log.userIp,
    }));
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
        <DataTableToolbar
          table={table}
          searchColumn={[]}
          buttonRight={
            <ExportExcel
              jsonData={excelExportData}
              fileName="audit-logs"
              loading={false}
            />
          }
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No audit log entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Server-side pagination controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="text-sm text-muted-foreground sm:flex-1">
          Showing {data.length} of {total} entries
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-auto sm:w-[100px] items-center justify-center text-sm font-medium">
            Page {pageNo} of {pageCount}
          </div>
          <div className="flex items-center space-x-2 justify-center">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(1)}
              disabled={pageNo <= 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(pageNo - 1)}
              disabled={pageNo <= 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(pageNo + 1)}
              disabled={pageNo >= pageCount}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(pageCount)}
              disabled={pageNo >= pageCount}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
