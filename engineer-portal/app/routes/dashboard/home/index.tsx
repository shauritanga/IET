import TrainingEventsSummary from "~/routes/dashboard/home/fragments/training-events-summary";
import MembershipFeesSummary from "~/routes/dashboard/home/fragments/membership-fees-summary";
import MemberDetailsCard from "~/routes/dashboard/home/fragments/member-details-card";
import { useGetUserProfile } from "../profile/repositories/handle-get-user-profile";


const Home = () => {
    const { data, isPending } = useGetUserProfile();
    const profile = data?.data;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <section className={"py-4 lg:p-4 flex flex-col overflow-y-scroll"}>
            <h2 className={"text-3xl mb-4 font-bold"}>{getGreeting()} 👋</h2>
            <TrainingEventsSummary />
            <div className={"grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4 "}>
                <MembershipFeesSummary />
                <MemberDetailsCard profile={profile} isPending={isPending}/>
            </div>
        </section>
    );
};

export default Home;