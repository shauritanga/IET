import TrainingEventsSummary from "~/routes/dashboard/home/fragments/training-events-summary";
import MembershipFeesSummary from "~/routes/dashboard/home/fragments/membership-fees-summary";
import MemberDetailsCard from "~/routes/dashboard/home/fragments/member-details-card";
import { useGetUserProfile } from "../profile/repositories/handle-get-user-profile";


const Home = () => {
    const { data, isPending } = useGetUserProfile();
    const profile = data?.data;
    const firstName = profile?.firstName || "Member";

    return (
        <section className="flex flex-col gap-6 py-4 lg:p-4">
            <h2 className="text-[42px] font-normal tracking-[-0.03em] text-[#4A2F2A]">
                Hello <span className="font-semibold">{firstName}</span> <span className="inline-block text-[34px]">👋</span>
            </h2>
            <TrainingEventsSummary />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
                <MembershipFeesSummary profile={profile} isPending={isPending} />
                <MemberDetailsCard profile={profile} isPending={isPending}/>
            </div>
        </section>
    );
};

export default Home;
