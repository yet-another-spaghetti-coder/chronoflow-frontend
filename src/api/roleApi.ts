import { http } from "@/lib/http";
import { roleResponseSchema, type Role } from "@/lib/validation/schema";
import { unwrap } from "@/lib/utils";

export async function getSystemRoles(): Promise<Role[]> {
  const res = await http.get("/system/roles");
  const raw = unwrap(res.data);
  return roleResponseSchema.parse(raw);
}
