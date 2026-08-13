import type { AxiosResponse } from "axios";

/** Parses the filename out of a Content-Disposition header, e.g. `attachment; filename="foo.csv"`. */
function parseFilename(contentDisposition: string | undefined, fallback: string): string {
  if (!contentDisposition) return fallback;
  const match = /filename="?([^"]+)"?/.exec(contentDisposition);
  return match?.[1] ?? fallback;
}

/** Triggers a browser download for a blob axios response (e.g. a report export). */
export function downloadBlob(response: AxiosResponse<Blob>, fallbackFilename: string) {
  const filename = parseFilename(response.headers["content-disposition"], fallbackFilename);
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
