import ProfileSummaryCard from "~/routes/dashboard/profile/fragments/profile-summary-card";
import ProfileDetails from "~/routes/dashboard/profile/fragments/profile-details";
import { useGetUserProfile } from "./repositories/handle-get-user-profile";
import MembershipDetails from "./fragments/membership-details";
import AccountDetails from "./fragments/account-details";


const Profile = () => {
    const {data, isPending} = useGetUserProfile();
    const profile = data?.data;

    return (
        <section className="py-2 lg:p-4 flex flex-col overflow-y-scroll">
            <h2 className="text-xl mt-4 lg:mt-0 mb-4">My Profile</h2>
            <div className="w-full space-y-4">
                <ProfileSummaryCard profile={profile} isPending={isPending}/>
                <ProfileDetails profile={profile} isPending={isPending}/>
                <MembershipDetails profile={profile} isPending={isPending}/>
                <AccountDetails profile={profile} isPending={isPending}/>
            </div>
        </section>
    );
};

export default Profile;