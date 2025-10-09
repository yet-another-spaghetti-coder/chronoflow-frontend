import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { Attendee } from "@/lib/validation/schema";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import { deleteAttendee } from "@/api/attendeeApi";
import AttendeeConfigFormModal from "../AttendeeConfigForm";

type ActionCellProps = {
  attendee: Attendee;
  eventId: string | number;
  onRefresh: () => void | Promise<void>;
};

function ActionCell({ attendee, eventId, onRefresh }: ActionCellProps) {
  const onDelete = async () => {
    const result = await Swal.fire({
      title: "Delete attendee?",
      html: `This will remove <b>${attendee.attendeeName}</b> (${attendee.attendeeEmail}).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;

    try {
      await deleteAttendee(attendee.id);
      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "The attendee has been deleted.",
        confirmButtonText: "OK",
      });
      await onRefresh?.();
    } catch (err: unknown) {
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text:
          err instanceof Error
            ? err.message
            : "Unable to delete the attendee. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <div className="flex justify-center gap-2">
      <AttendeeConfigFormModal
        eventId={eventId}
        attendee={attendee}
        onRefresh={onRefresh}
      />
      <Button size="sm" variant="destructive" onClick={onDelete}>
        Delete
      </Button>
    </div>
  );
}

export const AttendeeColumns = (
  eventId: string | number,
  onRefresh: () => void | Promise<void>
): ColumnDef<Attendee>[] => [
  {
    id: "actions",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Action" />
      </div>
    ),
    cell: ({ row }) => (
      <ActionCell
        attendee={row.original}
        eventId={eventId}
        onRefresh={onRefresh}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "attendeeEmail",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Email" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.getValue("attendeeEmail")}</div>
    ),
  },
  {
    accessorKey: "attendeeName",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Name" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.getValue("attendeeName")}</div>
    ),
  },
  {
    accessorKey: "attendeeMobile",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Mobile" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.getValue("attendeeMobile")}
      </div>
    ),
  },
];
