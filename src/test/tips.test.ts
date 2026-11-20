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
