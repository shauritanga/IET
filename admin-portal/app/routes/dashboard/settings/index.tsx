import type { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  PageHeader,
} from "~/components/prototype-ui";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";
import { settings } from "~/data/admin-prototype";

type FiscalYearSettings = {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
};

function NumberInput({
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
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [showPaymentSecrets, setShowPaymentSecrets] = useState(false);
  const [fiscalYear, setFiscalYear] = useState<FiscalYearSettings>({
    startMonth: 7,
    startDay: 11,
    endMonth: 7,
    endDay: 10,
  });
  const [fiscalLoading, setFiscalLoading] = useState(true);
  const [fiscalSaving, setFiscalSaving] = useState(false);
  const [fiscalError, setFiscalError] = useState<string | null>(null);
  const [fiscalSavedMsg, setFiscalSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    void loadFiscalYear();
  }, []);

  async function loadFiscalYear() {
    setFiscalLoading(true);
    setFiscalError(null);
    try {
      const { data } = await http.get<ApiEnvelope<FiscalYearSettings>>("/admin/settings/fiscal-year");
      if (data.data) {
        setFiscalYear(data.data);
      }
    } catch {
      setFiscalError("Failed to load fiscal year configuration.");
    } finally {
      setFiscalLoading(false);
    }
  }

  async function saveFiscalYear() {
    setFiscalSaving(true);
    setFiscalError(null);
    setFiscalSavedMsg(null);
    try {
      const { data } = await http.put<ApiEnvelope<FiscalYearSettings>>("/admin/settings/fiscal-year", fiscalYear);
      if (data.data) {
        setFiscalYear(data.data);
      }
      setFiscalSavedMsg("Fiscal year configuration saved successfully.");
      setTimeout(() => setFiscalSavedMsg(null), 3000);
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setFiscalError(apiError.response?.data?.message ?? "Failed to save fiscal year configuration.");
    } finally {
      setFiscalSaving(false);
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

        <Card title="Membership Fiscal Year">
          {fiscalLoading ? (
            <div className="py-6 text-center text-[12px] text-[var(--muted)]">
              Loading fiscal year configuration…
            </div>
          ) : (
            <div className="space-y-[14px]">
              {fiscalError && (
                <div className="rounded-[8px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
                  {fiscalError}
                </div>
              )}
              {fiscalSavedMsg && (
                <div className="rounded-[8px] border border-[#b7e4c7] bg-[#e8f5e9] px-3 py-2 text-[11.5px] font-semibold text-[#1a6b3c]">
                  {fiscalSavedMsg}
                </div>
              )}
              <p className="text-[12px] leading-5 text-[var(--muted)]">
                Active memberships expire after the fiscal year end date. Members will be asked to renew after that date.
              </p>
              <div className="grid gap-[12px] md:grid-cols-2">
                <NumberInput
                  label="Start Month"
                  value={fiscalYear.startMonth}
                  onChange={(v) => setFiscalYear((prev) => ({ ...prev, startMonth: v }))}
                />
                <NumberInput
                  label="Start Day"
                  value={fiscalYear.startDay}
                  onChange={(v) => setFiscalYear((prev) => ({ ...prev, startDay: v }))}
                />
                <NumberInput
                  label="End Month"
                  value={fiscalYear.endMonth}
                  onChange={(v) => setFiscalYear((prev) => ({ ...prev, endMonth: v }))}
                />
                <NumberInput
                  label="End Day"
                  value={fiscalYear.endDay}
                  onChange={(v) => setFiscalYear((prev) => ({ ...prev, endDay: v }))}
                />
              </div>
              <Button tone="dark" onClick={() => void saveFiscalYear()} disabled={fiscalSaving}>
                {fiscalSaving ? "Saving…" : "Update Fiscal Year"}
              </Button>
            </div>
          )}
        </Card>

        <Card title="Selcom Payment Config">
          <div className="space-y-[14px]">
            {settings.paymentConfig.map((field, index) => (
              <div key={field.label}>
                <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    readOnly
                    type={index < 2 && !showPaymentSecrets ? "password" : "text"}
                    value={field.value}
                    className={`w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none ${index < 2 ? "pr-10" : ""}`}
                  />
                  {index < 2 ? (
                    <button
                      type="button"
                      onClick={() => setShowPaymentSecrets((value) => !value)}
                      className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[var(--muted)] transition hover:text-[var(--text)]"
                      aria-label={showPaymentSecrets ? "Hide secrets" : "Show secrets"}
                      aria-pressed={showPaymentSecrets}
                    >
                      {showPaymentSecrets ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  ) : null}
                </div>
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
