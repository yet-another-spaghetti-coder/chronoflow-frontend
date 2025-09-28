import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import { OrgEventsResponseSchema, type OrgEvent } from "@/lib/validation/schema";

export async function getEvents(): Promise<OrgEvent[]> {
  const res = await http.get("/system/events");
  const raw = unwrap<OrgEvent[]>(res.data);
  return OrgEventsResponseSchema.parse(raw);
}