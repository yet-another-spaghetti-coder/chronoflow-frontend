import { describe, expect, it } from "vitest";
import {
  categorizeTasksForBoard,
  getTaskStatusStyle,
  getTaskStatusText,
  filterMyTasks,
  filterMyAssignedTasks,
  getInitialName,
  getStatusUX,
  getActionOptionsForStatus,
  getAssignableMembersOptions,
  buildTaskCreateFormData,
  buildTaskConfigFormData,
  getActionMeta,
  formatDT,
  formatFileBytes,
  actionsThatAllowFiles,
  TaskStatusEnum,
  TaskActionEnum,
  type TaskStatusCode,
  type TaskStatusEnumType,
} from "../eventTask";
import type { EventGroupWithAssignableMembers, EventTaskCreateConfig, EventTaskConfig } from "@/lib/validation/schema";

type TestGroup = { id?: string; name: string };
type TestUser = {
  id: string;
  name?: string;
  groups?: TestGroup[];
} | null;

type TestTask = {
  id: string;
  name: string;
  description: string | null;
  status: TaskStatusCode | number | null | undefined;
  startTime: string | null;
  endTime: string | null;
  assignedUser: TestUser;
  assignerUser: TestUser;
};

const makeTask = (
  status: TaskStatusCode,
  overrides: Partial<TestTask> = {}
): TestTask => ({
  id: `task-${String(status)}`,
  name: `Task ${String(status)}`,
  description: null,
  status,
  startTime: null,
  endTime: null,
  assignedUser: null,
  assignerUser: null,
  ...overrides,
});

describe("services/eventTask getTaskStatusText", () => {
  const cases: Array<[TaskStatusCode, string]> = [
    [0, "Pending"],
    [1, "In Progress"],
    [2, "Completed"],
    [3, "Delayed"],
    [4, "Blocked"],
    [5, "Pending Approval"],
    [6, "Rejected"],
    [null, "Unknown"],
    [undefined, "Unknown"],
  ];

  it.each(cases)("returns '%s' for status %s", (status, expected) => {
    expect(getTaskStatusText(status)).toBe(expected);
  });
});

describe("services/eventTask getTaskStatusStyle", () => {
  it("returns known theme styles", () => {
    expect(getTaskStatusStyle(0)).toEqual({
      text: "Pending",
      theme: "bg-gray-100 text-gray-700 ring-gray-500/20",
      dot: "bg-gray-500",
    });
    expect(getTaskStatusStyle(4)).toEqual({
      text: "Blocked",
      theme: "bg-amber-100 text-amber-700 ring-amber-500/20",
      dot: "bg-amber-500",
    });
    expect(getTaskStatusStyle(6)).toEqual({
      text: "Rejected",
      theme: "bg-red-100 text-red-700 ring-red-500/20",
      dot: "bg-red-500",
    });
  });

  it("returns unknown styles for missing or invalid status (no text key)", () => {
    const unknown1 = getTaskStatusStyle(undefined);
    expect(unknown1).toEqual({
      theme: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
      dot: "bg-zinc-500",
    });
    expect("text" in unknown1).toBe(false);

    // Pass an out-of-range value via unknown to avoid `any`
    const unknown2 = getTaskStatusStyle(99 as unknown as TaskStatusCode);
    expect(unknown2).toEqual({
      theme: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
      dot: "bg-zinc-500",
    });
    expect("text" in unknown2).toBe(false);
  });
});

describe("services/eventTask categorizeTasksForBoard", () => {
  it("categorizes tasks correctly", () => {
    const tasks: TestTask[] = [
      makeTask(0),
      makeTask(1),
      makeTask(2),
      makeTask(3),
      makeTask(4),
      makeTask(5),
      makeTask(6),
      makeTask(99 as unknown as TaskStatusCode),
    ];

    // Cast via unknown + parameter inference (no `any`)
    const buckets = categorizeTasksForBoard(
      tasks as unknown as Parameters<typeof categorizeTasksForBoard>[0]
    );

    expect(buckets.pending).toHaveLength(1);
    expect(buckets.progress).toHaveLength(1);
    expect(buckets.completed).toHaveLength(1);
    expect(buckets.delayed).toHaveLength(1);
    expect(buckets.blocked).toHaveLength(1);
    expect(buckets.pendingApproval).toHaveLength(1);
    expect(buckets.rejected).toHaveLength(1);
  });

  it("returns empty arrays for empty input", () => {
    const buckets = categorizeTasksForBoard(
      [] as unknown as Parameters<typeof categorizeTasksForBoard>[0]
    );
    expect(Object.values(buckets).every((arr) => arr.length === 0)).toBe(true);
  });
});

describe("services/eventTask filters", () => {
  const userId = "u1";

  const tasks: TestTask[] = [
    makeTask(1, { assignedUser: { id: "u1", name: "Alice", groups: [] } }),
    makeTask(2, { assignedUser: { id: "u2", name: "Bob", groups: [] } }),
    makeTask(3, { assignerUser: { id: "u1", name: "Alice", groups: [] } }),
    makeTask(4, { assignerUser: { id: "u2", name: "Bob", groups: [] } }),
  ];

  it("filters my tasks correctly", () => {
    const filtered = filterMyTasks(
      tasks as unknown as Parameters<typeof filterMyTasks>[0],
      userId
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].assignedUser?.id).toBe(userId);
  });

  it("filters my assigned tasks correctly", () => {
    const filtered = filterMyAssignedTasks(
      tasks as unknown as Parameters<typeof filterMyAssignedTasks>[0],
      userId
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].assignerUser?.id).toBe(userId);
  });
});

describe("services/eventTask getInitialName", () => {
  it("returns initials from name", () => {
    expect(getInitialName("John Doe")).toBe("JD");
    expect(getInitialName("  alice   ")).toBe("A");
    expect(getInitialName("bob charlie delta")).toBe("BC");
  });

  it("returns ? for invalid or empty input", () => {
    expect(getInitialName("")).toBe("?");
    expect(getInitialName(undefined)).toBe("?");
    expect(getInitialName(null as unknown as string)).toBe("?");
  });
});

describe("services/eventTask getStatusUX", () => {
  describe("for assigners", () => {
    const isAssigner = true;

    it("returns correct UX messages for each status", () => {
      expect(getStatusUX(TaskStatusEnum.PENDING, isAssigner)).toBe(
        "Waiting for assignee to accept or reject the task."
      );
      expect(getStatusUX(TaskStatusEnum.IN_PROGRESS, isAssigner)).toBe(
        "Assignee is working on this task."
      );
      expect(getStatusUX(TaskStatusEnum.DELAYED, isAssigner)).toBe(
        "Task is overdue and pending follow-up."
      );
      expect(getStatusUX(TaskStatusEnum.BLOCKED, isAssigner)).toBe(
        "Task is blocked."
      );
      expect(getStatusUX(TaskStatusEnum.REJECTED, isAssigner)).toBe(
        "Task was rejected by the assignee and awaits reassignment or update."
      );
      expect(getStatusUX(TaskStatusEnum.PENDING_APPROVAL, isAssigner)).toBe(
        "The task has been submitted and is waiting for your review or approval."
      );
      expect(getStatusUX(TaskStatusEnum.COMPLETED, isAssigner)).toBe(
        "Task has been completed and approved successfully."
      );
    });

    it("returns null for invalid status", () => {
      expect(getStatusUX(null, isAssigner)).toBeNull();
      expect(getStatusUX(undefined, isAssigner)).toBeNull();
      expect(getStatusUX(999 as TaskStatusEnumType, isAssigner)).toBeNull();
    });
  });

  describe("for assignees", () => {
    const isAssigner = false;

    it("returns correct UX messages for each status", () => {
      expect(getStatusUX(TaskStatusEnum.PENDING, isAssigner)).toBe(
        "A new task has been assigned to you. Please accept or reject it."
      );
      expect(getStatusUX(TaskStatusEnum.IN_PROGRESS, isAssigner)).toBe(
        "You are working on this task."
      );
      expect(getStatusUX(TaskStatusEnum.DELAYED, isAssigner)).toBe(
        "This task is overdue."
      );
      expect(getStatusUX(TaskStatusEnum.BLOCKED, isAssigner)).toBe(
        "This task is blocked. Your assigner may update the task."
      );
      expect(getStatusUX(TaskStatusEnum.REJECTED, isAssigner)).toBe(
        "You have rejected this task. Await further updates from your assigner."
      );
      expect(getStatusUX(TaskStatusEnum.PENDING_APPROVAL, isAssigner)).toContain(
        "submitted the task"
      );
      expect(getStatusUX(TaskStatusEnum.COMPLETED, isAssigner)).toBe(
        "You have completed this task. No further action required."
      );
    });

    it("returns null for invalid status", () => {
      expect(getStatusUX(null, isAssigner)).toBeNull();
      expect(getStatusUX(undefined, isAssigner)).toBeNull();
      expect(getStatusUX(999 as TaskStatusEnumType, isAssigner)).toBeNull();
    });
  });
});

describe("services/eventTask getActionOptionsForStatus", () => {
  describe("for assigners", () => {
    const isAssigner = true;

    it("returns correct actions for PENDING status", () => {
      const actions = getActionOptionsForStatus(TaskStatusEnum.PENDING, isAssigner);
      expect(actions).toHaveLength(3);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.UPDATE);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.DELETE);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.ASSIGN);
    });

    it("returns correct actions for IN_PROGRESS status", () => {
      const actions = getActionOptionsForStatus(TaskStatusEnum.IN_PROGRESS, isAssigner);
      expect(actions).toHaveLength(4);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.UPDATE);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.BLOCK);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.DELETE);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.ASSIGN);
    });

    it("returns correct actions for PENDING_APPROVAL status", () => {
      const actions = getActionOptionsForStatus(TaskStatusEnum.PENDING_APPROVAL, isAssigner);
      expect(actions).toHaveLength(1);
      expect(actions[0].value).toBe(TaskActionEnum.APPROVE);
      expect(actions[0].label).toBe("Approve");
    });

    it("returns correct actions for COMPLETED status", () => {
      const actions = getActionOptionsForStatus(TaskStatusEnum.COMPLETED, isAssigner);
      expect(actions).toHaveLength(1);
      expect(actions[0].value).toBe(TaskActionEnum.DELETE);
      expect(actions[0].label).toBe("Delete");
    });

    it("returns empty array for null status", () => {
      expect(getActionOptionsForStatus(null, isAssigner)).toEqual([]);
      expect(getActionOptionsForStatus(undefined, isAssigner)).toEqual([]);
    });
  });

  describe("for assignees", () => {
    const isAssigner = false;

    it("returns correct actions for PENDING status", () => {
      const actions = getActionOptionsForStatus(TaskStatusEnum.PENDING, isAssigner);
      expect(actions).toHaveLength(2);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.ACCEPT);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.REJECT);
    });

    it("returns correct actions for IN_PROGRESS status", () => {
      const actions = getActionOptionsForStatus(TaskStatusEnum.IN_PROGRESS, isAssigner);
      expect(actions).toHaveLength(2);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.SUBMIT);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.BLOCK);
    });

    it("returns correct actions for DELAYED status", () => {
      const actions = getActionOptionsForStatus(TaskStatusEnum.DELAYED, isAssigner);
      expect(actions).toHaveLength(2);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.SUBMIT);
      expect(actions.map(a => a.value)).toContain(TaskActionEnum.BLOCK);
    });

    it("returns empty array for non-actionable statuses", () => {
      expect(getActionOptionsForStatus(TaskStatusEnum.BLOCKED, isAssigner)).toEqual([]);
      expect(getActionOptionsForStatus(TaskStatusEnum.REJECTED, isAssigner)).toEqual([]);
      expect(getActionOptionsForStatus(TaskStatusEnum.PENDING_APPROVAL, isAssigner)).toEqual([]);
      expect(getActionOptionsForStatus(TaskStatusEnum.COMPLETED, isAssigner)).toEqual([]);
    });
  });
});

describe("services/eventTask getAssignableMembersOptions", () => {
  const mockGroups = [
    {
      id: "group-1",
      name: "Developers",
      members: [
        { id: "user-1", username: "john", email: "john@test.com" },
        { id: "user-2", username: "jane", email: "jane@test.com" },
      ]
    },
    {
      id: "group-2", 
      name: "Designers",
      members: [
        { id: "user-2", username: "jane", email: "jane@test.com" }, // Duplicate
        { id: "user-3", username: "bob", email: "bob@test.com" },
      ]
    }
  ];

  it("returns unique assignee options with group labels", () => {
    const options = getAssignableMembersOptions(mockGroups as EventGroupWithAssignableMembers[]);
    
    expect(options).toHaveLength(3); // Should deduplicate user-2
    expect(options).toContainEqual({
      id: "user-1",
      label: "john (Developers)"
    });
    expect(options).toContainEqual({
      id: "user-2", 
      label: "jane (Developers)" // Should use first occurrence
    });
    expect(options).toContainEqual({
      id: "user-3",
      label: "bob (Designers)"
    });
  });

  it("handles empty groups", () => {
    expect(getAssignableMembersOptions([])).toEqual([]);
  });

  it("handles groups with no members", () => {
    const emptyGroups = [{ id: "group-1", name: "Empty", members: [] }];
    expect(getAssignableMembersOptions(emptyGroups as EventGroupWithAssignableMembers[])).toEqual([]);
  });
});

describe("services/eventTask buildTaskCreateFormData", () => {
  const mockFile = new File(["content"], "test.txt", { type: "text/plain" });

  it("builds FormData with all fields", () => {
    const input = {
      name: "Test Task",
      targetUserId: "user-123",
      description: "Test description",
      remark: "Test remark", 
      startTime: new Date("2025-01-01T10:00:00"),
      endTime: new Date("2025-01-01T12:00:00"),
      files: [mockFile]
    };

    const formData = buildTaskCreateFormData(input as EventTaskCreateConfig);
    
    expect(formData.get("name")).toBe("Test Task");
    expect(formData.get("targetUserId")).toBe("user-123");
    expect(formData.get("description")).toBe("Test description");
    expect(formData.get("remark")).toBe("Test remark");
    expect(formData.get("startTime")).toBe("2025-01-01T10:00:00");
    expect(formData.get("endTime")).toBe("2025-01-01T12:00:00");
    expect(formData.get("files")).toStrictEqual(mockFile);
  });

  it("builds FormData with minimal fields", () => {
    const input = {
      name: "Minimal Task",
      targetUserId: "user-456"
    };

    const formData = buildTaskCreateFormData(input as EventTaskCreateConfig);
    
    expect(formData.get("name")).toBe("Minimal Task");
    expect(formData.get("targetUserId")).toBe("user-456");
    expect(formData.get("description")).toBeNull();
    expect(formData.get("remark")).toBeNull();
    expect(formData.get("startTime")).toBeNull();
    expect(formData.get("endTime")).toBeNull();
    expect(formData.get("files")).toBeNull();
  });

  it("handles null/undefined optional fields", () => {
    const input: EventTaskCreateConfig = {
      name: "Task with nulls",
      targetUserId: "user-789",
      description: null,
      remark: null,
      startTime: undefined,
      endTime: undefined,
      files: undefined
    };

    const formData = buildTaskCreateFormData(input);
    
    expect(formData.get("name")).toBe("Task with nulls");
    expect(formData.get("targetUserId")).toBe("user-789");
    expect(formData.get("description")).toBeNull();
    expect(formData.get("remark")).toBeNull();
  });
});

describe("services/eventTask buildTaskConfigFormData", () => {
  const mockFile = new File(["content"], "update.txt", { type: "text/plain" });

  it("builds FormData with all fields", () => {
    const input = {
      name: "Updated Task",
      description: "Updated description",
      type: TaskActionEnum.UPDATE,
      targetUserId: "user-updated",
      startTime: new Date("2025-02-01T09:00:00"),
      endTime: new Date("2025-02-01T17:00:00"),
      remark: "Updated remark",
      files: [mockFile]
    };

    const formData = buildTaskConfigFormData(input as EventTaskConfig);
    
    expect(formData.get("name")).toBe("Updated Task");
    expect(formData.get("description")).toBe("Updated description");
    expect(formData.get("type")).toBe(String(TaskActionEnum.UPDATE));
    expect(formData.get("targetUserId")).toBe("user-updated");
    expect(formData.get("startTime")).toBe("2025-02-01T09:00:00");
    expect(formData.get("endTime")).toBe("2025-02-01T17:00:00");
    expect(formData.get("remark")).toBe("Updated remark");
    expect(formData.get("files")).toStrictEqual(mockFile);
  });

  it("only appends provided fields", () => {
    const input = {
      name: "Partial Update"
    };

    const formData = buildTaskConfigFormData(input as EventTaskConfig);
    
    expect(formData.get("name")).toBe("Partial Update");
    expect(formData.get("description")).toBeNull();
    expect(formData.get("type")).toBeNull();
    expect(formData.get("targetUserId")).toBeNull();
  });

  it("handles numeric type field", () => {
    const input = {
      type: TaskActionEnum.SUBMIT
    };

    const formData = buildTaskConfigFormData(input as EventTaskConfig);
    expect(formData.get("type")).toBe(String(TaskActionEnum.SUBMIT));
  });
});

describe("services/eventTask getActionMeta", () => {
  it("returns correct metadata for known actions", () => {
    expect(getActionMeta(TaskActionEnum.CREATE)).toEqual({
      label: "Created",
      theme: "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
    });
    
    expect(getActionMeta(TaskActionEnum.APPROVE)).toEqual({
      label: "Approved", 
      theme: "bg-green-100 text-green-700 ring-1 ring-green-200"
    });
    
    expect(getActionMeta(TaskActionEnum.REJECT)).toEqual({
      label: "Rejected",
      theme: "bg-red-100 text-red-700 ring-1 ring-red-200"
    });
  });

  it("returns default metadata for unknown actions", () => {
    const result = getActionMeta(999);
    expect(result.label).toBe("Action 999");
    expect(result.theme).toBe("bg-muted text-foreground/70 ring-1 ring-border");
  });
});

describe("services/eventTask formatDT", () => {
  it("formats valid date strings", () => {
    const result = formatDT("2025-01-01T12:00:00Z");
    expect(result).toMatch(/Jan 01, 2025/); // Basic check, exact format may vary by locale
    expect(result).toMatch(/\d{1,2}:\d{2}/); // Just check for time format, not specific time due to timezone
  });

  it("returns original string for invalid dates", () => {
    expect(formatDT("invalid-date")).toBe("invalid-date");
    expect(formatDT("")).toBe("");
  });
});

describe("services/eventTask formatFileBytes", () => {
  it("formats bytes correctly", () => {
    expect(formatFileBytes(500)).toBe("500 bytes");
    expect(formatFileBytes(1024)).toBe("1.0 KB");
    expect(formatFileBytes(1536)).toBe("1.5 KB");
    expect(formatFileBytes(1048576)).toBe("1.0 MB");
    expect(formatFileBytes(1073741824)).toBe("1.0 GB");
  });

  it("handles edge cases", () => {
    expect(formatFileBytes(0)).toBe("0 bytes");
    expect(formatFileBytes(Infinity)).toBe("Infinity bytes");
    expect(formatFileBytes(NaN)).toBe("NaN bytes");
  });

  it("limits decimal places appropriately", () => {
    expect(formatFileBytes(1500)).toBe("1.5 KB");
    expect(formatFileBytes(1500000)).toBe("1.4 MB");
  });
});

describe("services/eventTask actionsThatAllowFiles", () => {
  it("contains correct actions", () => {
    expect(actionsThatAllowFiles.has(TaskActionEnum.SUBMIT)).toBe(true);
    expect(actionsThatAllowFiles.has(TaskActionEnum.BLOCK)).toBe(true);
    expect(actionsThatAllowFiles.has(TaskActionEnum.CREATE)).toBe(false);
    expect(actionsThatAllowFiles.has(TaskActionEnum.DELETE)).toBe(false);
  });

  it("is a Set with correct size", () => {
    expect(actionsThatAllowFiles.size).toBe(2);
  });
});

describe("services/eventTask enums", () => {
  it("TaskStatusEnum has correct values", () => {
    expect(TaskStatusEnum.PENDING).toBe(0);
    expect(TaskStatusEnum.IN_PROGRESS).toBe(1);
    expect(TaskStatusEnum.COMPLETED).toBe(2);
    expect(TaskStatusEnum.DELAYED).toBe(3);
    expect(TaskStatusEnum.BLOCKED).toBe(4);
    expect(TaskStatusEnum.PENDING_APPROVAL).toBe(5);
    expect(TaskStatusEnum.REJECTED).toBe(6);
  });

  it("TaskActionEnum has correct values", () => {
    expect(TaskActionEnum.CREATE).toBe(1);
    expect(TaskActionEnum.ASSIGN).toBe(2);
    expect(TaskActionEnum.DELETE).toBe(3);
    expect(TaskActionEnum.UPDATE).toBe(4);
    expect(TaskActionEnum.SUBMIT).toBe(5);
    expect(TaskActionEnum.BLOCK).toBe(6);
    expect(TaskActionEnum.ACCEPT).toBe(7);
    expect(TaskActionEnum.REJECT).toBe(8);
    expect(TaskActionEnum.APPROVE).toBe(9);
  });
});
