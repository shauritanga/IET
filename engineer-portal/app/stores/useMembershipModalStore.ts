import { create } from "zustand";

interface MembershipModalState {
    isOpen: boolean;
    open: () => void;
    close: () => void;
}

export const useMembershipModalStore = create<MembershipModalState>((set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
}));