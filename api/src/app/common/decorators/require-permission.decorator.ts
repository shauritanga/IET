import { SetMetadata } from '@nestjs/common';
import {
  PermissionAction,
  PermissionResource,
} from '../permissions/permission.constants';

export const PERMISSION_KEY = 'required_permission';

export type RequiredPermission = {
  resource: PermissionResource;
  action: PermissionAction;
};

export const RequirePermission = (
  resource: PermissionResource,
  action: PermissionAction,
) => SetMetadata(PERMISSION_KEY, { resource, action } satisfies RequiredPermission);
