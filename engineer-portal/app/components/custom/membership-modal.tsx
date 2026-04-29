type MembershipRequiredModalProps = {
    open: boolean
    onClose: () => void
    onApply: () => void
}

const benefits = [
    "Access IET engineering journals & technical resources",
    "Official CPD tracking recognized by ERB Tanzania",
    "Priority registration for events, workshops & seminars",
    "Connect with 5,000+ engineers across Tanzania",
]

export default function MembershipRequiredModal({ open, onClose, onApply }: MembershipRequiredModalProps) {
    if (!open) return null

    return (
        <div className="mem-prompt-backdrop">
            <div className="mem-dlg">
                <div className="mem-dlg-top">
                    <button
                        type="button"
                        onClick={onClose}
                        className="mem-dlg-close"
                        aria-label="Close membership reminder"
                    >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    <div className="mem-dlg-icon">
                        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>

                    <div className="mem-dlg-title">Become an IET Member</div>
                    <div className="mem-dlg-subtitle">
                        You&apos;re now signed in. Join Tanzania&apos;s leading community of engineers and unlock your full portal experience.
                    </div>
                </div>

                <div className="mem-dlg-body">
                    <div className="mem-dlg-benefits">
                        {benefits.map((benefit) => (
                            <div key={benefit} className="mem-dlg-benefit">
                                <div className="mem-dlg-benefit-icon">
                                    <svg width="13" height="13" fill="none" stroke="var(--iet-red)" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mem-dlg-actions">
                        <button type="button" className="btn btn-outline mem-dlg-btn" onClick={onClose}>
                            Explore First
                        </button>
                        <button
                            type="button"
                            className="btn btn-red mem-dlg-btn"
                            onClick={() => {
                                onClose()
                                onApply()
                            }}
                        >
                            Apply for Membership
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>
                    </div>

                    <div className="mem-dlg-note">You can always apply later from the Membership section.</div>
                </div>
            </div>
        </div>
    )
}
