import { Calendar } from "~/components/ui/calendar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useState } from "react";
import { Link } from "react-router";
import EventDetailsLayout from "../../events/event-details/event-details";

const TrainingEventsSummary = () => {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [isOpen, setIsOpen] = useState(false)
    return (
        <Card
            className={"p-1.5 shadow-xs flex flex-col md:flex-row gap-4 w-full h-full lg:border-none"}>
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md bg-[#f5f0f0] w-[500px]  hidden lg:block"
                captionLayout="label"
            />
            <div className={"flex flex-col p-2 w-full gap-4 "}>
                <div className={"flex justify-between items-center"}>
                    <h3 className={"font-medium lg:text-xl"}>
                        Upcoming Training & Events
                    </h3>
                    <Link to={"/dashboard/events"}>
                        <Button className={"rounded-full h-0 p-4 bg-[#f5f0f0f0] text-xs"} variant={"ghost"}>
                            View All
                        </Button>
                    </Link>
                </div>
                <div className={"no-scrollbar overflow-y-scroll flex flex-col gap-2 max-h-[300px] md:max-h-full"}>
                    {[...Array(2)].map((_, i) => (
                        <Card key={i} className="p-2.5 w-full shadow-none gap-2">
                            <div className="flex justify-between items-center">
                                <Badge>Conferences</Badge>
                                <Button className="text-xs rounded-xl shadow-none h-0 py-4!" variant="outline" onClick={() => <EventDetailsLayout open={isOpen} closeModal={() => setIsOpen(!isOpen)} />}>
                                    More Details
                                </Button>
                            </div>

                            <div className="flex flex-col gap-1">
                                <p className="font-medium">World engineering day for sustainable development</p>
                                <p className="text-xs font-light">
                                    27th Oct, 2025 | 8:00 AM - 12:00 PM | Karimjee Hall, Dar es salaam
                                </p>
                            </div>

                            <div className="flex flex-col gap-1">
                                <p className="text-xs font-light text-muted-foreground">
                                    <span className="font-semibold">Guest of honor:</span> Eng. Emmanuel Ole
                                    Kambainei
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default TrainingEventsSummary;