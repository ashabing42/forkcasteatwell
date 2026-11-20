import { describe, expect, it } from "vitest";
import { auditRecipe, buildEmptySlots, computePrepEvents, containsGluten, generatePlan, matchesDiet, planningShortages, prepDueOnDate, sameWeekSettings, type Profile, type Recipe } from "@/lib/mealmap";
import { SEED_RECIPES } from "@/lib/seed-recipes";
import { USER_RECIPES } from "@/lib/user-recipes";

const recipe = (id: string, diet_tags: string[], ingredients: Recipe["ingredients"] = []): Recipe => ({ id, title: id, diet_tags, ingredients, image_url: null, servings: 2, prep_minutes: 10, cook_minutes: 20, meal_types: ["dinner"], steps: [], prep_tasks: [] });
const profile: Profile = { diets: ["high-protein"], servings: 2, days: 3, meals: ["dinner"], timezone: "Europe/Madrid", breakfast_time: "08:00", lunch_time: "13:00", dinner_time: "19:00", snack_time: "16:00" };

describe("weekly trust rules", () => {
  it("distinguishes a gluten-free weekly override from high-protein defaults regardless of array order", () => {
    expect(sameWeekSettings({ ...profile, diets: ["gluten-free"] }, profile)).toBe(false);
    expect(sameWeekSettings({ ...profile, diets: ["high-protein", "gluten-free"] }, { ...profile, diets: ["gluten-free", "high-protein"] })).toBe(true);
  });
  it("requires every diet tag; wheat wraps and untagged stir-fry never enter a gluten-free week", () => {
    const wrap = recipe("wrap", ["high-protein"], [{ name: "whole wheat tortillas", quantity: 2, unit: "", category: "bakery" }]);
    const stirFry = recipe("stir-fry", ["high-protein"]);
    const valid = recipe("valid", ["high-protein", "gluten-free"]);
    expect(generatePlan(buildEmptySlots("2026-11-16", profile), [wrap, stirFry, valid], ["high-protein", "gluten-free"]).map((s) => s.recipe_id)).toEqual(["valid", "valid", "valid"]);
  });
  it("does not preserve an incompatible lock, but preserves a matching lock", () => {
    const wheat = recipe("wheat", ["high-protein"]);
    const gf = recipe("gf", ["gluten-free"]);
    const slots = [{ date: "2026-11-16", meal: "dinner", recipe_id: "wheat", locked: true }, { date: "2026-11-17", meal: "dinner", recipe_id: "gf", locked: true }];
    expect(generatePlan(slots, [wheat, gf], ["gluten-free"])).toEqual([{ ...slots[0], recipe_id: "gf", locked: false }, slots[1]]);
  });
  it("reports one matching recipe for three dinners and leaves unmatched breakfasts empty", () => {
    const slots = buildEmptySlots("2026-11-16", { days: 3, meals: ["breakfast", "dinner"] });
    const recipes = [recipe("gf", ["gluten-free"])];
    expect(planningShortages(slots, recipes, ["gluten-free"])).toEqual([{ meal: "breakfast", needed: 3, available: 0 }, { meal: "dinner", needed: 3, available: 1 }]);
    expect(generatePlan(slots, recipes, ["gluten-free"]).filter((s) => s.meal === "breakfast").map((s) => s.recipe_id)).toEqual([null, null, null]);
  });
  it("removes a misleading gluten-free tag when soy sauce contains wheat; explicit tamari is accepted", () => {
    const unsafe = recipe("turkey", ["high-protein", "gluten-free"], [{ name: "soy sauce", quantity: 2, unit: "tbsp", category: "spices" }]);
    expect(matchesDiet(unsafe, ["gluten-free"])).toBe(false);
    expect(auditRecipe(unsafe).diet_tags).not.toContain("gluten-free");
    expect(containsGluten("tamari (gluten-free soy sauce)")).toBe(false);
    expect(containsGluten("rolled oats")).toBe(true);
    expect(containsGluten("rolled oats (gluten-free)")).toBe(false);
  });
  it("audits both recipe packs and uses tamari in the gluten-free turkey wraps", () => {
    const unsafe = [...SEED_RECIPES, ...USER_RECIPES].filter((r) => r.diet_tags.includes("gluten-free") && r.ingredients.some((i) => containsGluten(i.name)));
    expect(unsafe.map((r) => r.title)).toEqual([]);
    expect(USER_RECIPES.find((r) => r.title === "Turkey Mince Lettuce Wraps")?.ingredients.map((i) => i.name)).toContain("tamari (gluten-free soy sauce)");
  });
  it("uses the same thaw instruction and due time for Plan, Today and calendar, even before a Monday meal", () => {
    const chicken = { ...recipe("chicken", ["high-protein"]), prep_tasks: [{ title: "Thaw the chicken in the fridge", hours_before: 24 }] };
    const events = computePrepEvents([{ date: "2026-11-23", meal: "dinner", recipe_id: "chicken", locked: false }], [chicken], profile);
    expect(events[0]?.title).toBe("Thaw the chicken in the fridge");
    expect(events[0]?.due.toISOString()).toBe("2026-11-22T18:00:00.000Z");
    expect(prepDueOnDate(events, "2026-11-22", profile.timezone)).toEqual(events);
    expect(prepDueOnDate(events, "2026-11-23", profile.timezone)).toEqual([]);
  });
});