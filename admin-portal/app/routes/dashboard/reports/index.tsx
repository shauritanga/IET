import { reports } from "~/data/admin-prototype";
import { Button, Card, PageHeader } from "~/components/prototype-ui";

export default function ReportsPage() {
  return (
    <section>
      <PageHeader
        title="Reports & Analytics"
        description="Generate and export IET Tanzania operational reports"
      />

      <div className="grid gap-[14px] md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title} hoverable>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[10px] bg-[var(--red-pale)]">
                <div className="h-5 w-5 rounded border border-[var(--red)]" />
              </div>
              <div className="mb-[5px] text-[13px] font-bold text-[var(--red-dark)]">{report.title}</div>
              <div className="mb-[14px] text-[11px] leading-[1.5] text-[var(--muted)]">{report.description}</div>
              <Button tone="dark">Generate Report</Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
