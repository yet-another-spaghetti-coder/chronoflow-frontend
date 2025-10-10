import { useEffect, useState } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
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
import Swal from "sweetalert2";

import { updateEventTask } from "@/api/eventTasksApi";
import { TaskActionEnum, type AssigneeOption } from "@/services/eventTask";
import { cn } from "@/lib/utils";
import { reAssignSchema, type ReAssignFormType } from "@/lib/validation/schema";

type TaskReassignModalProps = {
  eventId: string | number;
  taskId: string | number;
  onRefresh: () => void;
  options: AssigneeOption[];
  initialUserId?: string | null;
  triggerLabel?: string;
  trigger?: React.ReactNode; 
};

export default function TaskReassignModal({
  eventId,
  taskId,
  onRefresh,
  options,
  initialUserId,
  triggerLabel = "Reassign",
  trigger,
}: TaskReassignModalProps) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const form = useForm<ReAssignFormType>({
    resolver: zodResolver(reAssignSchema),
    defaultValues: {
      targetUserId: initialUserId ?? "",
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = form;

  // Reset to latest props when the dialog opens
  useEffect(() => {
    if (!open) return;
    reset({ targetUserId: initialUserId ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialUserId]);

  const selectedId = watch("targetUserId");
  const selectedLabel = selectedId
    ? options.find((o) => o.id === selectedId)?.label ?? ""
    : "";

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateEventTask(eventId, taskId, {
        type: TaskActionEnum.ASSIGN,
        targetUserId: values.targetUserId,
      });
      reset({ targetUserId: values.targetUserId });
      setOpen(false);
      await Swal.fire({
        icon: "success",
        title: "Assignee updated",
        text: "The task has been reassigned successfully.",
      });
      onRefresh();
    } catch (err: unknown) {
      setOpen(false);
      await Swal.fire({
        icon: "error",
        title: "Reassign failed",
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
        if (!v) reset({ targetUserId: initialUserId ?? "" });
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">{triggerLabel}</Button>}
      </DialogTrigger>

      <DialogContent className="w-[92vw] sm:max-w-md p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Reassign Task</DialogTitle>
          <DialogDescription>
            Choose a new assignee for this task.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[85dvh] overflow-y-auto px-6 pb-6">
          <FormProvider {...form}>
            <form onSubmit={onSubmit} className="grid gap-5">
              <div className="grid gap-2">
                <Label>Assignee</Label>
                <Controller
                  name="targetUserId"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={options.length === 0}
                          >
                            {selectedLabel ||
                              (options.length === 0
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
                                {options.map((opt) => (
                                  <CommandItem
                                    key={opt.id}
                                    value={opt.label}
                                    onSelect={() => {
                                      field.onChange(opt.id);
                                      setPickerOpen(false);
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
                        {errors.targetUserId?.message ?? "\u00A0"}
                      </p>
                    </>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Reassigning…" : "Confirm Reassign"}
              </Button>
            </form>
          </FormProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
