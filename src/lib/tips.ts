/** Tip amounts offered on the Settings page, in euro cents. */
export const TIP_AMOUNTS = [300, 500, 1000] as const;
export const MIN_TIP_CENTS = 100;
export const MAX_TIP_CENTS = 10000;

export function isValidTip(cents: number): boolean {
  return Number.isInteger(cents) && cents >= MIN_TIP_CENTS && cents <= MAX_TIP_CENTS;
}

/** Payment-provider price IDs for each tip amount. */
export const TIP_PRICE_IDS: Record<(typeof TIP_AMOUNTS)[number], string> = { 300: "tip_3", 500: "tip_5", 1000: "tip_10" };
export function tipPriceId(cents: number): string | undefined {
  return (TIP_PRICE_IDS as Record<number, string>)[cents];
}
