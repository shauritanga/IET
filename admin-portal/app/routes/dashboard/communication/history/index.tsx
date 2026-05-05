import type { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";
import {
  formatDateTime,
  statusLabel,
  targetLabel,
  truncate,
  type CommunicationMessage,
  type CommunicationStatus,
  type CommunicationTarget,
  type CommunicationType,
  typeLabel,
} from "../shared";

type HistoryFilter = {
  type: CommunicationType | "";
  target: CommunicationTarget | "";
  status: CommunicationStatus | "";
  search: string;
};

const PAGE_SIZE = 10;

const EMPTY_FILTER: HistoryFilter = {
  type: "",
  target: "",
  status: "",
  search: "",
};

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function StatusBadge({ status }: { status: CommunicationMessage["status"] }) {
  const tone =
    status === "SENT"
      ? { bg: "#f0fdf4", color: "#15803d", dot: "#16a34a" }
      : status === "FAILED"
        ? { bg: "#fef2f2", color: "#b91c1c", dot: "#dc2626" }
        : { bg: "#fffbeb", color: "#b45309", dot: "#d97706" };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: tone.bg, color: tone.color, borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: tone.dot }} />
      {statusLabel(status)}
    </span>
  );
}

function MessageTypePill({ type }: { type: CommunicationType }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "4px 10px", background: type === "EMAIL" ? "#eff6ff" : "#f0fdf4", color: type === "EMAIL" ? "#1d4ed8" : "#15803d", fontSize: 11, fontWeight: 700 }}>
      {type === "EMAIL" ? "Email" : "SMS"}
    </span>
  );
}

export default function CommunicationHistoryPage() {
  const [filters, setFilters] = useState<HistoryFilter>(EMPTY_FILTER);
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const queryKey = useMemo(
    () => JSON.stringify({ ...filters, page }),
    [filters, page],
  );

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));
        if (filters.type) params.set("type", filters.type);
        if (filters.target) params.set("target", filters.target);
        if (filters.status) params.set("status", filters.status);
        if (filters.search.trim()) params.set("search", filters.search.trim());

        const { data } = await http.get<ApiEnvelope<CommunicationMessage[]>>(
          `/communication/history?${params.toString()}`,
        );

        if (!active) return;
        setMessages(data.data ?? []);
        setTotal(data.meta?.total ?? 0);
        setTotalPages(data.meta?.totalPages ?? 1);
        if ((data.meta?.totalPages ?? 1) > 0 && page > (data.meta?.totalPages ?? 1)) {
          setPage(1);
        }
      } catch (err) {
        if (!active) return;
        const e = err as AxiosError<{ message?: string }>;
        setError(e.response?.data?.message ?? "Failed to load message history.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [queryKey, page]);

  function setFilter(field: keyof HistoryFilter) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value as HistoryFilter[typeof field];
      setPage(1);
      setFilters((prev) => ({ ...prev, [field]: value }));
    };
  }

  function clearFilters() {
    setFilters(EMPTY_FILTER);
    setPage(1);
  }

  const sentCount = messages.filter((message) => message.status === "SENT").length;
  const failedCount = messages.filter((message) => message.status === "FAILED").length;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: "var(--red-dark)", margin: 0 }}>Message History</h1>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            Review bulk SMS and Email campaigns sent from the admin portal.
          </p>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--border)", borderRadius: 999, background: "var(--white)", padding: "7px 12px", fontSize: 11.5, color: "var(--muted)" }}>
          <MessageIcon />
          <span>{total} campaigns</span>
        </div>
      </div>

      <div className="grid gap-[14px] md:grid-cols-3">
        <article className="rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">Visible</div>
          <div className="mt-1 text-[24px] font-bold leading-none text-[var(--red-dark)]">{messages.length}</div>
        </article>
        <article className="rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">Sent on page</div>
          <div className="mt-1 text-[24px] font-bold leading-none text-[var(--red-dark)]">{sentCount}</div>
        </article>
        <article className="rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">Failed on page</div>
          <div className="mt-1 text-[24px] font-bold leading-none text-[var(--red-dark)]">{failedCount}</div>
        </article>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "7px 12px", flex: 1, minWidth: 220, maxWidth: 320 }}>
          <span style={{ color: "var(--muted)" }}><SearchIcon /></span>
          <input
            type="text"
            placeholder="Search messages…"
            value={filters.search}
            onChange={setFilter("search")}
            style={{ border: "none", background: "transparent", fontSize: 12, color: "var(--text)", outline: "none", width: "100%", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <select value={filters.type} onChange={setFilter("type")} style={{ ...selectStyle, width: "auto", paddingRight: 28 }}>
            <option value="">All Types</option>
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }}><ChevronIcon /></span>
        </div>

        <div style={{ position: "relative" }}>
          <select value={filters.target} onChange={setFilter("target")} style={{ ...selectStyle, width: "auto", paddingRight: 28 }}>
            <option value="">All Targets</option>
            <option value="ALL">All Members</option>
            <option value="GROUP">Selected Group</option>
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }}><ChevronIcon /></span>
        </div>

        <div style={{ position: "relative" }}>
          <select value={filters.status} onChange={setFilter("status")} style={{ ...selectStyle, width: "auto", paddingRight: 28 }}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }}><ChevronIcon /></span>
        </div>

        {(filters.search || filters.type || filters.target || filters.status) && (
          <button
            type="button"
            onClick={clearFilters}
            style={{ fontSize: 11.5, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontWeight: 600 }}
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "var(--red)" }}>
          {error}
        </div>
      )}

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--red-dark)", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading message history…</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--red-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--red)" }}>
              <MessageIcon />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--red-dark)", marginBottom: 4 }}>No messages found</p>
            <p style={{ fontSize: 11.5, color: "var(--muted)" }}>{filters.search || filters.type || filters.target || filters.status ? "Try adjusting your filters." : "Send a message to see history here."}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  {["Message", "Type", "Target", "Status", "Recipients", "Date"].map((head) => (
                    <th key={head}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr key={message.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>
                          {message.subject ?? truncate(message.message, 56)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{truncate(message.message, 110)}</div>
                      </div>
                    </td>
                    <td><MessageTypePill type={message.type} /></td>
                    <td style={{ fontSize: 11.5, color: "var(--text)" }}>
                      {targetLabel(message.target)}
                      {message.target === "GROUP" && message.groupName ? ` • ${message.groupName}` : ""}
                    </td>
                    <td><StatusBadge status={message.status} /></td>
                    <td style={{ fontSize: 11.5, color: "var(--text)" }}>
                      <div>{message.recipientCount}</div>
                      <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{message.successfulCount} sent • {message.failedCount} failed</div>
                    </td>
                    <td style={{ fontSize: 11.5, color: "var(--text)" }}>
                      <div>{formatDateTime(message.sentAt ?? message.createdAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              style={{ width: 30, height: 30, border: "1.5px solid var(--border)", borderRadius: 7, background: "var(--white)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", fontSize: 13, fontWeight: 700 }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPage(value)}
                style={{
                  width: 30,
                  height: 30,
                  border: "1.5px solid",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontSize: 11.5,
                  fontWeight: 700,
                  borderColor: page === value ? "var(--red)" : "var(--border)",
                  background: page === value ? "var(--red)" : "var(--white)",
                  color: page === value ? "white" : "var(--text)",
                }}
              >
                {value}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              style={{ width: 30, height: 30, border: "1.5px solid var(--border)", borderRadius: 7, background: "var(--white)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", fontSize: 13, fontWeight: 700 }}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1.5px solid var(--border)",
  borderRadius: 8,
  fontFamily: "inherit",
  fontSize: 12.5,
  color: "var(--text)",
  background: "var(--bg)",
  outline: "none",
  appearance: "none",
  boxSizing: "border-box",
};
