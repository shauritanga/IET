import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Button,
  Card,
  PageHeader,
} from "~/components/prototype-ui";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";
import { settings } from "~/data/admin-prototype";

type FeeConfig = Record<string, number>;

const FEE_CLASS_LABELS: Record<string, string> = {
  GRADUATE: "Graduate Member",
  ASSOCIATE: "Associate Member (AMIET)",
  MIET: "Member (MIET)",
  CORPORATE: "Corporate Member (CMIET)",
  SENIOR: "Senior Member (SMIET)",
  FELLOW: "Fellow (FIET)",
  HONORARY: "Honorary Fellow",
};

function FeeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11.5px] font-semibold text-[var(--muted)]">
          TZS
        </span>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] py-[9px] pl-10 pr-3 text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [fees, setFees] = useState<FeeConfig>({});
  const [feesLoading, setFeesLoading] = useState(true);
  const [feesSaving, setFeesSaving] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);
  const [feesSavedMsg, setFeesSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    void loadFees();
  }, []);

  async function loadFees() {
    setFeesLoading(true);
    setFeesError(null);
    try {
      const { data } = await http.get<ApiEnvelope<FeeConfig>>("/admin/settings/fees");
      setFees(data.data ?? {});
    } catch {
      setFeesError("Failed to load fee configuration.");
    } finally {
      setFeesLoading(false);
    }
  }

  async function saveFees() {
    setFeesSaving(true);
    setFeesError(null);
    setFeesSavedMsg(null);
    try {
      await http.put<ApiEnvelope<FeeConfig>>("/admin/settings/fees", fees);
      setFeesSavedMsg("Fee configuration saved successfully.");
      setTimeout(() => setFeesSavedMsg(null), 3000);
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setFeesError(apiError.response?.data?.message ?? "Failed to save fees.");
    } finally {
      setFeesSaving(false);
    }
  }

  return (
    <section>
      <PageHeader
        title="System Settings"
        description="Configure IET Tanzania portal system settings"
      />

      <div className="grid gap-[18px] xl:grid-cols-2">
        <Card title="Organisation Details">
          <div className="space-y-[14px]">
            {settings.organization.map((field) => (
              <div key={field.label}>
                <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
                  {field.label}
                </label>
                <input
                  readOnly
                  value={field.value}
                  className="w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none"
                />
              </div>
            ))}
            <Button tone="dark">Save Changes</Button>
          </div>
        </Card>

        <Card title="Membership Fees (TZS)">
          {feesLoading ? (
            <div className="py-6 text-center text-[12px] text-[var(--muted)]">
              Loading fee configuration…
            </div>
          ) : (
            <div className="space-y-[14px]">
              {feesError && (
                <div className="rounded-[8px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
                  {feesError}
                </div>
              )}
              {feesSavedMsg && (
                <div className="rounded-[8px] border border-[#b7e4c7] bg-[#e8f5e9] px-3 py-2 text-[11.5px] font-semibold text-[#1a6b3c]">
                  {feesSavedMsg}
                </div>
              )}
              {Object.entries(fees).map(([cls, amount]) => (
                <FeeInput
                  key={cls}
                  label={FEE_CLASS_LABELS[cls] ?? cls}
                  value={amount}
                  onChange={(v) => setFees((prev) => ({ ...prev, [cls]: v }))}
                />
              ))}
              <Button tone="dark" onClick={() => void saveFees()} disabled={feesSaving}>
                {feesSaving ? "Saving…" : "Update Fees"}
              </Button>
            </div>
          )}
        </Card>

        <Card title="Users">
          <div className="space-y-[12px]">
            <p className="text-[12px] leading-5 text-[var(--muted)]">
              Create portal users and assign workflow roles for Secretariat,
              Evaluator, MPDC, Council, Admin, and Super Admin access.
            </p>
            <Link to="/dashboard/admin-users">
              <Button tone="dark">Manage Users</Button>
            </Link>
          </div>
        </Card>

        <Card title="Selcom Payment Config">
          <div className="space-y-[14px]">
            {settings.paymentConfig.map((field, index) => (
              <div key={field.label}>
                <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
                  {field.label}
                </label>
                <input
                  readOnly
                  type={index < 2 ? "password" : "text"}
                  value={field.value}
                  className="w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none"
                />
              </div>
            ))}
            <div className="mb-[14px] flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
              <span className="text-[11.5px] font-semibold text-[var(--success)]">
                Selcom integration active
              </span>
            </div>
            <Button tone="dark">Update Config</Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
