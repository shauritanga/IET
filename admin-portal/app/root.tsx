import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { ReactNode } from "react";
import type { Route } from "./+types/root";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./app.css";
import { ThemeProvider } from "~/providers/theme";

const queryClient = new QueryClient();
const themeInitScript = `
(function() {
  try {
    var key = "iet-theme";
    var stored = window.localStorage.getItem(key);
    var theme = stored === "dark" || stored === "light"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch (error) {}
})();
`;

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Source+Serif+4:wght@400;600;700&display=swap",
  },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen">
          <Outlet />
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Admin Portal Error";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Not Found" : "Request Failed";
    details = error.status === 404 ? "The requested page does not exist." : error.statusText;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-12 text-[var(--text)]">
      <section className="w-full max-w-2xl rounded-[22px] border border-[var(--border)] bg-white p-8 shadow-[0_18px_46px_rgba(57,9,9,0.08)]">
        <p className="font-montserrat text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
          Portal Error
        </p>
        <h1 className="mt-3 font-serif-display text-[34px] font-bold leading-none text-[var(--red-dark)]">
          {message}
        </h1>
        <p className="mt-3 max-w-xl font-montserrat text-[13px] leading-6 text-[var(--muted)]">
          {details}
        </p>
        {stack ? (
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-[var(--red-pale)] p-4 font-mono text-[11px] text-[var(--red-dark)]">
            {stack}
          </pre>
        ) : null}
      </section>
    </main>
  );
}
