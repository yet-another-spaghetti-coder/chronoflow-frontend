import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { OrgEvent } from "@/lib/validation/schema";
import { DateTimeView } from "../DateTimeView";

export const OrgEventColumns = (): ColumnDef<OrgEvent>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => <div>{row.getValue("location") ?? ""}</div>,
  },
  {
    accessorKey: "startTime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Time" />
    ),
    cell: ({ row }) => <DateTimeView dt={row.getValue("startTime") as Date} />,
  },
  {
    accessorKey: "endTime",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="End Time" />
    ),
    cell: ({ row }) => <DateTimeView dt={row.getValue("endTime") as Date} />,
  },
  {
    accessorKey: "joiningParticipants",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Participants" />
    ),
    cell: ({ row }) => <div>{row.getValue("joiningParticipants")}</div>,
  },
  {
    accessorKey: "taskStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tasks" />
    ),
    cell: ({ row }) => {
      const task = row.getValue("taskStatus") as OrgEvent["taskStatus"];
      return (
        <div className="flex flex-col text-xs">
          <span>Total: {task.total}</span>
          <span className="text-green-600">Completed: {task.completed}</span>
          <span className="text-amber-600">Remaining: {task.remaining}</span>
        </div>
      );
    },
  },
];
