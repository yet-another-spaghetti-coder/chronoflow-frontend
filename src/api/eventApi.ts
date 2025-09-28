import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import { OrgEventsResponseSchema, type OrgEvent } from "@/lib/validation/schema";

// export async function getEvents(): Promise<OrgEvent[]> {
//   const res = await http.get("/system/events");
//   const raw = unwrap<OrgEvent[]>(res.data);
//   return OrgEventsResponseSchema.parse(raw);
// }

export async function getEvents(): Promise<OrgEvent[]> {
  const res = await http.get("/system/events");
  const raw = unwrap<OrgEvent[]>(res.data);

  // --- inject demo record ---
  const demo: OrgEvent = {
    id: "demo_001",
    name: "Demo Event with 5 Groups",
    description: "This is a fake record injected client-side.",
    location: "Virtual",
    status: 1,
     startTime: new Date(),                               // <-- Date object
  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),  // <-- Date object
    remark: "Testing group rendering",
    joiningParticipants: 42,
    groups: [
      { id: "grp1", name: "Logistics" },
      { id: "grp2", name: "Content" },
      { id: "grp3", name: "Registration" },
      { id: "grp4", name: "Marketing" },
      { id: "grp5", name: "Finance" },
    ],
    taskStatus: {
      total: 10,
      completed: 7,
      remaining: 3,
    },
  };

  // put demo at the top of the list
  const withDemo = [demo, ...raw];

  return OrgEventsResponseSchema.parse(withDemo);
}