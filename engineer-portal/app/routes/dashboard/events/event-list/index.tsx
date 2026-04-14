import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Filter } from "@solar-icons/react/ssr";
import EventListItem from "~/routes/dashboard/events/event-list/fragments/event-list-item";


const Events = () => {
    return (
        <>
            <div className={"flex item-center gap-2 w-full mb-4"}>
                <div>
                    <Input className={"w-full lg:w-96"} />
                </div>
                <Button className={"h-11"} variant={"outline"}>
                    <span className={"hidden lg:block"}>Filter</span>
                    <Filter />
                </Button>
            </div>
            <div className={"w-full"}>
                <EventListItem />
            </div>

        </>
    );
};

export default Events;