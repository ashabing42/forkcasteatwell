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
