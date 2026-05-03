import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import {useEffect} from "react";
import { cn } from "~/lib/utils";

interface Props {
    placeholder?: string
    value?: Date
    onChange?: (date: Date | undefined) => void
}

export function BirthDatePicker({ placeholder = "Select Date", value, onChange }: Props) {
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(value)

    const handleSelect = (selected: Date | undefined) => {
        setDate(selected)
        onChange?.(selected)
        setOpen(false)
    }

    useEffect(() => {
        if (value) {
            setDate(value);
        }
    }, [value]);

    return (
        <div className="flex flex-col gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date"
                        className={cn(
                            "w-full h-auto justify-between font-normal rounded-lg border-[1.5px] border-[var(--iet-border)] bg-[var(--iet-bg)] px-3 py-2 text-[12.5px] shadow-none",
                            "hover:bg-[var(--iet-bg)] hover:border-[var(--iet-border)] hover:text-inherit",
                            "focus-visible:border-[var(--iet-red)] focus-visible:bg-white focus-visible:ring-0",
                            !date && "text-[var(--iet-muted)]"
                        )}
                    >
                        {date ? date.toLocaleDateString() : placeholder}
                        <ChevronDownIcon className="size-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={handleSelect}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
