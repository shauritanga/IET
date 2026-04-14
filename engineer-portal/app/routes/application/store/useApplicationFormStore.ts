import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PersonalDetailsFormType } from "~/routes/application/personal-details/forms/manage-personal-details-form";
import type { RegistrationDetailsFormType } from "~/routes/application/registration-details/form/manage-registration-details-form";
import type { ExperienceDetailsFormType } from "~/routes/application/experience/form/manage-experience-details-form";
import type { ReferenceDetailsFormType } from "~/routes/application/references/forms/manage-reference-forms";

type DeepPartial<T> = T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T | undefined;

interface ApplicationFormState {
    _hasHydrated: boolean;
    personalDetails: DeepPartial<PersonalDetailsFormType>;
    registrationDetails: DeepPartial<RegistrationDetailsFormType>;
    experience: DeepPartial<ExperienceDetailsFormType>;
    references: DeepPartial<ReferenceDetailsFormType>;
    savedEducationCount: number;
    savedWorkCount: number;

    setHasHydrated: (val: boolean) => void;
    setPersonalDetails: (data: DeepPartial<PersonalDetailsFormType>) => void;
    setRegistrationDetails: (data: DeepPartial<RegistrationDetailsFormType>) => void;
    setExperience: (data: DeepPartial<ExperienceDetailsFormType>) => void;
    setReferences: (data: DeepPartial<ReferenceDetailsFormType>) => void;
    setSavedEducationCount: (count: number) => void;
    setSavedWorkCount: (count: number) => void;
    clearAll: () => void;
}

const initialState = {
    _hasHydrated: false,
    personalDetails: {},
    registrationDetails: {},
    experience: {},
    references: {},
    savedEducationCount: 0,
    savedWorkCount: 0,
};

export const useApplicationFormStore = create<ApplicationFormState>()(
    persist(
        (set) => ({
            ...initialState,

            setHasHydrated: (val) => set({ _hasHydrated: val }),

            setPersonalDetails: (data) =>
                set((state) => ({
                    personalDetails: { ...state.personalDetails, ...data },
                })),

            setRegistrationDetails: (data) =>
                set((state) => ({
                    registrationDetails: { ...state.registrationDetails, ...data },
                })),

            setExperience: (data) =>
                set((state) => ({
                    experience: { ...state.experience, ...data },
                })),

            setReferences: (data) =>
                set((state) => ({
                    references: { ...state.references, ...data },
                })),

            setSavedEducationCount: (count) => set({ savedEducationCount: count }),
            setSavedWorkCount: (count) => set({ savedWorkCount: count }),

            clearAll: () => set(initialState),
        }),
        {
            name: "application-form",
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);