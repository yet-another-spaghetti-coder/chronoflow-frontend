import { http } from "@/lib/http";
import type { MemberBulkUpsertResult } from "@/services/member";
import { unwrap } from "@/lib/utils";
import {
  type Member,
  type MemberConfig,
  MembersResponseSchema,
} from "@/lib/validation/schema";

export async function getMembers(): Promise<Member[]> {
  const res = await http.get("/users/organizer/users");
  const raw = unwrap<Member[]>(res.data);
  return MembersResponseSchema.parse(raw);
}

export async function uploadMembersExcel(
  file: File
): Promise<MemberBulkUpsertResult> {
  const form = new FormData();
  form.append("file", file, file.name);

  const res = await http.post("/users/organizer/users/bulk-upsert", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap<MemberBulkUpsertResult>(res.data);
}

const toPayload = (input: MemberConfig) => ({
  email: input.email,
  roleIds: input.roleIds,
  ...(input.remark ? { remark: input.remark } : {}),
});

export async function createMember(input: MemberConfig) {
  const res = await http.post("/users/organizer/create/user", toPayload(input));
  return unwrap(res.data);
}

export async function updateMember(id: string, input: MemberConfig) {
  const res = await http.patch(
    `/users/organizer/update/user/${id}`,
    toPayload(input)
  );
  return unwrap(res.data);
}

export async function deleteMember(id: string) {
  const res = await http.delete(`/users/organizer/delete/user/${id}`);
  return unwrap(res.data);
}
