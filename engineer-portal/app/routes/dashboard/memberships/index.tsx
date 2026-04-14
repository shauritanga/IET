import {Input} from "~/components/ui/input";
import {Button} from "~/components/ui/button";
import {Filter} from "@solar-icons/react/ssr";
import MembershipListItem from "~/routes/dashboard/memberships/fragments/membership-list-item";
import { Outlet } from "react-router";


const Memberships = () => {
    return (
        <>
        <Outlet/>
        <section className={"py-2 lg:p-4 flex flex-col overflow-y-scroll"}>
            <h2 className={"text-xl mt-4 lg:mt-0 mb-4"}>Memberships</h2>
            <div className={"flex item-center gap-2 w-full mb-4"}>
                <div>
                    <Input className={"w-full lg:w-96"}/>
                </div>
                <Button className={"h-11"} variant={"outline"}>
                    <span className={"hidden lg:block"}>Filter</span>
                    <Filter/>
                </Button>
            </div>
            <div className={"w-full"}>
                <MembershipListItem/>
            </div>
        </section>
        </>
    );
};

export default Memberships;