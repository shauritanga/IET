import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import http from "~/utils/http";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

type MembershipCardSummary = {
  id: string;
  status: string;
  membershipNumber: string;
  memberName: string;
  membershipCategory: string;
  specialization?: string | null;
  validUntil: string;
  issuedAt?: string | null;
};

type CardResponse = {
  issued: boolean;
  card: MembershipCardSummary | null;
};

const STATUS_LABELS: Record<string, string> = {
  ISSUED: "Issued — you can download and print",
  READY_FOR_COLLECTION: "Ready for collection at IET office",
  COLLECTED: "Physical card collected",
};

export default function MembershipCardPage() {
  const [data, setData] = useState<CardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: response } = await http.get<{ data: CardResponse }>(
          "/memberships/me/card",
        );
        setData(response.data);
      } catch (err) {
        const apiError = err as AxiosError<{ message?: string }>;
        setError(
          apiError.response?.data?.message ??
            "Unable to load membership card status.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function downloadPdf() {
    setDownloading(true);
    setError(null);
    try {
      const response = await http.get("/memberships/me/card/pdf", {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `IET-Membership-Card-${data?.card?.membershipNumber ?? "member"}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const apiError = err as AxiosError<{ message?: string }>;
      setError(
        apiError.response?.data?.message ??
          "Card is not available for download yet.",
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading membership card…
      </div>
    );
  }

  const card = data?.card;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--iet-red-dark,#7f1d1d)]">
          Membership Card
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download and print your official IET membership card once the
          Secretariat has issued it.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Card status</CardTitle>
          <CardDescription>
            {data?.issued && card
              ? STATUS_LABELS[card.status] ?? card.status
              : "Not issued yet"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!data?.issued || !card ? (
            <p className="text-sm text-muted-foreground">
              Your membership card will appear here after the Secretariat
              issues it. You will also receive an email and SMS notification.
            </p>
          ) : (
            <>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-semibold">{card.memberName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Membership No.</dt>
                  <dd className="font-semibold font-mono">{card.membershipNumber}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-semibold">{card.membershipCategory}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Specialization</dt>
                  <dd className="font-semibold">{card.specialization || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Valid until</dt>
                  <dd className="font-semibold">
                    {new Date(card.validUntil).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
              <Button onClick={() => void downloadPdf()} disabled={downloading}>
                {downloading ? "Preparing PDF…" : "Download / Print Card"}
              </Button>
              {card.status === "READY_FOR_COLLECTION" ? (
                <p className="text-sm text-amber-800">
                  A printed card is ready for collection at the IET office.
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
