import type { PermissionAction, PermissionMatrix, PermissionResource } from "~/utils/permissions";
import { ALL_ACTIONS } from "~/utils/permissions";

type ResourceMeta = {
  key: PermissionResource;
  label: string;
  description: string;
};

type Props = {
  resources: ResourceMeta[];
  value: PermissionMatrix;
  onChange: (next: PermissionMatrix) => void;
  disabled?: boolean;
  usingRoleDefaults: boolean;
  onResetToRoleDefaults: () => void;
};

const ACTION_LABELS: Record<PermissionAction, string> = {
  read: "Read",
  create: "Create",
  update: "Update",
  delete: "Delete",
};

export function PermissionMatrixEditor({
  resources,
  value,
  onChange,
  disabled,
  usingRoleDefaults,
  onResetToRoleDefaults,
}: Props) {
  function toggle(resource: PermissionResource, action: PermissionAction) {
    const current = new Set(value[resource] ?? []);
    if (current.has(action)) {
      current.delete(action);
    } else {
      current.add(action);
      if (action !== "read") current.add("read");
    }
    onChange({
      ...value,
      [resource]: ALL_ACTIONS.filter((item) => current.has(item)),
    });
  }

  function toggleAll(resource: PermissionResource, checked: boolean) {
    onChange({
      ...value,
      [resource]: checked ? [...ALL_ACTIONS] : [],
    });
  }

  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg)]/40 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[12px] font-bold text-[var(--text)]">Permissions</div>
          <div className="text-[10.5px] text-[var(--muted)]">
            {usingRoleDefaults
              ? "Using role defaults. Change any checkbox to customize for this user."
              : "Custom permissions for this user (overrides role defaults)."}
          </div>
        </div>
        <button
          type="button"
          onClick={onResetToRoleDefaults}
          disabled={disabled || usingRoleDefaults}
          className="rounded-[7px] border border-[var(--border)] bg-white px-2.5 py-1.5 text-[10.5px] font-semibold text-[var(--text)] disabled:opacity-50"
        >
          Reset to role defaults
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
              <th className="pb-2 pr-3 font-semibold">Resource</th>
              {ALL_ACTIONS.map((action) => (
                <th key={action} className="pb-2 px-2 text-center font-semibold">
                  {ACTION_LABELS[action]}
                </th>
              ))}
              <th className="pb-2 pl-2 text-center font-semibold">All</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => {
              const selected = new Set(value[resource.key] ?? []);
              const allChecked = ALL_ACTIONS.every((action) => selected.has(action));
              return (
                <tr key={resource.key} className="border-t border-[var(--border)]">
                  <td className="py-2 pr-3 align-top">
                    <div className="text-[11.5px] font-semibold text-[var(--text)]">{resource.label}</div>
                    <div className="text-[10px] text-[var(--muted)]">{resource.description}</div>
                  </td>
                  {ALL_ACTIONS.map((action) => (
                    <td key={action} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(action)}
                        disabled={disabled}
                        onChange={() => toggle(resource.key, action)}
                        aria-label={`${resource.label} ${ACTION_LABELS[action]}`}
                      />
                    </td>
                  ))}
                  <td className="py-2 pl-2 text-center">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      disabled={disabled}
                      onChange={(event) => toggleAll(resource.key, event.target.checked)}
                      aria-label={`${resource.label} all actions`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
