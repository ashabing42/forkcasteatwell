import { describe, expect, it } from "vitest";
import { auditRecipe, buildEmptySlots, buildShoppingList, canonicalName, computeMealEvents, formatQty, freshPantryIds, isStaple, normalizeIngredient, nutritionSummary, pantryKey, planStartDate, recipeNutrition, shoppingSlots, splitByPantry, type Ingredient, type Profile, type Recipe, type Slot } from "@/lib/mealmap";
import { searchParams } from "@/lib/spoonacular";

const ing = (name: string, quantity: number, unit = "", category = "produce"): Ingredient => ({ name, quantity, unit, category });
const recipe = (id: string, ingredients: Ingredient[]): Recipe => ({ id, title: id, ingredients, servings: 2, image_url: null, prep_minutes: 0, cook_minutes: 0, diet_tags: [], meal_types: ["dinner"], steps: [], prep_tasks: [] });
const slot = (recipe_id: string, date = "2026-11-20"): Slot => ({ recipe_id, date, meal: "dinner", locked: false });

describe("buyable shopping quantities", () => {
  it("rounds 0.75 cucumber up to one", () => {
    expect(buildShoppingList([slot("r")], [recipe("r", [ing("cucumber", 0.75)])], 2)[0]?.quantity).toBe(1);
  });
  it("rounds 1.75 lemons to two after aggregation", () => {
    expect(buildShoppingList([slot("a"), slot("b")], [recipe("a", [ing("lemon", 0.75)]), recipe("b", [ing("lemons", 1)])], 2)).toMatchObject([{ quantity: 2 }]);
  });
  it("buys one garlic head for 7.75 cloves, assuming ten cloves per head", () => {
    expect(buildShoppingList([slot("r")], [recipe("r", [ing("garlic", 7.75, "clove")])], 2)[0]).toMatchObject({ quantity: 1, unit: "head" });
  });
  it("buys one can for 0.75 can coconut milk and pluralises count units", () => {
    expect(buildShoppingList([slot("r")], [recipe("r", [ing("coconut milk", 0.75, "can", "pantry")])], 2)[0]).toMatchObject({ quantity: 1, unit: "can" });
    expect(formatQty(2, "clove")).toBe("2 cloves");
    expect(formatQty(1, "can")).toBe("1 can");
  });
  it("merges one can coconut milk and 100 ml into two buyable 400 ml cans", () => {
    expect(buildShoppingList([slot("r")], [recipe("r", [ing("coconut milk", 1, "can", "pantry"), ing("coconut milk", 100, "ml", "pantry")])], 2)).toMatchObject([{ quantity: 2, unit: "can" }]);
  });
});

describe("canonical shopping and pantry", () => {
  it.each([["canned tuna", "tuna (tin)"], ["ground turkey", "turkey mince"], ["chopped tomatoes (400 g)", "canned tomatoes"], ["lettuce", "little gem lettuce"]])("merges %s with %s", (a, b) => {
    const result = buildShoppingList([slot("a"), slot("b")], [recipe("a", [ing(a, 100, "g")]), recipe("b", [ing(b, 200, "g")])], 2);
    expect(result).toHaveLength(1); expect(result[0]?.quantity).toBe(300); expect(result[0]?.recipeTitles).toEqual(["a", "b"]);
  });
  it("combines lemon juice with lemons using 45 ml juice per lemon", () => {
    expect(buildShoppingList([slot("r")], [recipe("r", [ing("lemon", 1), ing("lemon juice", 45, "ml")])], 2)[0]).toMatchObject({ name: "lemon", quantity: 2, unit: "" });
    expect(normalizeIngredient(ing("lemon juice", 45, "ml"))).toMatchObject({ name: "lemon", quantity: 1, unit: "" });
  });
  it("matches frozen and fresh names, while keeping tamari distinct from wheat soy sauce", () => {
    expect(pantryKey("frozen chicken breast")).toBe(pantryKey("chicken breasts"));
    expect(pantryKey("tamari (gluten-free soy sauce)")).not.toBe(pantryKey("soy sauce"));
    expect(splitByPantry([{ name: "ground turkey" }], ["turkey mince"]).toBuy).toEqual([]);
  });
  it("identifies pantry staples without hiding fresh red peppers", () => {
    expect(isStaple(ing("olive oil", 1, "tbsp", "pantry"))).toBe(true);
    expect(isStaple(ing("vegetable stock", 100, "ml", "pantry"))).toBe(true);
    expect(isStaple(ing("red pepper", 1))).toBe(false);
  });
  it("uses up recorded fresh ingredients but keeps oil and spices", () => {
    const r = recipe("r", [ing("chicken breasts", 2, "", "protein"), ing("carrots", 2), ing("olive oil", 1, "tbsp", "pantry"), ing("dried oregano", 1, "tsp", "spices")]);
    expect(freshPantryIds(r, [{ id: "chicken", name: "frozen chicken breast" }, { id: "carrot", name: "carrot" }, { id: "oil", name: "olive oil" }, { id: "oregano", name: "dried oregano" }])).toEqual(["chicken", "carrot"]);
  });
});

describe("remaining days and plan windows", () => {
  it("defaults to Friday onwards and excludes cooked meals even for the whole-week toggle", () => {
    const slots = [slot("a", "2026-11-16"), slot("b"), { ...slot("c", "2026-11-21"), cooked: true }, slot("d", "2026-11-22")];
    expect(shoppingSlots(slots, "2026-11-20").map((s) => s.recipe_id)).toEqual(["b", "d"]);
    expect(shoppingSlots(slots, "2026-11-20", true).map((s) => s.recipe_id)).toEqual(["a", "b", "d"]);
  });
  it("starts Saturday and runs five days through Wednesday, including calendar dates", () => {
    const slots = buildEmptySlots("2026-11-16", { start_day: 5, days: 5, meals: ["dinner"] });
    expect(planStartDate("2026-11-16", 5)).toBe("2026-11-21");
    expect(slots.map((s) => s.date)).toEqual(["2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24", "2026-11-25"]);
    const r = recipe("r", []);
    const profile: Profile = { start_day: 5, diets: [], days: 5, meals: ["dinner"], servings: 2, timezone: "UTC", breakfast_time: "08:00", lunch_time: "13:00", dinner_time: "19:00", snack_time: "16:00" };
    expect(computeMealEvents(slots.map((s) => ({ ...s, recipe_id: "r" })), [r], profile).map((e) => e.mealDate)).toEqual(slots.map((s) => s.date));
  });
});

describe("nutrition summaries", () => {
  it("preserves provided 420 kcal and 38 g protein per serving", () => {
    const r = { ...recipe("r", []), nutrition: { kcal: 420, protein_g: 38, source: "provided" as const } };
    expect(recipeNutrition(r)).toEqual({ kcal: 420, protein_g: 38, source: "provided" });
    expect(nutritionSummary([slot("r"), { ...slot("r"), meal: "lunch" }], [r])).toMatchObject({ mealKcal: 420, dailyKcal: 840, mealProtein: 38, dailyProtein: 76, complete: true });
  });
  it("uses a 500 kcal ceiling for low-calorie and does not label unknown nutrition", () => {
    const low = { ...recipe("low", []), nutrition: { kcal: 500, protein_g: 25, source: "provided" as const } };
    const high = { ...low, nutrition: { ...low.nutrition, kcal: 501 } };
    expect(auditRecipe(low).diet_tags).toContain("low-calorie");
    expect(auditRecipe(high).diet_tags).not.toContain("low-calorie");
    expect(auditRecipe(recipe("unknown", [ing("unknown food", 100, "g")])).diet_tags).not.toContain("low-calorie");
    expect(searchParams(["low-calorie"], "dinner", "")["maxCalories"]).toBe("500");
  });
  it("does not present partial nutrition as a complete daily total", () => {
    const r = { ...recipe("r", []), nutrition: { kcal: 420, protein_g: 38, source: "provided" as const } };
    expect(nutritionSummary([slot("r"), slot("unknown")], [r, recipe("unknown", [])])).toMatchObject({ known: 1, total: 2, complete: false });
  });
  it("does not label a known 24 g protein meal as high-protein", () => {
    const r = { ...recipe("r", []), diet_tags: ["high-protein"], nutrition: { kcal: 420, protein_g: 24, source: "provided" as const } };
    expect(auditRecipe(r).diet_tags).not.toContain("high-protein");
  });
});