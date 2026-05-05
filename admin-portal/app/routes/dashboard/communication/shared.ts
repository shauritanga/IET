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
