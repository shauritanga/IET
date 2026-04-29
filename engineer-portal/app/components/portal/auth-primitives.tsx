import type { ReactNode } from "react"
import { Link, type To } from "react-router"
import { CheckIcon } from "~/components/portal/icons"

const authHighlights = [
    "Register and Manage Your Membership",
    "Access CPD Courses",
    "Read the Tanzania Engineer Journal",
    "Track Events and Conferences",
]

export const AuthShell = ({ children, className = "max-w-[360px]" }: { children: ReactNode; className?: string }) => (
    <div className={`w-full ${className}`}>{children}</div>
)

export const AuthLogoBlock = () => (
    <div className="mb-5 text-center 2xl:mb-7">
        <div className="mx-auto mb-2 h-16 w-16 2xl:mb-[10px] 2xl:h-20 2xl:w-20">
            <img src="/IET-logo.png" alt="IET Tanzania" className="h-full w-full object-contain" />
        </div>
        <div className="font-serif text-[13px] leading-[1.3] font-extrabold text-[#390909] 2xl:text-[14px] 2xl:leading-[1.35]">
            Institution of Engineers
            <br />
            Tanzania
        </div>
    </div>
)

export const AuthTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <>
        <h1 className="mb-1 text-center font-serif text-[23px] font-bold text-[#1C1010] 2xl:mb-[5px] 2xl:text-[26px]">{title}</h1>
        <p className="mb-4 text-center text-[11.5px] leading-[1.5] text-[#7A6060] 2xl:mb-[22px] 2xl:text-[12px] 2xl:leading-[1.6]">{subtitle}</p>
    </>
)

export const AuthField = ({
    label,
    children,
    className = "mb-3 2xl:mb-[14px]",
}: {
    label: string
    children: ReactNode
    className?: string
}) => (
    <div className={className}>
        <label className="mb-1.5 block text-[12px] font-semibold text-[#1C1010] 2xl:mb-[6px] 2xl:text-[12.5px]">{label}</label>
        {children}
    </div>
)

export const authInputClassName =
    "w-full rounded-[8px] border-[1.5px] border-[#E8D5D5] bg-white px-3 py-2.5 text-[12.5px] text-[#1C1010] outline-none transition-colors duration-150 placeholder:text-[#C4ADAD] focus:border-[#390909] 2xl:px-[13px] 2xl:py-[11px] 2xl:text-[13px]"

export const AuthFooter = ({
    prompt,
    actionLabel,
    to,
    topClassName = "mt-4 2xl:mt-5",
}: {
    prompt: string
    actionLabel: string
    to: To
    topClassName?: string
}) => (
    <>
        <div className={`text-center text-[12px] text-[#7A6060] 2xl:text-[12.5px] ${topClassName}`}>
            {prompt}{" "}
            <Link to={to} className="font-bold text-[#E20C0A] no-underline">
                {actionLabel}
            </Link>
        </div>
        <div className="mt-4 text-center text-[10.5px] text-[#7A6060] 2xl:mt-6 2xl:text-[11px]">
            &copy; {new Date().getFullYear()} Institute of Engineers Tanzania
        </div>
    </>
)

export const AuthWelcomePanel = () => (
    <div className="relative z-10 rounded-[14px] border border-white/[.15] bg-white/[.08] p-[22px] backdrop-blur-sm">
        <div className="mb-2 text-[15px] font-bold text-white">Welcome To IET Engineer Portal</div>
        <div className="mb-[14px] text-[12px] leading-[1.65] text-white/[.72]">
            IET is Tanzania&apos;s leading community of engineers dedicated to excellence, innovation, and professional growth.
        </div>
        <div className="mb-[10px] text-[9px] font-bold uppercase tracking-[1.3px] text-white/[.45]">
            Through IET Portal You Can:
        </div>
        <div className="flex flex-col gap-[9px]">
            {authHighlights.map((item) => (
                <div key={item} className="flex items-center gap-[9px] text-[12.5px] text-white/[.85]">
                    <CheckIcon className="h-[17px] w-[17px] stroke-[rgba(255,255,255,.65)] stroke-[2.5]" />
                    {item}
                </div>
            ))}
        </div>
    </div>
)
