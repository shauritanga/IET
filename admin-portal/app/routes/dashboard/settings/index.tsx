import type { AxiosError } from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  PageHeader,
} from "~/components/prototype-ui";
import { usePermissions } from "~/providers/permissions";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";
import { settings } from "~/data/admin-prototype";

type FiscalYearSettings = {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
};

type FeeAmountPair = {
  applicationFee: number;
  entryFee: number;
};

type ApplicationEntryFees = {
  graduate: FeeAmountPair;
  others: FeeAmountPair;
};

const DEFAULT_APPLICATION_ENTRY_FEES: ApplicationEntryFees = {
  graduate: { applicationFee: 500, entryFee: 0 },
  others: { applicationFee: 1000, entryFee: 0 },
};

function NumberInput({
  label,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  disabled?: boolean;
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
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
      {hint ? (
        <p className="mt-1 text-[10.5px] leading-4 text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export default function SettingsPage() {
  const { canUpdate } = usePermissions();
  const canEditSettings = canUpdate("settings");
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

  const [feeConfig, setFeeConfig] = useState<ApplicationEntryFees>(DEFAULT_APPLICATION_ENTRY_FEES);
  const [feesLoading, setFeesLoading] = useState(true);
  const [feesSaving, setFeesSaving] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);
  const [feesSavedMsg, setFeesSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    void loadFiscalYear();
    void loadApplicationEntryFees();
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

  async function loadApplicationEntryFees() {
    setFeesLoading(true);
    setFeesError(null);
    try {
      const { data } = await http.get<ApiEnvelope<ApplicationEntryFees>>(
        "/admin/settings/application-entry-fees",
      );
      if (data.data) {
        setFeeConfig(data.data);
      }
    } catch {
      setFeesError("Failed to load application and entry fee configuration.");
    } finally {
      setFeesLoading(false);
    }
  }

  async function saveApplicationEntryFees() {
    setFeesSaving(true);
    setFeesError(null);
    setFeesSavedMsg(null);
    try {
      const { data } = await http.put<ApiEnvelope<ApplicationEntryFees>>(
        "/admin/settings/application-entry-fees",
        feeConfig,
      );
      if (data.data) {
        setFeeConfig(data.data);
      }
      setFeesSavedMsg("Application and entry fees saved successfully.");
      setTimeout(() => setFeesSavedMsg(null), 3000);
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setFeesError(
        apiError.response?.data?.message ??
          "Failed to save application and entry fee configuration.",
      );
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
            <Button tone="dark" disabled={!canEditSettings}>Save Changes</Button>
          </div>
        </Card>

        <Card title="Application & Entry Fees">
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
              <p className="text-[12px] leading-5 text-[var(--muted)]">
                Application fee is paid when submitting. Entry fee is the one-time joining fee created after approval.
                Set entry fee to 0 to skip charging it.
              </p>

              <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg)] p-3">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--text)]">
                  Graduate
                </div>
                <div className="grid gap-[12px] md:grid-cols-2">
                  <NumberInput
                    label="Application Fee (TZS)"
                    value={feeConfig.graduate.applicationFee}
                    disabled={!canEditSettings}
                    onChange={(v) =>
                      setFeeConfig((prev) => ({
                        ...prev,
                        graduate: { ...prev.graduate, applicationFee: v },
                      }))
                    }
                  />
                  <NumberInput
                    label="Entry Fee (TZS)"
                    value={feeConfig.graduate.entryFee}
                    disabled={!canEditSettings}
                    onChange={(v) =>
                      setFeeConfig((prev) => ({
                        ...prev,
                        graduate: { ...prev.graduate, entryFee: v },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg)] p-3">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--text)]">
                  Others
                </div>
                <div className="grid gap-[12px] md:grid-cols-2">
                  <NumberInput
                    label="Application Fee (TZS)"
                    value={feeConfig.others.applicationFee}
                    disabled={!canEditSettings}
                    onChange={(v) =>
                      setFeeConfig((prev) => ({
                        ...prev,
                        others: { ...prev.others, applicationFee: v },
                      }))
                    }
                  />
                  <NumberInput
                    label="Entry Fee (TZS)"
                    value={feeConfig.others.entryFee}
                    disabled={!canEditSettings}
                    onChange={(v) =>
                      setFeeConfig((prev) => ({
                        ...prev,
                        others: { ...prev.others, entryFee: v },
                      }))
                    }
                  />
                </div>
              </div>

              {canEditSettings ? (
                <Button tone="dark" onClick={() => void saveApplicationEntryFees()} disabled={feesSaving}>
                  {feesSaving ? "Saving…" : "Save Fee Configuration"}
                </Button>
              ) : null}
            </div>
          )}
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
                  disabled={!canEditSettings}
                  onChange={(v) => setFiscalYear((prev) => ({ ...prev, startMonth: v }))}
                />
                <NumberInput
                  label="Start Day"
                  value={fiscalYear.startDay}
                  disabled={!canEditSettings}
                  onChange={(v) => setFiscalYear((prev) => ({ ...prev, startDay: v }))}
                />
                <NumberInput
                  label="End Month"
                  value={fiscalYear.endMonth}
                  disabled={!canEditSettings}
                  onChange={(v) => setFiscalYear((prev) => ({ ...prev, endMonth: v }))}
                />
                <NumberInput
                  label="End Day"
                  value={fiscalYear.endDay}
                  disabled={!canEditSettings}
                  onChange={(v) => setFiscalYear((prev) => ({ ...prev, endDay: v }))}
                />
              </div>
              {canEditSettings ? (
                <Button tone="dark" onClick={() => void saveFiscalYear()} disabled={fiscalSaving}>
                  {fiscalSaving ? "Saving…" : "Update Fiscal Year"}
                </Button>
              ) : null}
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
            <Button tone="dark" disabled={!canEditSettings}>Update Config</Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
