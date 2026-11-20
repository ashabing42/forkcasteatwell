/** Tip amounts offered on the Settings page, in euro cents. */
export const TIP_AMOUNTS = [300, 500, 1000] as const;
export const MIN_TIP_CENTS = 100;
export const MAX_TIP_CENTS = 10000;

export function isValidTip(cents: number): boolean {
  return Number.isInteger(cents) && cents >= MIN_TIP_CENTS && cents <= MAX_TIP_CENTS;
}
