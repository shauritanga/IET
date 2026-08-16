import type { CSSProperties, ChangeEvent, ReactNode } from "react";

export type CommunicationType = "SMS" | "EMAIL";
export type CommunicationTarget = "ALL" | "GROUP";
export type CommunicationStatus = "PENDING" | "SENT" | "FAILED";

export type MembershipCategory = {
  id: string;
  name: string;
  yearlyFee: number;
  minYearsExperience: number;
  description: string | null;
};

export type CommunicationMessage = {
  id: string;
  type: CommunicationType;
  target: CommunicationTarget;
  groupId: string | null;
  groupName: string | null;
  subject: string | null;
  message: string;
  status: CommunicationStatus;
  recipientCount: number;
  successfulCount: number;
  failedCount: number;
  createdAt: string;
  sentAt: string | null;
};

export type CommunicationTemplate = {
  id: string;
  name: string;
  type: CommunicationType;
  subject: string | null;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const MESSAGE_TYPES: Array<{ value: CommunicationType; label: string }> = [
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
];

export const RECIPIENT_OPTIONS: Array<{ value: CommunicationTarget; label: string }> = [
  { value: "ALL", label: "All Members" },
  { value: "GROUP", label: "Selected Group" },
];

export function typeLabel(type: CommunicationType) {
  return type === "EMAIL" ? "Email" : "SMS";
}

export function targetLabel(target: CommunicationTarget) {
  return target === "GROUP" ? "Group" : "All Members";
}

export function statusLabel(status: CommunicationStatus) {
  if (status === "SENT") return "Sent";
  if (status === "FAILED") return "Failed";
  return "Pending";
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function truncate(value: string, length = 96) {
  return value.length > length ? `${value.slice(0, length).trim()}…` : value;
}

export function SelectChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Native select with a visible chevron (appearance:none removes the browser arrow). */
export function SelectField({
  value,
  onChange,
  children,
  disabled,
  style,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const isAutoWidth = style?.width === "auto";

  return (
    <div
      className={className}
      style={{ position: "relative", width: isAutoWidth ? "auto" : "100%", display: isAutoWidth ? "inline-block" : "block" }}
    >
      <select
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "8px 32px 8px 12px",
          border: "1.5px solid var(--border)",
          borderRadius: 8,
          fontFamily: "inherit",
          fontSize: 12.5,
          color: "var(--text)",
          background: "var(--bg)",
          outline: "none",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          boxSizing: "border-box",
          cursor: disabled ? "not-allowed" : "pointer",
          ...style,
          paddingRight: 32,
        }}
      >
        {children}
      </select>
      <span
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--muted)",
          display: "flex",
          alignItems: "center",
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <SelectChevronIcon />
      </span>
    </div>
  );
}
