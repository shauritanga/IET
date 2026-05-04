import { CheckCircle2 } from "lucide-react";
import { Outlet, useLocation } from "react-router";

function Rings() {
  return (
    <svg
      viewBox="0 0 600 600"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full opacity-25"
      aria-hidden="true"
    >
      {[120, 200, 280, 360, 440, 520].map((radius, index) => (
        <circle
          key={radius}
          cx="300"
          cy="620"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.5"
          opacity={1 - index * 0.12}
        />
      ))}
    </svg>
  );
}

export default function AuthLayout() {
  const location = useLocation();
  const isOtp = location.pathname.includes("/auth/otp");
  const isForgotPassword = location.pathname.includes("/auth/forgot-password");
  const isResetPassword = location.pathname.includes("/auth/reset-password");
  const isPasswordFlow = isForgotPassword || isResetPassword;

  const rightTitle = isOtp
    ? "Secure Admin Access"
    : isPasswordFlow
      ? "Account Recovery"
      : "Welcome to IET Admin";

  const rightDescription = isOtp
    ? "Two-factor authentication protects IET Tanzania admin access. All admin actions are logged and audited."
    : isPasswordFlow
      ? "Password reset links are sent to your registered email and expire after 1 hour. Contact your system administrator if you continue to experience issues."
      : "Manage membership applications, members, events, payments, reports and system settings from one secure administrative portal.";

  return (
    <section className="fixed inset-0 z-[9000] flex bg-white">
      <div className="flex min-w-[340px] w-full flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10 md:w-1/2 md:px-14">
        <div className="w-full max-w-[360px]">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 h-[76px] w-[76px]">
              <img src="/IET-logo.png" alt="Institution of Engineers Tanzania" className="h-full w-full object-contain" />
            </div>
            <div className="font-serif-display text-[13px] font-extrabold leading-[1.35] text-[var(--red-dark)]">
              Institution of Engineers
              <br />
              Tanzania
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
              Admin Portal
            </div>
          </div>
          <div className="w-full">
            <Outlet />
          </div>
          <footer className="mt-6 text-center text-[11px] text-[var(--muted)]">
            © 2025 Institution of Engineers Tanzania
          </footer>
        </div>
      </div>

      <aside className="relative m-4 hidden flex-1 overflow-hidden rounded-l-2xl rounded-r-none bg-[linear-gradient(160deg,#390909_0%,#5C1010_45%,#390909_100%)] p-8 md:flex md:flex-col md:justify-end">
        <div className="pointer-events-none absolute inset-0">
          <Rings />
        </div>
        <div className="relative z-10 rounded-[14px] border border-white/15 bg-white/8 p-[22px] backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2 text-[14px] font-bold text-white">
            {isOtp ? (
              <>
                <span className="text-base">🔐</span>
                <span>{rightTitle}</span>
              </>
            ) : isPasswordFlow ? (
              <>
                <span className="text-base">🔑</span>
                <span>{rightTitle}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="text-white/80" />
                <span>{rightTitle}</span>
              </>
            )}
          </div>
          {!isOtp && !isPasswordFlow ? (
            <div className="mb-4 space-y-3 text-[12px] text-white/85">
              {[
                "Review & Approve Membership Applications",
                "Manage Members, Events & Payments",
                "Generate Reports and Configure System Settings",
              ].map((item) => (
                <div key={item} className="flex items-center gap-[9px]">
                  <CheckCircle2 size={16} className="text-white/65" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="text-[12px] leading-[1.65] text-white/72">{rightDescription}</div>
        </div>
      </aside>
    </section>
  );
}
