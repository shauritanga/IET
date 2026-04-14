import { cn } from "~/lib/utils";

interface ExtendedBadgeProps {
    children: React.ReactNode;
    caption: String;
    indicatorClassName?: String;
    captionClassName?: String;
    className?: String
}

const ExtendedBadge = ({ children, caption, className, indicatorClassName, captionClassName }: ExtendedBadgeProps) => {
    return (
        <div className={cn("rounded-full bg-muted lg:bg-white p-2 lg:p-1.5  flex items-center gap-2", className)}>
            <div className={cn("rounded-full bg-white lg:bg-muted  p-1 ", indicatorClassName)} >
                {children}
            </div>
            <div className={cn("text-sm lg:text-xs font-medium lg:font-normal", captionClassName)}>
                {caption}
            </div>
        </div>
    )
}

export default ExtendedBadge