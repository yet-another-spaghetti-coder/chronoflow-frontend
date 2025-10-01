import type { EventTask } from "@/lib/validation/schema";

export type TaskStatusCode =
  | 0 // Pending
  | 1 // In Progress
  | 2 // Completed
  | 3 // Delayed
  | 4 // Blocked
  | 5 // Pending Approval
  | 6 // Rejected
  | null
  | undefined;

export function getTaskStatusText(status: TaskStatusCode): string {
  switch (status) {
    case 0:
      return "Pending";
    case 1:
      return "In Progress";
    case 2:
      return "Completed";
    case 3:
      return "Delayed";
    case 4:
      return "Blocked";
    case 5:
      return "Pending Approval";
    case 6:
      return "Rejected";
    default:
      return "Unknown";
  }
}

export function getTaskStatusStyle(status: TaskStatusCode): {
  badge: string;
  dot: string;
} {
  switch (status) {
    case 0: // Pending
      return {
        badge: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
        dot: "bg-zinc-500",
      };
    case 1: // In Progress
      return {
        badge: "bg-violet-100 text-violet-700 ring-violet-500/20",
        dot: "bg-violet-500",
      };
    case 2: // Completed
      return {
        badge: "bg-emerald-100 text-emerald-700 ring-emerald-500/20",
        dot: "bg-emerald-500",
      };
    case 3: // Delayed
      return {
        badge: "bg-amber-100 text-amber-700 ring-amber-500/20",
        dot: "bg-amber-500",
      };
    case 4: // Blocked
      return {
        badge: "bg-rose-100 text-rose-700 ring-rose-500/20",
        dot: "bg-rose-500",
      };
    case 5: // Pending Approval
      return {
        badge: "bg-blue-100 text-blue-700 ring-blue-500/20",
        dot: "bg-blue-500",
      };
    case 6: // Rejected
      return {
        badge: "bg-red-100 text-red-700 ring-red-500/20",
        dot: "bg-red-500",
      };
    default: // Unknown
      return {
        badge: "bg-gray-100 text-gray-700 ring-gray-500/20",
        dot: "bg-gray-500",
      };
  }
}

export type CategorizedTasks = {
  completedTasks: EventTask[];
  pendingTasks: EventTask[];
  inProgressTasks: EventTask[];
  delayedTasks: EventTask[];
  blockedTasks: EventTask[];
  pendingApprovalTasks: EventTask[];
  rejectedTasks: EventTask[];
};

export function categorizeTasks(tasks: EventTask[]): CategorizedTasks {
  return tasks.reduce<CategorizedTasks>(
    (acc, task) => {
      switch (task.status) {
        case 0:
          acc.pendingTasks.push(task);
          break;
        case 1:
          acc.inProgressTasks.push(task);
          break;
        case 2:
          acc.completedTasks.push(task);
          break;
        case 3:
          acc.delayedTasks.push(task);
          break;
        case 4:
          acc.blockedTasks.push(task);
          break;
        case 5:
          acc.pendingApprovalTasks.push(task);
          break;
        case 6:
          acc.rejectedTasks.push(task);
          break;
        default:
          break;
      }
      return acc;
    },
    {
      completedTasks: [],
      pendingTasks: [],
      inProgressTasks: [],
      delayedTasks: [],
      blockedTasks: [],
      pendingApprovalTasks: [],
      rejectedTasks: [],
    }
  );
}
