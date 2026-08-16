import { Injectable } from '@nestjs/common';
import { UserRole } from '../enums';
import {
  ALL_PERMISSION_ACTIONS,
  ALL_PERMISSION_RESOURCES,
  PermissionAction,
  PermissionMatrix,
  PermissionResource,
  PERMISSION_RESOURCE_META,
  ROLE_PERMISSION_DEFAULTS,
  ResourcePermissions,
} from './permission.constants';

@Injectable()
export class PermissionsService {
  getCatalog() {
    return {
      resources: PERMISSION_RESOURCE_META,
      actions: ALL_PERMISSION_ACTIONS,
      roleDefaults: Object.fromEntries(
        Object.entries(ROLE_PERMISSION_DEFAULTS).filter(
          ([role]) => role !== UserRole.MEMBER,
        ),
      ) as Partial<Record<UserRole, PermissionMatrix>>,
    };
  }

  getRoleDefaults(role: UserRole): PermissionMatrix {
    return this.cloneMatrix(
      ROLE_PERMISSION_DEFAULTS[role] ?? ROLE_PERMISSION_DEFAULTS[UserRole.MEMBER],
    );
  }

  /**
   * Effective permissions:
   * - SUPER_ADMIN → full access
   * - customPermissions set → that matrix (normalized)
   * - otherwise → role defaults
   */
  resolveEffectivePermissions(
    role: UserRole,
    customPermissions?: ResourcePermissions | null,
  ): PermissionMatrix {
    if (role === UserRole.SUPER_ADMIN) {
      return this.getRoleDefaults(UserRole.SUPER_ADMIN);
    }

    if (customPermissions && Object.keys(customPermissions).length > 0) {
      return this.normalizeMatrix(customPermissions);
    }

    return this.getRoleDefaults(role);
  }

  hasPermission(
    permissions: PermissionMatrix | ResourcePermissions,
    resource: PermissionResource,
    action: PermissionAction,
  ): boolean {
    const actions = permissions[resource] ?? [];
    return actions.includes(action);
  }

  /**
   * Persist custom overrides only when they differ from role defaults.
   * Returns null when the matrix matches defaults (inherit from role).
   */
  normalizeForStorage(
    role: UserRole,
    permissions: ResourcePermissions | null | undefined,
    useRoleDefaults?: boolean,
  ): ResourcePermissions | null {
    if (useRoleDefaults || permissions == null) {
      return null;
    }

    const normalized = this.normalizeMatrix(permissions);
    const defaults = this.getRoleDefaults(role);
    if (this.matricesAreEqual(normalized, defaults)) {
      return null;
    }

    // Store only non-empty resources to keep payload small.
    const sparse: ResourcePermissions = {};
    for (const resource of ALL_PERMISSION_RESOURCES) {
      const actions = normalized[resource];
      if (actions.length > 0) {
        sparse[resource] = actions;
      }
    }
    return sparse;
  }

  inferResourceFromPath(path: string): PermissionResource | null {
    const cleaned = path.replace(/^\/+/, '').replace(/^api\/v1\//, '');

    const rules: Array<{ test: RegExp; resource: PermissionResource }> = [
      { test: /^admin\/dashboard/, resource: PermissionResource.DASHBOARD },
      { test: /^admin\/users/, resource: PermissionResource.ADMIN_USERS },
      { test: /^admin\/members/, resource: PermissionResource.MEMBERS },
      {
        test: /^admin\/applications/,
        resource: PermissionResource.APPLICATIONS,
      },
      {
        test: /^admin\/membership-categories/,
        resource: PermissionResource.MEMBERSHIP_CATEGORIES,
      },
      {
        test: /^admin\/disciplines/,
        resource: PermissionResource.MEMBERSHIP_CATEGORIES,
      },
      {
        test: /^admin\/engineering-institutions/,
        resource: PermissionResource.INSTITUTIONS,
      },
      { test: /^admin\/events/, resource: PermissionResource.EVENTS },
      { test: /^admin\/payments/, resource: PermissionResource.PAYMENTS },
      { test: /^admin\/analytics/, resource: PermissionResource.REPORTS },
      { test: /^admin\/reports/, resource: PermissionResource.REPORTS },
      { test: /^admin\/settings/, resource: PermissionResource.SETTINGS },
      { test: /^admin\/maintenance/, resource: PermissionResource.SETTINGS },
      { test: /^admin\/upgrades/, resource: PermissionResource.MEMBERS },
      { test: /^communication/, resource: PermissionResource.COMMUNICATION },
    ];

    for (const rule of rules) {
      if (rule.test.test(cleaned)) {
        return rule.resource;
      }
    }
    return null;
  }

  inferActionFromMethod(
    method: string,
    path: string,
  ): PermissionAction {
    const cleaned = path.replace(/^\/+/, '').replace(/^api\/v1\//, '');
    const upper = method.toUpperCase();

    // Action-style POSTs that mutate existing records.
    if (
      upper === 'POST' &&
      (/\/resend-credentials$/.test(cleaned) ||
        /\/renew$/.test(cleaned) ||
        /\/check-status$/.test(cleaned) ||
        /\/resend-link$/.test(cleaned) ||
        /\/check-in$/.test(cleaned) ||
        /\/stage$/.test(cleaned) ||
        /\/status$/.test(cleaned) ||
        /membership-card\//.test(cleaned) ||
        /maintenance\//.test(cleaned))
    ) {
      return PermissionAction.UPDATE;
    }

    switch (upper) {
      case 'POST':
        return PermissionAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return PermissionAction.UPDATE;
      case 'DELETE':
        return PermissionAction.DELETE;
      default:
        return PermissionAction.READ;
    }
  }

  private normalizeMatrix(
    input: ResourcePermissions,
  ): PermissionMatrix {
    const matrix = {} as PermissionMatrix;
    for (const resource of ALL_PERMISSION_RESOURCES) {
      const raw = input[resource] ?? [];
      const unique = Array.from(
        new Set(
          raw.filter((action): action is PermissionAction =>
            ALL_PERMISSION_ACTIONS.includes(action as PermissionAction),
          ),
        ),
      );
      // Create/update/delete imply read for UX consistency on the backend.
      if (
        unique.some((a) => a !== PermissionAction.READ) &&
        !unique.includes(PermissionAction.READ)
      ) {
        unique.unshift(PermissionAction.READ);
      }
      matrix[resource] = unique;
    }
    return matrix;
  }

  private cloneMatrix(matrix: PermissionMatrix): PermissionMatrix {
    return Object.fromEntries(
      ALL_PERMISSION_RESOURCES.map((resource) => [
        resource,
        [...(matrix[resource] ?? [])],
      ]),
    ) as PermissionMatrix;
  }

  private matricesAreEqual(a: PermissionMatrix, b: PermissionMatrix): boolean {
    for (const resource of ALL_PERMISSION_RESOURCES) {
      const left = [...(a[resource] ?? [])].sort().join(',');
      const right = [...(b[resource] ?? [])].sort().join(',');
      if (left !== right) return false;
    }
    return true;
  }
}
