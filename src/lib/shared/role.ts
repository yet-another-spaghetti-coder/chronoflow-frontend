export type Role = "ORGANIZER" | "MANAGER" | "STAFF";

export function normalizeRoles(input?: string | string[] | null): Role[] {
  if (!input) return [];

  const arr = Array.isArray(input) ? input : [input];

  const flattened = arr
    .flatMap((r) => r.split(","))
    .map((r) => r.trim().toUpperCase())
    .filter(Boolean);

  const set = new Set(flattened);

  const out: Role[] = [];
  set.forEach((r) => {
    if (r === "ORGANIZER" || r === "MANAGER" || r === "STAFF") {
      out.push(r);
    }
  });

  return out;
}

export function hasAnyRole(userRoles: Role[] | undefined, ...need: Role[]) {
  if (!userRoles?.length) return false;
  return userRoles.some((r) => need.includes(r));
}

//Role transformation
export const ROLE_MAP: Record<number, string> = {
  1: "ADMIN",
  2: "ORGANIZER",
  3: "MANAGER",
  4: "STAFF",
};

export function mapRoleIdsToKeys(roleIds: number[]): string[] {
  return roleIds.map((id) => ROLE_MAP[id] ?? `UNKNOWN(${id})`);
}

export function mapRoleIdToKey(roleId: number): string {
  return ROLE_MAP[roleId] ?? `UNKNOWN(${roleId})`;
}

//Role Filtering
export const ROLE_KEYS = ["ORGANIZER", "MANAGER", "STAFF"] as const;

export function roleFilterOptions(): { label: string; value: string }[] {
  return ROLE_KEYS.map((k) => ({ label: k, value: k }));
}

//Role Options for UI
export const ROLE_ID_TO_NAME: Record<number, string> = {
  2: "ORGANIZER",
  3: "MANAGER",
  4: "STAFF",
};

export const ROLE_OPTIONS = Object.entries(ROLE_ID_TO_NAME).map(([id, label]) => ({
  id: Number(id),
  label,
}));