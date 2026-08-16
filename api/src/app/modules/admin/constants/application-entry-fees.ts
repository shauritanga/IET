export const APPLICATION_ENTRY_FEES_SETTING_KEY = 'application_entry_fees';

export type FeeAmountPair = {
  applicationFee: number;
  entryFee: number;
};

export type ApplicationEntryFeesConfig = {
  graduate: FeeAmountPair;
  others: FeeAmountPair;
};

export const DEFAULT_APPLICATION_ENTRY_FEES: ApplicationEntryFeesConfig = {
  graduate: {
    applicationFee: 500,
    entryFee: 0,
  },
  others: {
    applicationFee: 1000,
    entryFee: 0,
  },
};
