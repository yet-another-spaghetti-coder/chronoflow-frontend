import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { Role } from "@/lib/validation/schema";

export const RoleColumns = (
  onRefresh: () => Promise<void> | void
): ColumnDef<Role>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Role Name" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.getValue("name") as string}
      </div>
    ),
  },
  {
    accessorKey: "key",
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Role Key" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center font-mono">
        {row.getValue("key") as string}
      </div>
    ),
  },
  {
    id: "perm_keys",
    accessorFn: (row) => (row.permissions ?? []).map((p) => p.key),
    header: ({ column }) => (
      <div className="flex justify-center w-full">
        <DataTableColumnHeader column={column} title="Permissions" />
      </div>
    ),
    cell: ({ row }) => {
      const perms = (row.getValue("perm_keys") as string[]) ?? [];
      if (!perms.length)
        return (
          <div className="flex justify-center text-muted-foreground">—</div>
        );
      return (
        <div className="flex justify-center flex-wrap gap-1">
          {perms.map((k) => (
            <span
              key={k}
              className="rounded bg-muted px-2 py-0.5 text-xs leading-5"
            >
              {k}
            </span>
          ))}
        </div>
      );
    },
  },
];
