import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
};

type ToastApi = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const TONE_COLOR: Record<ToastTone, string> = {
  success: "#16a34a",
  error: "#dc2626",
  info: "#2563eb",
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, title: string, description?: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, tone, title, description }]);
      timers.current.set(id, setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4500));
    },
    [dismiss],
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, description) => push("success", title, description),
      error: (title, description) => push("error", title, description),
      info: (title, description) => push("info", title, description),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-5 top-5 z-[9999] flex w-[calc(100vw-40px)] max-w-[380px] flex-col gap-2.5">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className="animate-toast-in pointer-events-auto flex items-start gap-3 rounded-[12px] border bg-white p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
            style={{ borderColor: "var(--border)", borderLeft: `4px solid ${TONE_COLOR[toast.tone]}` }}
          >
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: TONE_COLOR[toast.tone] }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                {toast.tone === "success" && <polyline points="20 6 9 17 4 12" />}
                {toast.tone === "error" && (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>)}
                {toast.tone === "info" && (<><line x1="12" y1="11" x2="12" y2="17" /><line x1="12" y1="7" x2="12" y2="7.01" /></>)}
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[12.5px] font-bold text-[var(--text)]">{toast.title}</p>
              {toast.description && (
                <p className="m-0 mt-0.5 break-words text-[11.5px] leading-snug text-[var(--muted)]">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 text-[var(--muted)] hover:text-[var(--text)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
