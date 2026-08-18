import { UserRole } from '../enums';

export enum PermissionResource {
  DASHBOARD = 'dashboard',
  APPLICATIONS = 'applications',
  MEMBERS = 'members',
  MEMBERSHIP_CATEGORIES = 'membership_categories',
  INSTITUTIONS = 'institutions',
  COMMUNICATION = 'communication',
  EVENTS = 'events',
  PAYMENTS = 'payments',
  REPORTS = 'reports',
  ADMIN_USERS = 'admin_users',
  SETTINGS = 'settings',
}

export enum PermissionAction {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export const ALL_PERMISSION_ACTIONS: PermissionAction[] = [
  PermissionAction.READ,
  PermissionAction.CREATE,
  PermissionAction.UPDATE,
  PermissionAction.DELETE,
];

export const ALL_PERMISSION_RESOURCES: PermissionResource[] = Object.values(
  PermissionResource,
);

export type ResourcePermissions = Partial<
  Record<PermissionResource, PermissionAction[]>
>;

export type PermissionMatrix = Record<PermissionResource, PermissionAction[]>;

const CRUD = [...ALL_PERMISSION_ACTIONS];
const READ = [PermissionAction.READ];
const READ_UPDATE = [PermissionAction.READ, PermissionAction.UPDATE];
const READ_CREATE_UPDATE = [
  PermissionAction.READ,
  PermissionAction.CREATE,
  PermissionAction.UPDATE,
];

function fullAccess(): PermissionMatrix {
  return Object.fromEntries(
    ALL_PERMISSION_RESOURCES.map((resource) => [resource, [...CRUD]]),
  ) as PermissionMatrix;
}

function emptyMatrix(): PermissionMatrix {
  return Object.fromEntries(
    ALL_PERMISSION_RESOURCES.map((resource) => [resource, [] as PermissionAction[]]),
  ) as PermissionMatrix;
}

/** Role defaults used when a user has no custom permission overrides. */
export const ROLE_PERMISSION_DEFAULTS: Record<UserRole, PermissionMatrix> = {
  [UserRole.SUPER_ADMIN]: fullAccess(),
  [UserRole.ADMIN]: fullAccess(),
  [UserRole.MEMBER]: emptyMatrix(),
  [UserRole.SECRETARIAT]: {
    [PermissionResource.DASHBOARD]: READ,
    [PermissionResource.APPLICATIONS]: READ_CREATE_UPDATE,
    [PermissionResource.MEMBERS]: READ_CREATE_UPDATE,
    [PermissionResource.MEMBERSHIP_CATEGORIES]: READ,
    [PermissionResource.INSTITUTIONS]: READ_CREATE_UPDATE,
    [PermissionResource.COMMUNICATION]: CRUD,
    [PermissionResource.EVENTS]: READ_CREATE_UPDATE,
    [PermissionResource.PAYMENTS]: READ_UPDATE,
    [PermissionResource.REPORTS]: READ,
    [PermissionResource.ADMIN_USERS]: [],
    [PermissionResource.SETTINGS]: READ,
  },
  [UserRole.EVALUATOR]: {
    ...emptyMatrix(),
    [PermissionResource.DASHBOARD]: READ,
    [PermissionResource.APPLICATIONS]: READ_UPDATE,
    [PermissionResource.MEMBERS]: READ,
  },
  [UserRole.REVIEWER]: {
    ...emptyMatrix(),
    [PermissionResource.DASHBOARD]: READ,
    [PermissionResource.APPLICATIONS]: READ_UPDATE,
    [PermissionResource.MEMBERS]: READ,
  },
  [UserRole.MPDC]: {
    ...emptyMatrix(),
    [PermissionResource.DASHBOARD]: READ,
    [PermissionResource.APPLICATIONS]: READ_UPDATE,
    [PermissionResource.MEMBERS]: READ,
    [PermissionResource.REPORTS]: READ,
  },
  [UserRole.COUNCIL]: {
    ...emptyMatrix(),
    [PermissionResource.DASHBOARD]: READ,
    [PermissionResource.APPLICATIONS]: READ_UPDATE,
    [PermissionResource.MEMBERS]: READ,
    [PermissionResource.REPORTS]: READ,
  },
  [UserRole.ACCOUNTANT]: {
    ...emptyMatrix(),
    [PermissionResource.DASHBOARD]: READ,
    [PermissionResource.PAYMENTS]: READ_UPDATE,
    [PermissionResource.REPORTS]: READ,
  },
};

export const PERMISSION_RESOURCE_META: Array<{
  key: PermissionResource;
  label: string;
  description: string;
}> = [
  {
    key: PermissionResource.DASHBOARD,
    label: 'Dashboard',
    description: 'Overview metrics and home page',
  },
  {
    key: PermissionResource.APPLICATIONS,
    label: 'Applications',
    description: 'Membership applications and review workflow',
  },
  {
    key: PermissionResource.MEMBERS,
    label: 'Members',
    description: 'Member profiles and renewals',
  },
  {
    key: PermissionResource.MEMBERSHIP_CATEGORIES,
    label: 'Categories',
    description: 'Membership categories and disciplines',
  },
  {
    key: PermissionResource.INSTITUTIONS,
    label: 'Institutions',
    description: 'Engineering institutions',
  },
  {
    key: PermissionResource.COMMUNICATION,
    label: 'Communication',
    description: 'Messages, templates, and history',
  },
  {
    key: PermissionResource.EVENTS,
    label: 'Events & Training',
    description: 'Events, registrations, and check-in',
  },
  {
    key: PermissionResource.PAYMENTS,
    label: 'Payments',
    description: 'Payment records and follow-up actions',
  },
  {
    key: PermissionResource.REPORTS,
    label: 'Reports',
    description: 'Reports and analytics exports',
  },
  {
    key: PermissionResource.ADMIN_USERS,
    label: 'Users',
    description: 'Admin portal user accounts',
  },
  {
    key: PermissionResource.SETTINGS,
    label: 'Settings',
    description: 'Fees, fiscal year, and system settings',
  },
];

/** Map admin portal menu paths → required resource (needs at least read). */
export const MENU_RESOURCE_BY_PATH: Record<string, PermissionResource> = {
  '/dashboard': PermissionResource.DASHBOARD,
  '/dashboard/applications': PermissionResource.APPLICATIONS,
  '/dashboard/members': PermissionResource.MEMBERS,
  '/dashboard/membership-categories': PermissionResource.MEMBERSHIP_CATEGORIES,
  '/dashboard/engineering-institutions': PermissionResource.INSTITUTIONS,
  '/dashboard/communication': PermissionResource.COMMUNICATION,
  '/dashboard/communication/send': PermissionResource.COMMUNICATION,
  '/dashboard/communication/history': PermissionResource.COMMUNICATION,
  '/dashboard/communication/templates': PermissionResource.COMMUNICATION,
  '/dashboard/events': PermissionResource.EVENTS,
  '/dashboard/payments': PermissionResource.PAYMENTS,
  '/dashboard/reports': PermissionResource.REPORTS,
  '/dashboard/admin-users': PermissionResource.ADMIN_USERS,
  '/dashboard/settings': PermissionResource.SETTINGS,
};
