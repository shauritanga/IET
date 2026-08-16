import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import http from "~/utils/http";
import {
  getStoredUser,
  persistSession,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "~/utils/auth";
import { parseCookie } from "~/utils/cookies";
import {
  canAccessPath,
  hasPermission,
  type PermissionAction,
  type PermissionMatrix,
  type PermissionResource,
} from "~/utils/permissions";
import type { ApiEnvelope, LoginUser } from "~/types";

type PermissionsContextValue = {
  user: LoginUser | null;
  permissions: Partial<PermissionMatrix>;
  loading: boolean;
  refresh: () => Promise<void>;
  can: (resource: PermissionResource, action?: PermissionAction) => boolean;
  canRead: (resource: PermissionResource) => boolean;
  canCreate: (resource: PermissionResource) => boolean;
  canUpdate: (resource: PermissionResource) => boolean;
  canDelete: (resource: PermissionResource) => boolean;
  canAccess: (path: string) => boolean;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

function readStoredPermissions(): Partial<PermissionMatrix> {
  return (getStoredUser()?.permissions ?? {}) as Partial<PermissionMatrix>;
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUser | null>(() => getStoredUser());
  const [permissions, setPermissions] = useState<Partial<PermissionMatrix>>(
    () => readStoredPermissions(),
  );
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((next: LoginUser) => {
    setUser(next);
    setPermissions((next.permissions ?? {}) as Partial<PermissionMatrix>);
    const accessToken =
      typeof document !== "undefined"
        ? (parseCookie(document.cookie, TOKEN_KEY) ?? "")
        : "";
    const refreshToken =
      typeof document !== "undefined"
        ? (parseCookie(document.cookie, REFRESH_TOKEN_KEY) ?? "")
        : "";
    if (accessToken && refreshToken) {
      persistSession(next, accessToken, refreshToken);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data } = await http.get<ApiEnvelope<LoginUser>>("/auth/me");
      if (data.data) applyUser(data.data);
    } catch {
      // Keep stored session on transient failure.
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<PermissionsContextValue>(() => {
    const can = (
      resource: PermissionResource,
      action: PermissionAction = "read",
    ) => {
      if (user?.role === "SUPER_ADMIN") return true;
      return hasPermission(permissions, resource, action);
    };

    return {
      user,
      permissions,
      loading,
      refresh,
      can,
      canRead: (resource) => can(resource, "read"),
      canCreate: (resource) => can(resource, "create"),
      canUpdate: (resource) => can(resource, "update"),
      canDelete: (resource) => can(resource, "delete"),
      canAccess: (path) => {
        if (user?.role === "SUPER_ADMIN") return true;
        return canAccessPath(permissions, path);
      },
    };
  }, [user, permissions, loading, refresh]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return ctx;
}

/** Safe variant for components that may render outside the provider. */
export function usePermissionsOptional(): PermissionsContextValue | null {
  return useContext(PermissionsContext);
}
