import type { AdminRole } from "~/types";

export type PermissionAction = "read" | "create" | "update" | "delete";

export type PermissionResource =
  | "dashboard"
  | "applications"
  | "members"
  | "membership_categories"
  | "institutions"
  | "communication"
  | "events"
  | "payments"
  | "reports"
  | "admin_users"
  | "settings";

export type PermissionMatrix = Record<PermissionResource, PermissionAction[]>;

export const ALL_ACTIONS: PermissionAction[] = ["read", "create", "update", "delete"];

export const MENU_RESOURCE_BY_PATH: Record<string, PermissionResource> = {
  "/dashboard": "dashboard",
  "/dashboard/applications": "applications",
  "/dashboard/members": "members",
  "/dashboard/membership-categories": "membership_categories",
  "/dashboard/engineering-institutions": "institutions",
  "/dashboard/communication": "communication",
  "/dashboard/communication/send": "communication",
  "/dashboard/communication/history": "communication",
  "/dashboard/communication/templates": "communication",
  "/dashboard/events": "events",
  "/dashboard/payments": "payments",
  "/dashboard/reports": "reports",
  "/dashboard/admin-users": "admin_users",
  "/dashboard/settings": "settings",
};

export function hasPermission(
  permissions: Partial<PermissionMatrix> | null | undefined,
  resource: PermissionResource,
  action: PermissionAction = "read",
): boolean {
  if (!permissions) return false;
  return (permissions[resource] ?? []).includes(action);
}

export function canAccessPath(
  permissions: Partial<PermissionMatrix> | null | undefined,
  path: string,
): boolean {
  const normalized = path.split("?")[0].replace(/\/$/, "") || "/dashboard";
  const resource =
    MENU_RESOURCE_BY_PATH[normalized] ??
    Object.entries(MENU_RESOURCE_BY_PATH).find(
      ([prefix]) => prefix !== "/dashboard" && normalized.startsWith(prefix),
    )?.[1];

  if (!resource) {
    // Profile and unknown pages remain reachable.
    return true;
  }
  return hasPermission(permissions, resource, "read");
}

export function emptyMatrix(resources: PermissionResource[]): PermissionMatrix {
  return Object.fromEntries(resources.map((r) => [r, [] as PermissionAction[]])) as PermissionMatrix;
}

export function cloneMatrix(matrix: PermissionMatrix): PermissionMatrix {
  return Object.fromEntries(
    Object.entries(matrix).map(([key, actions]) => [key, [...actions]]),
  ) as PermissionMatrix;
}

export function matricesEqual(a: PermissionMatrix, b: PermissionMatrix): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const left = [...(a[key as PermissionResource] ?? [])].sort().join(",");
    const right = [...(b[key as PermissionResource] ?? [])].sort().join(",");
    if (left !== right) return false;
  }
  return true;
}

export function roleDefaultMatrix(
  role: AdminRole | string,
  roleDefaults: Partial<Record<string, PermissionMatrix>> | undefined,
  resources: PermissionResource[],
): PermissionMatrix {
  const fromApi = roleDefaults?.[role];
  if (fromApi) return cloneMatrix(fromApi);
  return emptyMatrix(resources);
}
