import { Outlet, redirect, type LoaderFunctionArgs } from "react-router";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.pathname === "/dashboard/communication" || url.pathname === "/dashboard/communication/") {
    return redirect(`/dashboard/communication/send${url.search}`);
  }

  return null;
};

export default function CommunicationIndex() {
  return <Outlet />;
}
