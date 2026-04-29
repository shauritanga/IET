import { useMemo, useState } from "react";
import {
  applications as initialApplications,
  type ApplicationWorkflowStage,
  type AvatarTone,
  type StatusTone,
} from "~/data/admin-prototype";
import { Button, Modal, StatusBadge } from "~/components/prototype-ui";

type ApplicationRecord = {
  id: string;
  name: string;
  email: string;
  initials: string;
  tone: AvatarTone;
  grade: string;
  discipline: string;
  submitted: string;
  status: "Pending" | "Approved" | "Rejected";
  badge: StatusTone;
  stage: ApplicationWorkflowStage;
  queueOwner: string;
  assignedEvaluator: string;
};

const avatarColors: Record<ApplicationRecord["tone"], string> = {
  red: "bg-[var(--red)]",
  blue: "bg-[#1565C0]",
  purple: "bg-[#4527A0]",
  green: "bg-[#2E7D32]",
  pink: "bg-[#880E4F]",
  orange: "bg-[#F97316]",
};

const stageTone: Record<ApplicationWorkflowStage, "pending" | "blue" | "warning" | "approved"> = {
  "Secretariat Review": "warning",
  "Evaluator Review": "blue",
  "MPDC Review": "pending",
  "Council Review": "pending",
  "Approval Note Sent": "approved",
};

const stageOptions = [
  "All Stages",
  "Secretariat Review",
  "Evaluator Review",
  "MPDC Review",
  "Council Review",
  "Approval Note Sent",
] as const;

const evaluatorOptions = [
  "Eng. Joseph Mushi",
  "Eng. Neema Kweka",
  "Eng. Dora Nyerere",
  "Eng. Lucas Mrema",
  "Eng. Miriam Kileo",
] as const;

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-[34px] rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] pr-8 text-[11.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function ApplicationsAvatar({
  initials,
  tone,
}: {
  initials: string;
  tone: ApplicationRecord["tone"];
}) {
  return (
    <div
      className={`${avatarColors[tone]} flex h-[30px] w-[30px] items-center justify-center rounded-full text-[10px] font-bold text-white`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function ApplicationsCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white">
      {children}
    </section>
  );
}

export default function ApplicationsPage() {
  const [applicationRows, setApplicationRows] =
    useState<Array<ApplicationRecord>>(initialApplications.map((row) => ({ ...row })));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>(evaluatorOptions[0]);
  const [adminNotes, setAdminNotes] = useState("");

  const selectedApplicant = applicationRows.find((application) => application.id === selectedId) ?? null;

  const visibleApplications = useMemo(
    () =>
      applicationRows.filter((application) => {
        const matchesStatus =
          statusFilter === "All Status" || application.status === statusFilter;
        const matchesStage =
          stageFilter === "All Stages" || application.stage === stageFilter;
        return matchesStatus && matchesStage;
      }),
    [applicationRows, stageFilter, statusFilter],
  );

  const openApplication = (application: ApplicationRecord) => {
    setSelectedId(application.id);
    setSelectedEvaluator(application.assignedEvaluator === "—" ? evaluatorOptions[0] : application.assignedEvaluator);
    setAdminNotes("");
  };

  const closeModal = () => {
    setSelectedId(null);
    setAdminNotes("");
  };

  const updateApplication = (next: ApplicationRecord) => {
    setApplicationRows((current) =>
      current.map((application) => (application.id === next.id ? next : application)),
    );
    closeModal();
  };

  const handleAdvance = () => {
    if (!selectedApplicant) return;

    switch (selectedApplicant.stage) {
      case "Secretariat Review":
        updateApplication({
          ...selectedApplicant,
          stage: "Evaluator Review",
          queueOwner: "Evaluator",
          assignedEvaluator: selectedEvaluator,
        });
        break;
      case "Evaluator Review":
        updateApplication({
          ...selectedApplicant,
          stage: "MPDC Review",
          queueOwner: "MPDC",
        });
        break;
      case "MPDC Review":
        updateApplication({
          ...selectedApplicant,
          stage: "Council Review",
          queueOwner: "Council",
        });
        break;
      case "Council Review":
        updateApplication({
          ...selectedApplicant,
          stage: "Approval Note Sent",
          status: "Approved",
          badge: "approved",
          queueOwner: "Council",
        });
        break;
      default:
        closeModal();
    }
  };

  const handleReject = () => {
    if (!selectedApplicant) return;
    updateApplication({
      ...selectedApplicant,
      status: "Rejected",
      badge: "rejected",
    });
  };

  const handleReturnForChanges = () => {
    if (!selectedApplicant) return;
    updateApplication({
      ...selectedApplicant,
      status: "Pending",
      badge: "warning",
      stage: "Secretariat Review",
      queueOwner: "Secretariat",
      assignedEvaluator: "—",
    });
  };

  return (
    <section>
      <div className="mb-[18px] flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">Membership Applications</h1>
          <p className="mt-[2px] text-[11px] text-[var(--muted)]">
            Review and move each application through the approval workflow
          </p>
        </div>
        <div className="flex gap-2">
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={["All Status", "Pending", "Approved", "Rejected"]} />
          <FilterSelect value={stageFilter} onChange={setStageFilter} options={stageOptions} />
        </div>
      </div>

      <ApplicationsCard>
        <div className="overflow-x-auto">
          <table className="table-proto min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Grade Applied</th>
                <th>Stage</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleApplications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <ApplicationsAvatar initials={application.initials} tone={application.tone} />
                      <div>
                        <div className="text-[12px] font-semibold">{application.name}</div>
                        <div className="text-[10px] text-[var(--muted)]">{application.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-[11.5px]">{application.grade}</td>
                  <td>
                    <StatusBadge tone={stageTone[application.stage]}>{application.stage}</StatusBadge>
                  </td>
                  <td className="text-[11.5px]">{application.assignedEvaluator}</td>
                  <td>
                    <StatusBadge tone={application.badge}>{application.status}</StatusBadge>
                  </td>
                  <td>
                    <div className="flex gap-[6px]">
                      <Button
                        tone={application.badge === "pending" ? "dark" : "outline"}
                        onClick={() => openApplication(application)}
                      >
                        {application.badge === "pending" ? "Review" : "View"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ApplicationsCard>

      <Modal
        title={selectedApplicant ? `Workflow: ${selectedApplicant.name}` : "Application Workflow"}
        open={Boolean(selectedApplicant)}
        onClose={closeModal}
      >
        {selectedApplicant ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-x-5 gap-y-[10px] rounded-[10px] border border-[var(--border)] bg-[var(--red-pale)] p-4">
              <div>
                <div className="text-[9.5px] uppercase tracking-[0.6px] text-[var(--muted)]">Applicant</div>
                <div className="mt-[2px] text-[13px] font-bold text-[var(--text)]">{selectedApplicant.name}</div>
              </div>
              <div>
                <div className="text-[9.5px] uppercase tracking-[0.6px] text-[var(--muted)]">Grade Applied</div>
                <div className="mt-[2px] text-[13px] font-bold text-[var(--text)]">{selectedApplicant.grade}</div>
              </div>
              <div>
                <div className="text-[9.5px] uppercase tracking-[0.6px] text-[var(--muted)]">Current Stage</div>
                <div className="mt-[2px] text-[12px] font-semibold text-[var(--text)]">{selectedApplicant.stage}</div>
              </div>
              <div>
                <div className="text-[9.5px] uppercase tracking-[0.6px] text-[var(--muted)]">Submitted</div>
                <div className="mt-[2px] text-[12px] font-semibold text-[var(--text)]">{selectedApplicant.submitted}</div>
              </div>
            </div>

            {selectedApplicant.stage === "Secretariat Review" ? (
              <div className="mb-4">
                <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
                  Assign Evaluator
                </label>
                <FilterSelect value={selectedEvaluator} onChange={setSelectedEvaluator} options={evaluatorOptions} />
              </div>
            ) : null}

            <div>
              <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
                Admin Notes / Reason
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(event) => setAdminNotes(event.target.value)}
                placeholder="Add notes about this workflow decision…"
                className="w-full resize-y rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
              />
            </div>

            <div className="mt-[14px] flex justify-end gap-[9px] border-t border-[var(--border)] pt-[14px]">
              <Button tone="outline" onClick={closeModal}>
                Cancel
              </Button>
              {selectedApplicant.status === "Pending" ? (
                <>
                  <Button tone="outline" className="border-[var(--red-light)] text-[var(--red)]" onClick={handleReturnForChanges}>
                    Return for Changes
                  </Button>
                  <Button tone="outline" className="border-[var(--red-light)] text-[var(--red)]" onClick={handleReject}>
                    Reject
                  </Button>
                  <Button tone="green" onClick={handleAdvance}>
                    {selectedApplicant.stage === "Council Review" ? "Approve & Notify" : "Advance Stage"}
                  </Button>
                </>
              ) : null}
            </div>
          </>
        ) : null}
      </Modal>
    </section>
  );
}
