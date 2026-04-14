import {Card2, Eye} from "@solar-icons/react/ssr";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Card} from "~/components/ui/card";
import { Link } from 'react-router';

const MembershipListItem = () => {
    return (
        <Card className={"w-full flex flex-row gap-0 p-4 justify-between items-center shadow-xs"}>
            <div className={"flex items-start lg:items-center gap-2"}>
                <div className={"shrink-0 size-8 lg:size-14 bg-[#FADCDC]  rounded-lg flex justify-center items-center"}>
                    <Card2 className={"text-[#E20C0A] size-6 lg:size-8"} weight={"BoldDuotone"}/>
                </div>
                <div>
                    <p className={"text-sm lg:text-base font-medium mb-1"}>Senior Members</p>
                    <p className={"text-xs text-muted-foreground"}>27th Oct, 2025 | 10,000 TZS |
                        ET/ENG/0234 </p>
                </div>
            </div>
            <div className={"flex items-center gap-2"}>
                <Badge>
                    Upcoming
                </Badge>
                 <Link to={"1"}>
                <Button className={"hidden lg:block rounded-xl"} variant={"outline"}>
                    View Details
                </Button>
                </Link>
                <Link to={"1"}>
                <Button className={"shrink-0 lg:hidden rounded-lg h-0 w-0 p-4!"} variant={"outline"}>
                    <Eye/>
                </Button>
                </Link>
            </div>
        </Card>
    );
};

export default MembershipListItem;