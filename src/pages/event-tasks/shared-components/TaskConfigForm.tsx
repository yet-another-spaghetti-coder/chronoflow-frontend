import { useEffect, useMemo, useState } from "react";
import { FormProvider, Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";

import {
  eventTaskConfigSchema,
  type EventTaskConfig,
} from "@/lib/validation/schema";
import { createEventTask } from "@/api/eventTasksApi";

type AssigneeOption = { id: string; label: string };

type TaskConfigFormProps = {
  eventId: string;
  onRefresh: () => void;
  assigneeOptions: AssigneeOption[];
};

export default function TaskConfigFormModal({
  eventId,
  onRefresh,
  assigneeOptions,
}: TaskConfigFormProps) {
  const [open, setOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const form = useForm<EventTaskConfig>({
    resolver: zodResolver(eventTaskConfigSchema),
    defaultValues: {
      name: "",
      description: "",
      status: 0,
      startTime: "",
      endTime: "",
      assignedUserId: "",
    },
  });

  const {
    handleSubmit,
    control,
    register,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = form;

  // Reset on dialog open/close
  useEffect(() => {
    if (!open) return;
    reset({
      name: "",
      description: "",
      status: 0,
      startTime: "",
      endTime: "",
      assignedUserId: "",
    });
  }, [open, reset]);

  const assigneeIdToLabel = useMemo(
    () => new Map(assigneeOptions.map((o) => [o.id, o.label] as const)),
    [assigneeOptions]
  );

  const selectedAssigneeId = watch("assignedUserId");
  const selectedAssigneeLabel = selectedAssigneeId
    ? assigneeIdToLabel.get(selectedAssigneeId) ?? ""
    : "";

  const onSubmit = handleSubmit(async (values: EventTaskConfig) => {
    try {
      await createEventTask(eventId, values);

      reset({
        name: "",
        description: "",
        status: 0,
        startTime: "",
        endTime: "",
        assignedUserId: "",
      });
      setOpen(false);
      await Swal.fire({
        icon: "success",
        title: "Task created",
        text: "The task has been created successfully.",
      });
      onRefresh();
    } catch (err: unknown) {
      setOpen(false);
      await Swal.fire({
        icon: "error",
        title: "Creation failed",
        text:
          err instanceof Error
            ? err.message
            : "Operation failed. Please try again.",
      });
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          reset({
            name: "",
            description: "",
            status: 0,
            startTime: "",
            endTime: "",
            assignedUserId: "",
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>Create task</Button>
      </DialogTrigger>

      <DialogContent className="w-[92vw] sm:max-w-md p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Define a new task for this event, set status and (optionally) assign
            a user.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[85dvh] overflow-y-auto px-6 pb-6">
          <FormProvider {...form}>
            <form onSubmit={onSubmit} noValidate className="grid gap-5">
              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Task Name</Label>
                <Input
                  id="name"
                  placeholder="Registration System Setup"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                <p className="h-5 text-sm text-destructive">
                  {errors.name?.message ?? "\u00A0"}
                </p>
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the task details…"
                  rows={3}
                  {...register("description")}
                />
                <p className="h-5 text-sm text-destructive">
                  {errors.description?.message ?? "\u00A0"}
                </p>
              </div>

              {/* Status */}
              <div className="grid gap-2">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select
                        value={String(field.value ?? 0)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Pending</SelectItem>
                          <SelectItem value="1">In Progress</SelectItem>
                          <SelectItem value="2">Completed</SelectItem>
                          <SelectItem value="3">Delayed</SelectItem>
                          <SelectItem value="4">Blocked</SelectItem>
                          <SelectItem value="5">Pending Approval</SelectItem>
                          <SelectItem value="6">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="h-5 text-sm text-destructive">
                        {errors.status?.message ?? "\u00A0"}
                      </p>
                    </>
                  )}
                />
              </div>

              {/* Start Time */}
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time (optional)</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  {...register("startTime")}
                />
                <p className="h-5 text-sm text-destructive">
                  {errors.startTime?.message ?? "\u00A0"}
                </p>
              </div>

              {/* End Time */}
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time (optional)</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  {...register("endTime")}
                />
                <p className="h-5 text-sm text-destructive">
                  {errors.endTime?.message ?? "\u00A0"}
                </p>
              </div>

              {/* Assignee */}
              <div className="grid gap-2">
                <Label>Assignee (optional)</Label>
                <Controller
                  name="assignedUserId"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Popover
                        open={assigneeOpen}
                        onOpenChange={setAssigneeOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={assigneeOptions.length === 0}
                          >
                            {selectedAssigneeLabel ||
                              (assigneeOptions.length === 0
                                ? "No members available"
                                : "Select assignee…")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                          <Command>
                            <CommandInput placeholder="Search members…" />
                            <CommandList>
                              <CommandEmpty>No members found.</CommandEmpty>
                              <CommandGroup>
                                {assigneeOptions.map((opt) => (
                                  <CommandItem
                                    key={opt.id}
                                    value={opt.label}
                                    onSelect={() => {
                                      field.onChange(opt.id);
                                      setAssigneeOpen(false);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    {opt.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <p className="h-5 text-sm text-destructive">
                        {errors.assignedUserId?.message ?? "\u00A0"}
                      </p>
                    </>
                  )}
                />
                {selectedAssigneeId && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => setValue("assignedUserId", "")}
                    >
                      Clear assignee
                    </Button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className={cn("h-11 w-full")}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating…" : "Create task"}
              </Button>
            </form>
          </FormProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
