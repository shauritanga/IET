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
                        className="w-full h-11 shadow-none justify-between font-normal"
                    >
                        {date ? date.toLocaleDateString() : placeholder}
                        <ChevronDownIcon />
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
