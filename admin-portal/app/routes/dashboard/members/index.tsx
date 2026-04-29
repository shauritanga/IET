import { members } from "~/data/admin-prototype";
import { Button, StatusBadge } from "~/components/prototype-ui";

const avatarColors: Record<string, string> = {
  red: "bg-[var(--red)]",
  blue: "bg-[#1565C0]",
  green: "bg-[#2E7D32]",
  pink: "bg-[#880E4F]",
  orange: "bg-[#B45309]",
};

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function MembersAvatar({
  initials,
  tone,
}: {
  initials: string;
  tone: keyof typeof avatarColors;
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

export default function MembersPage() {
  return (
    <section>
      <div className="mb-[18px] flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">Members Directory</h1>
          <p className="mt-[2px] text-[11px] text-[var(--muted)]">
            Manage all IET Tanzania registered members
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-[7px] rounded-[7px] border border-[var(--border)] bg-white px-[10px] py-[6px]">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search members…"
              className="w-[160px] border-none bg-transparent text-[12px] text-[var(--text)] outline-none"
            />
          </div>
          <Button tone="red">+ Add Member</Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white">
        <div className="overflow-x-auto">
          <table className="table-proto min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th>Member</th>
                <th>Membership No.</th>
                <th>Grade</th>
                <th>Discipline</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <MembersAvatar initials={member.initials} tone={member.tone} />
                      <div>
                        <div className="text-[12px] font-semibold">{member.name}</div>
                        <div className="text-[10px] text-[var(--muted)]">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-[11px]">{member.id}</td>
                  <td className="text-[11.5px]">{member.grade}</td>
                  <td className="text-[11.5px]">{member.discipline}</td>
                  <td>
                    <StatusBadge tone={member.badge}>{member.status}</StatusBadge>
                  </td>
                  <td className="text-[11.5px]">{member.expires}</td>
                  <td>
                    <div className="flex gap-[5px]">
                      <Button>Edit</Button>
                      {member.status === "Expired" ? (
                        <Button tone="green">Renew</Button>
                      ) : member.status === "Pending Payment" ? null : (
                        <Button className="border-[var(--red-light)] text-[var(--red)]">Suspend</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
