import React from 'react';
import {Calendar, Eye} from "@solar-icons/react/ssr";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";
import {Card} from "~/components/ui/card";

const EventListItem = () => {
    return (
        <Card className={"w-full flex flex-row gap-0 p-4 justify-between items-center shadow-xs"}>
            <div className={"flex items-start lg:items-start gap-2"}>
                <div className={"shrink-0 size-8 lg:size-10 bg-[#FADCDC]  rounded-lg flex justify-center items-center"}>
                    <Calendar className={"text-[#E20C0A] size-6 lg:size-6"} weight={"BoldDuotone"}/>
                </div>
                <div>
                    <p className={"text-sm lg:text-base font-medium mb-1"}>Structural Design CPD Workshop</p>
                    <p className={"text-xs text-muted-foreground mb-1"}>27th Oct, 2025 | 8:00 AM - 12:00 PM |
                        Karimjee Hall, Dar es salaam </p>
                    <p className="text-xs font-light text-muted-foreground">
                        <span className="font-semibold">Guest of honor:</span> Eng. Emmanuel Ole
                        Kambainei
                    </p>
                </div>
            </div>
            <div className={"flex items-center gap-2"}>
                <Badge>
                    Upcoming
                </Badge>
                <Button className={"hidden lg:block rounded-xl"} variant={"outline"}>
                    View Details
                </Button>
                <Button className={"shrink-0 lg:hidden rounded-lg h-0 w-0 !p-4"} variant={"outline"}>
                    <Eye/>
                </Button>
            </div>
        </Card>
    );
};

export default EventListItem;