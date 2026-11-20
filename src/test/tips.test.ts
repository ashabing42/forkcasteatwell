import { describe, it, expect } from "vitest";
import { isValidTip, TIP_AMOUNTS } from "@/lib/tips";
describe("tips", () => {
  it("offers €3, €5 and €10", () => expect([...TIP_AMOUNTS]).toEqual([300, 500, 1000]));
  it("rejects amounts under €1 or over €100", () => {
    expect(isValidTip(99)).toBe(false);
    expect(isValidTip(10001)).toBe(false);
    expect(isValidTip(500)).toBe(true);
  });
});
import { tipPriceId } from "@/lib/tips";
describe("tip products", () => {
  it("maps €3/€5/€10 to their products", () => {
    expect(tipPriceId(300)).toBe("tip_3");
    expect(tipPriceId(500)).toBe("tip_5");
    expect(tipPriceId(1000)).toBe("tip_10");
    expect(tipPriceId(700)).toBeUndefined();
  });
});
