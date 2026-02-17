import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import {
  attendeeDashboardSchema,
  attendeesResponseSchema,
  type Attendee,
  type AttendeeDashboard,
  type IndiAttendeeConfig,
} from "@/lib/validation/schema";

export async function getAttendees(
  eventId: string | number
): Promise<Attendee[]> {
  const res = await http.get(
    `/attendees/list/${encodeURIComponent(String(eventId))}`
  );
  const raw = unwrap<Attendee[]>(res.data);
  return attendeesResponseSchema.parse(raw);
}

export async function createIndividualAttendee(
  input: IndiAttendeeConfig,
  eventId: string | number
) {
  const toPayload = (input: IndiAttendeeConfig) => ({
    eventId: eventId,
    attendees: [input],
  });

  const res = await http.post("/attendees", toPayload(input));
  return unwrap(res.data);
}

export async function updateAttendee(
  attendeeId: string | number,
  input: IndiAttendeeConfig
) {
  const res = await http.patch(`/attendees/${attendeeId}`, {
    email: input.email,
    name: input.name,
    mobile: input.mobile,
  });
  return unwrap(res.data);
}

export async function uploadAttendeesExcel(
  file: File,
  eventId: string | number
) {
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await http.post(`/attendees/bulk/${eventId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return unwrap(res.data);
}

export async function deleteAttendee(
  attendeeId: string | number
): Promise<boolean> {
  const res = await http.delete(`/attendees/${attendeeId}`);
  return unwrap<boolean>(res.data);
}

export async function getAttendeeDashboard(
  eventId: string | number,
  page = 1,
  pageSize = 20
): Promise<AttendeeDashboard> {
  const res = await http.get(`/attendees/dashboard/${encodeURIComponent(String(eventId))}`, {
    params: { page, pageSize },
  });
  const raw = unwrap(res.data);
  return attendeeDashboardSchema.parse(raw);
}