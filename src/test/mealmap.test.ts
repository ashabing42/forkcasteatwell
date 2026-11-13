import { describe, expect, it } from "vitest";
import { buildShoppingList, generatePlan, buildEmptySlots, type Recipe } from "@/lib/mealmap";

const r = (id: string, tags: string[], ings: Recipe["ingredients"], servings = 2): Recipe => ({ id, title: id, image_url: null, servings, prep_minutes: 0, cook_minutes: 0, diet_tags: tags, meal_types: ["dinner"], ingredients: ings, steps: [], prep_tasks: [] });

describe("MealMap rules", () => {
  it("combines the same ingredient across recipes (2 onions + 1 onion = 3)", () => {
    const a = r("a", [], [{ name: "onion", quantity: 2, unit: "", category: "produce" }]);
    const b = r("b", [], [{ name: "onions", quantity: 1, unit: "", category: "produce" }]);
    const list = buildShoppingList([{ date: "2026-01-05", meal: "dinner", recipe_id: "a", locked: false }, { date: "2026-01-06", meal: "dinner", recipe_id: "b", locked: false }], [a, b], 2);
    expect(list).toHaveLength(1);
    expect(list[0]!.quantity).toBe(3);
  });
  it("scales quantities to the household size", () => {
    const a = r("a", [], [{ name: "rice", quantity: 1, unit: "cup", category: "pantry" }], 2);
    expect(buildShoppingList([{ date: "2026-01-05", meal: "dinner", recipe_id: "a", locked: false }], [a], 4)[0]!.quantity).toBe(2);
  });
  it("only plans recipes matching every chosen diet and keeps locked slots", () => {
    const vegan = r("v", ["vegan"], []); const meat = r("m", [], []);
    const slots = buildEmptySlots("2026-01-05", { days: 3, meals: ["dinner"] });
    slots[0] = { ...slots[0]!, recipe_id: "m", locked: true };
    const out = generatePlan(slots, [vegan, meat], ["vegan"]);
    expect(out[0]!.recipe_id).toBe("m");
    expect(out.slice(1).every((s) => s.recipe_id === "v")).toBe(true);
  });
});

import { USER_RECIPES } from "@/lib/user-recipes";
import { buildEmptySlots as _empty } from "@/lib/mealmap";
describe("weekly setup", () => {
  it("includes all 20 recipes from the owner's pack", () => {
    expect(USER_RECIPES).toHaveLength(20);
  });
  it("plans only the days and meals chosen for that week", () => {
    expect(_empty("2026-11-16", { days: 4, meals: ["dinner"] })).toHaveLength(4);
  });
});

import { splitByPantry as _split } from "@/lib/mealmap";
describe("pantry", () => {
  it("moves ingredients already in the pantry out of the buy list", () => {
    const r = _split([{ name: "Dried oregano" }, { name: "Onions" }], ["dried oregano"]);
    expect(r.atHome.map((l) => l.name)).toEqual(["Dried oregano"]);
    expect(r.toBuy.map((l) => l.name)).toEqual(["Onions"]);
  });
  it("matches singular and plural names", () => {
    expect(_split([{ name: "Chickpeas" }], ["chickpea"]).atHome).toHaveLength(1);
  });
});

import { computeMealEvents as _cme, googleCalendarSubscribeUrl as _gcs, buildIcs as _bi } from "@/lib/mealmap";
describe("calendar feed", () => {
  it("Google subscribe link uses webcal feed", () => {
    expect(_gcs("https://x.app/api/public/calendar/abc.ics")).toBe("https://calendar.google.com/calendar/render?cid=webcal%3A%2F%2Fx.app%2Fapi%2Fpublic%2Fcalendar%2Fabc.ics");
  });
  it("adds one event per planned meal at the meal time", () => {
    const profile = { timezone: "UTC", breakfast_time: "08:00", lunch_time: "14:00", dinner_time: "21:00", snack_time: "16:00" } as never;
    const recipe = { id: "r1", title: "Shakshuka", prep_minutes: 10, cook_minutes: 20, ingredients: [], prep_tasks: [] } as never;
    const ev = _cme([{ date: "2026-11-16", meal: "dinner", recipe_id: "r1", locked: false } as never, { date: "2026-11-16", meal: "lunch", recipe_id: null, locked: false } as never], [recipe], profile);
    expect(ev).toHaveLength(1);
    expect(ev[0].due.toISOString()).toBe("2026-11-16T21:00:00.000Z");
    expect(_bi(ev)).toContain("SUMMARY:Dinner: Shakshuka");
  });
});
