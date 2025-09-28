import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { OrgEvent } from "@/lib/validation/schema";
import { DateTimeView } from "../DateTimeView";
import TaskSummaryBox from "../TaskSummaryBox";
import { GroupPeek } from "../GroupPeek";

export const OrgEventColumns = (): ColumnDef<OrgEvent>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Name" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Location" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.getValue("location") ?? ""}
      </div>
    ),
  },
  {
    accessorKey: "startTime",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Start Time" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <DateTimeView dt={row.getValue("startTime") as Date} />
      </div>
    ),
  },
  {
    accessorKey: "endTime",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="End Time" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <DateTimeView dt={row.getValue("endTime") as Date} />
      </div>
    ),
  },
  {
    accessorKey: "groups",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Groups" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <GroupPeek groups={row.getValue("groups") as OrgEvent["groups"]} />
      </div>
    ),
  },
  {
    accessorKey: "joiningParticipants",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Participants" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.getValue("joiningParticipants")}
      </div>
    ),
  },
  {
    accessorKey: "taskStatus",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Tasks" />
      </div>
    ),
    cell: ({ row }) => {
      const t = row.getValue("taskStatus") as OrgEvent["taskStatus"];
      return (
        <div className="flex justify-center">
          <TaskSummaryBox
            total={t.total}
            completed={t.completed}
            remaining={t.remaining}
            dense
          />
        </div>
      );
    },
  },
];
