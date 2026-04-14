import { ArrowDownToLine, ChevronDown, EllipsisVertical, Search, SlidersHorizontal } from "lucide-react";

type PaymentStatus = "Active" | "Inactive" | "Suspended";
type MembershipLevel = "Professional" | "Graduate" | "Technician" | "Fellow";

const paymentRows: Array<{
  memberName: string;
  email: string;
  transactionId: string;
  category: string;
  membershipLevel: MembershipLevel;
  status: PaymentStatus;
  initials?: string;
  avatarTone?: "teal" | "indigo" | "amber";
}> = [
  {
    memberName: "Sarah M. Kessy",
    email: "sarah.k@iet.co.tz",
    transactionId: "IET-2023-042",
    category: "Civil Engineering",
    membershipLevel: "Professional",
    status: "Active",
    avatarTone: "teal",
  },
  {
    memberName: "David J. Mwangi",
    email: "d.mwangi@gmail.com",
    transactionId: "IET-2023-115",
    category: "Mechanical Engineering",
    membershipLevel: "Graduate",
    status: "Active",
    initials: "DM",
    avatarTone: "indigo",
  },
  {
    memberName: "John A. Petro",
    email: "j.petro@engineers.org",
    transactionId: "IET-2022-889",
    category: "Electrical Engineering",
    membershipLevel: "Professional",
    status: "Inactive",
    avatarTone: "teal",
  },
  {
    memberName: "Elizabeth Lucas",
    email: "iz.lucas@tech.co.tz",
    transactionId: "IET-2023-005",
    category: "Telecommunications",
    membershipLevel: "Technician",
    status: "Active",
    initials: "EL",
    avatarTone: "amber",
  },
  {
    memberName: "Frank M. Swai",
    email: "frank.swai@iet.co.tz",
    transactionId: "IET-2021-330",
    category: "Structural Engineering",
    membershipLevel: "Fellow",
    status: "Suspended",
    avatarTone: "teal",
  },
];

function avatarClass(tone?: "teal" | "indigo" | "amber") {
  if (tone === "indigo") return "is-indigo";
  if (tone === "amber") return "is-amber";
  return "is-teal";
}

function levelClass(level: MembershipLevel) {
  if (level === "Graduate") return "is-graduate";
  if (level === "Technician") return "is-technician";
  if (level === "Fellow") return "is-fellow";
  return "is-professional";
}

function statusClass(status: PaymentStatus) {
  if (status === "Inactive") return "is-inactive";
  if (status === "Suspended") return "is-suspended";
  return "is-active";
}

export default function PaymentsPage() {
  return (
    <section className="admin-payments-page">
      <h1 className="admin-dashboard-title">Payments</h1>

      <section className="admin-payments-card">
        <div className="admin-payments-toolbar">
          <label className="admin-payments-search">
            <Search size={15} aria-hidden="true" />
            <input type="text" placeholder="Search members by name, ID or email..." />
          </label>

          <div className="admin-payments-actions">
            <button type="button" className="admin-payments-filter-btn">
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span>Filter Type</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>

            <button type="button" className="admin-payments-filter-btn">
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span>Status</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>

            <button type="button" className="admin-payments-icon-btn" aria-label="Export payments">
              <ArrowDownToLine size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="admin-payments-table-wrap">
          <table className="admin-payments-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Transaction ID</th>
                <th>Category</th>
                <th>Membership Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.map((row) => (
                <tr key={row.transactionId}>
                  <td>
                    <div className="admin-payment-member">
                      <div className={`admin-payment-avatar ${avatarClass(row.avatarTone)}`} aria-hidden="true">
                        {row.initials ? <span>{row.initials}</span> : null}
                      </div>
                      <div>
                        <p className="admin-payment-member-name">{row.memberName}</p>
                        <p className="admin-payment-member-email">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="admin-payment-id-cell">{row.transactionId}</td>
                  <td className="admin-payment-category-cell">{row.category}</td>
                  <td>
                    <span className={`admin-payment-pill level ${levelClass(row.membershipLevel)}`}>{row.membershipLevel}</span>
                  </td>
                  <td>
                    <span className={`admin-payment-pill status ${statusClass(row.status)}`}>{row.status}</span>
                  </td>
                  <td>
                    <div className="admin-payment-actions-cell">
                      <button type="button" className="admin-payment-details-btn">View Details</button>
                      <button type="button" className="admin-payment-more-btn" aria-label={`More actions for ${row.memberName}`}>
                        <EllipsisVertical size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-payments-footer">
          <p>Showing 1 to 5 of 1,240 results</p>
          <div className="admin-payments-pagination" aria-label="Pagination">
            <button type="button" className="admin-payments-page-btn">‹</button>
            <button type="button" className="admin-payments-page-btn is-active">1</button>
            <button type="button" className="admin-payments-page-btn">2</button>
            <button type="button" className="admin-payments-page-btn">3</button>
            <button type="button" className="admin-payments-page-btn is-ellipsis">...</button>
            <button type="button" className="admin-payments-page-btn">12</button>
            <button type="button" className="admin-payments-page-btn">›</button>
          </div>
        </div>
      </section>
    </section>
  );
}
