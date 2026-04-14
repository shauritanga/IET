import type { ComponentPropsWithoutRef, FC } from "react";


import { getInitials } from "~/utils/string-utils";
import {cn} from "~/lib/utils";
import {Avatar, AvatarFallback, AvatarImage} from "~/components/ui/avatar";

export const AvatarCard = ({
    className,
    ...otherProps
}: ComponentPropsWithoutRef<"div">) => {
    return (
        <div
            className={cn("flex items-center gap-3", className)}
            {...otherProps}
        />
    );
};

export interface AvatarCardImageProps {
    active?: boolean;
    alt: string;
    containerClassName?: string;
    fallBack?: string;
    src: string;
}

const AvatarCardImage: FC<AvatarCardImageProps> = ({
    alt,
    containerClassName,
    src,
    fallBack,
}) => {
    return (
        <Avatar className={containerClassName}>
            <AvatarImage src={src} alt={alt} />
            {fallBack && (
                <AvatarFallback>{getInitials(fallBack)}</AvatarFallback>
            )}
        </Avatar>
    );
};


interface AvatarContentProps {
    className?: string;
    subtitle?: string;
    subtitleClassName?: string;
    swap?: boolean;
    title: string;
    titleClassName?: string;
}

const AvatarContent: FC<AvatarContentProps> = ({
    className,
    subtitle,
    subtitleClassName,
    swap,
    title,
    titleClassName,
}) => {
    return (
        <div className={cn("flex flex-col text-start", className)}>
            <p className={cn("text-sm", { "order-2": swap }, titleClassName)}>
                {title}
            </p>
            <p
                className={cn(
                    "text-primary-shades-600 text-xs",
                    { "order-1": swap },
                    { hidden: !subtitle },
                    subtitleClassName
                )}
            >
                {subtitle}
            </p>
        </div>
    );
};

AvatarCard.Content = AvatarContent;
AvatarCard.Image = AvatarCardImage;
