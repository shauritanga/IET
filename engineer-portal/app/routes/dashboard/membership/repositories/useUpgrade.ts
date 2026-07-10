import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "~/utils/http";
import type { APIResponse } from "~/types/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EligibleCategory = {
  id: string;
  name: string;
  description: string | null;
  level: number;
  yearlyFee: number;
  minYearsExperience: number;
  minCpdPoints: number;
  requiredDocuments: string[];
  ruleId: string;
};

export type EligibilityResult = {
  canUpgrade: boolean;
  eligibleCategories: EligibleCategory[];
  missingRequirements: string[];
  checks?: {
    yearsOfExperience: number;
    cpdPoints: number;
    hasPendingApplication: boolean;
    membershipStatus?: string;
    registrationStatus?: string | null;
    documents: Array<{ type: string; present: boolean; verified: boolean }>;
  };
};

export type UpgradeApplication = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  fromCategoryId: string;
  toCategoryId: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  applicantNotes?: string;
  fromCategory?: { id: string; name: string };
  toCategory?: { id: string; name: string };
};

export type SubmitUpgradePayload = {
  toCategoryId: string;
  applicantNotes?: string;
};

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const UPGRADE_ELIGIBILITY_KEY = ["upgrade", "eligible"] as const;
export const MY_UPGRADE_APPLICATIONS_KEY = ["upgrade", "my-applications"] as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch eligibility — used by the dashboard button and the upgrade form.
 * Stale time is 2 min to avoid hammering the API on every render.
 */
export function useUpgradeEligibility() {
  return useQuery<EligibilityResult>({
    queryKey: UPGRADE_ELIGIBILITY_KEY,
    queryFn: async () => {
      const res = await http.get<APIResponse<EligibilityResult>>(
        "/memberships/upgrades/eligible"
      );
      return res.data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: false,
  });
}

/**
 * Submit an upgrade application.
 */
export function useSubmitUpgradeApplication(
  onSuccess?: (data: UpgradeApplication) => void,
  onError?: (error: unknown) => void
) {
  const queryClient = useQueryClient();

  return useMutation<UpgradeApplication, unknown, SubmitUpgradePayload>({
    mutationFn: async (payload) => {
      const res = await http.post<APIResponse<UpgradeApplication>>(
        "/memberships/upgrades/apply",
        payload
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      // Invalidate eligibility so the button hides after submission
      queryClient.invalidateQueries({ queryKey: UPGRADE_ELIGIBILITY_KEY });
      queryClient.invalidateQueries({ queryKey: MY_UPGRADE_APPLICATIONS_KEY });
      onSuccess?.(data);
    },
    onError,
  });
}

/**
 * Fetch the logged-in member's upgrade application history.
 */
export function useMyUpgradeApplications() {
  return useQuery<UpgradeApplication[]>({
    queryKey: MY_UPGRADE_APPLICATIONS_KEY,
    queryFn: async () => {
      const res = await http.get<APIResponse<UpgradeApplication[]>>(
        "/memberships/upgrades/my-applications"
      );
      return res.data.data;
    },
  });
}
