import { http } from "@/lib/http";
import {
  roleResponseSchema,
  type Role,
  type RoleAssign,
  type RoleConfig,
} from "@/lib/validation/schema";
import { unwrap } from "@/lib/utils";

export async function getSystemRoles(): Promise<Role[]> {
  const res = await http.get("/users/roles");
  const raw = unwrap(res.data);
  return roleResponseSchema.parse(raw);
}

export async function createRole(input: RoleConfig) {
  const res = await http.post("/users/roles", input);
  return unwrap<Role>(res.data);
}

export async function updateRole(roleId: string, input: RoleConfig) {
  const res = await http.patch(`/users/roles/${roleId}`, input);
  return unwrap(res.data);
}

export async function deleteRole(roleId: string) {
  const res = await http.delete(`/users/roles/${roleId}`);
  return unwrap(res.data);
}

export async function assignRole(input: RoleAssign) {
  const res = await http.post("/users/roles/assign", input);
  return unwrap(res.data);
}
