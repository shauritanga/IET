import type { LoaderFunctionArgs } from "react-router";

const DEVTOOLS_PROBE_PATH = "/.well-known/appspecific/com.chrome.devtools.json";

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);

    if (url.pathname === DEVTOOLS_PROBE_PATH) {
        return new Response(null, { status: 204 });
    }

    throw new Response("Not Found", { status: 404 });
}

export default function CatchAllRoute() {
    return null;
}
