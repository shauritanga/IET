import { useOutletContext } from "react-router"
import { DashboardMembershipPage } from "~/components/portal/dashboard-pages"
import type { DashboardLayoutContext } from "~/routes/dashboard/auth-layout"

const Membership = () => {
    const { openApplicationModal } = useOutletContext<DashboardLayoutContext>()
    return <DashboardMembershipPage onApplyForMembership={openApplicationModal} />
}

export default Membership
