import { create } from "zustand";

const RESEND_STAGES = [
    60,           // 1 min
    180,          // 3 min
    600,          // 10 min
    3600,         // 1 hour
    86400,        // 1 day (tomorrow)
];

interface OtpState {
    timer: number;
    canResend: boolean;
    stageIndex: number;
    tick: () => void;
    triggerResend: () => void;
    reset: () => void;
}

export const useVerifyOtpStore = create<OtpState>((set, get) => ({
    timer: RESEND_STAGES[0],
    canResend: false,
    stageIndex: 0,

    tick: () => {
        const { timer } = get();
        if (timer <= 1) {
            set({ timer: 0, canResend: true });
        } else {
            set({ timer: timer - 1 });
        }
    },

    triggerResend: () => {
        const { stageIndex } = get();
        const nextIndex = Math.min(stageIndex + 1, RESEND_STAGES.length - 1);
        set({
            stageIndex: nextIndex,
            timer: RESEND_STAGES[nextIndex],
            canResend: false,
        });
    },

    reset: () => set({
        timer: RESEND_STAGES[0],
        canResend: false,
        stageIndex: 0,
    }),
}));