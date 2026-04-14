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

const queryClient = new QueryClient();

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
  },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
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
    <QueryClientProvider client={queryClient}>
      <div className="page-shell">
        <Outlet />
      </div>
    </QueryClientProvider>
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
    <main className="content">
      <section className="panel">
        <p className="eyebrow">Portal Error</p>
        <h1 className="panel-title">{message}</h1>
        <p className="auth-subtitle">{details}</p>
        {stack ? <pre>{stack}</pre> : null}
      </section>
    </main>
  );
}
