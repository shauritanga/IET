import {Button} from "~/components/ui/button";
import {Card} from "~/components/ui/card";
import {Badge} from "~/components/ui/badge";
import { Link } from "react-router";

const MembershipFeesSummary = () => {
    return (
        <Card className={"shadow-xs lg:col-span-3 lg:border-none p-1.5 gap-2"}>
            <div className={"flex justify-between items-start p-2"}>
                <div className={"flex flex-col gap-1"}>
                    <h3 className={"font-medium lg:text-xl"}>
                        Membership Fees
                    </h3>
                    <p className={"text-xs font-light"}>
                        View your membership fees here
                    </p>
                </div>
                <Link to={"/dashboard/events"}>
                <Button className={"rounded-full h-0 p-4 bg-muted text-xs"} variant={"ghost"}>
                    View All
                </Button>
                </Link>
            </div>
            <Card className={"border-none bg-muted shadow-none p-2 gap-2 h-full"}>
                <Card
                    className={"border-none bg-white shadow-none p-4 grid grid-cols-2 lg:grid-cols-4 gap-2 lg:justify-items-center-safe"}>
                    <div>
                        <p className={"text-xs font-light text-muted-foreground"}>2025</p>
                        <p className={"text-sm lg:text-base font-medium"}>Senior Members</p>
                    </div>
                    <div>
                        <p className={"text-xs font-light text-muted-foreground"}>Membership Fees</p>
                        <p className={"text-sm lg:text-base font-medium"}>10,000{" "}<span
                            className={"text-muted-foreground"}>TZS</span></p>
                    </div>
                    <div className={"flex flex-col justify-center h-full"}>
                        <Badge>
                            Expiring
                        </Badge>
                    </div>
                    <div>
                        <Button className={"rounded-xl p-4 text-xs h-0 shadow-none"} variant={"outline"}>
                            Pay Now
                        </Button>
                    </div>
                </Card>
            </Card>
        </Card>
    );
};

export default MembershipFeesSummary;