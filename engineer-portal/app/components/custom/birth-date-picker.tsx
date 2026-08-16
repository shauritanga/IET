import * as React from "react"
import { CalendarDays, ChevronDownIcon, X } from "lucide-react"
import { format } from "date-fns"
import type { Matcher } from "react-day-picker"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import { cn } from "~/lib/utils"

interface Props {
    placeholder?: string
    value?: Date
    onChange?: (date: Date | undefined) => void
    /** Inclusive start year for dropdown navigation */
    fromYear?: number
    /** Inclusive end year for dropdown navigation */
    toYear?: number
    disabled?: Matcher | Matcher[]
    allowClear?: boolean
    className?: string
}

function toValidDate(value?: Date) {
    if (!value) return undefined
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date
}

/** Format a local calendar date as YYYY-MM-DD (avoids UTC off-by-one). */
export function formatLocalDate(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export function BirthDatePicker({
    placeholder = "Select date",
    value,
    onChange,
    fromYear,
    toYear,
    disabled,
    allowClear = true,
    className,
}: Props) {
    const [open, setOpen] = React.useState(false)
    const date = toValidDate(value)

    const resolvedFromYear = fromYear ?? 1940
    const resolvedToYear = toYear ?? new Date().getFullYear()
    const startMonth = new Date(resolvedFromYear, 0)
    const endMonth = new Date(resolvedToYear, 11)

    const handleSelect = (selected: Date | undefined) => {
        onChange?.(selected)
        if (selected) setOpen(false)
    }

    const handleClear = (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        onChange?.(undefined)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "group h-11 w-full justify-between gap-2 rounded-xl border-[1.5px] border-[var(--iet-border)] bg-[var(--iet-bg)] px-3 text-left text-[13px] font-normal shadow-none",
                        "hover:bg-white hover:border-[var(--iet-red)]/40 hover:text-[var(--iet-text)]",
                        "focus-visible:border-[var(--iet-red)] focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(226,12,10,0.12)]",
                        !date && "text-[var(--iet-muted)]",
                        className,
                    )}
                >
                    <span className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--iet-red-pale)] text-[var(--iet-red)]">
                            <CalendarDays className="size-4" />
                        </span>
                        <span className="truncate">
                            {date ? format(date, "d MMM yyyy") : placeholder}
                        </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                        {allowClear && date ? (
                            <span
                                role="button"
                                tabIndex={0}
                                aria-label="Clear date"
                                className="rounded-md p-1 text-[var(--iet-muted)] opacity-0 transition-opacity hover:bg-[var(--iet-red-pale)] hover:text-[var(--iet-red)] group-hover:opacity-100"
                                onClick={handleClear}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        handleClear(event as unknown as React.MouseEvent)
                                    }
                                }}
                            >
                                <X className="size-3.5" />
                            </span>
                        ) : null}
                        <ChevronDownIcon className="size-4 text-[var(--iet-muted)]" />
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto overflow-hidden rounded-2xl border-[var(--iet-border)] p-0 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                align="start"
                sideOffset={6}
            >
                <div className="border-b border-[var(--iet-border)] bg-[var(--iet-red-pale)] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.7px] text-[var(--iet-muted)]">
                        Selected date
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold text-[var(--iet-red-dark)]">
                        {date ? format(date, "EEEE, d MMMM yyyy") : "No date selected"}
                    </p>
                </div>
                <div className="p-2">
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        startMonth={startMonth}
                        endMonth={endMonth}
                        defaultMonth={date ?? new Date(Math.min(resolvedToYear, new Date().getFullYear()), 0)}
                        disabled={disabled}
                        onSelect={handleSelect}
                        className="[--cell-size:2.35rem]"
                        classNames={{
                            today: "rounded-lg bg-[var(--iet-red-pale)] text-[var(--iet-red-dark)]",
                        }}
                    />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-[var(--iet-border)] bg-[var(--iet-bg)] px-3 py-2.5">
                    <button
                        type="button"
                        className="text-[12px] font-semibold text-[var(--iet-muted)] hover:text-[var(--iet-red-dark)]"
                        onClick={() => setOpen(false)}
                    >
                        Close
                    </button>
                    {allowClear ? (
                        <button
                            type="button"
                            className="text-[12px] font-semibold text-[var(--iet-red)] hover:underline disabled:opacity-40"
                            disabled={!date}
                            onClick={() => onChange?.(undefined)}
                        >
                            Clear date
                        </button>
                    ) : null}
                </div>
            </PopoverContent>
        </Popover>
    )
}
