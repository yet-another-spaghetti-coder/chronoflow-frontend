import { http } from "@/lib/http";
import type {
  MemberCompleteRegistration,
  MemberLookup,
  OrganizerRegistration,
} from "@/lib/validation/schema";

export async function registerOrganizer(input: OrganizerRegistration) {
  const payload = {
    ...input,
    event_start_time: input.event_start_time.toISOString(),
    event_end_time: input.event_end_time.toISOString(),
  };

  const res = await http.post("/system/organizer/register", payload);
  return res.data;
}

export async function registerMember(data: MemberCompleteRegistration) {
  const res = await http.post("/system/registration/member", data);
  return res.data;
}

export async function getTenantMemberInfo(params: MemberLookup) {
  const res = await http.get("/system/registration/member-info", {
    params,
  });
  return res.data;
}
