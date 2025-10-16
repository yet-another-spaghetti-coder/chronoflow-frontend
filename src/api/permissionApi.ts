import { http } from "@/lib/http";
import { unwrap } from "@/lib/utils";
import {
  permissionResponseSchema,
  type Permission,
  type PermissionConfig,
} from "@/lib/validation/schema";

export async function getPermissions(): Promise<Permission[]> {
  const res = await http.get("/users/permissions");
  const raw = unwrap(res.data);
  return permissionResponseSchema.parse(raw);
}

export async function createPermission(input: PermissionConfig) {
  const res = await http.post("/users/permissions", input);
  return unwrap(res.data);
}

export async function updatePermission(
  permissionId: string,
  input: PermissionConfig
) {
  const res = await http.patch(`/users/permissions/${permissionId}`, input);
  return unwrap(res.data);
}

export async function deletePermission(permissionId: string) {
  const res = await http.delete(`/users/permissions/${permissionId}`);
  return unwrap(res.data);
}
