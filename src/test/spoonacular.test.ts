import { describe, expect, it } from "vitest";
import { mapSpoonRecipe, searchParams } from "@/lib/spoonacular";

describe("spoonacular mapping", () => {
  it("maps metric measures, steps and diet flags", () => {
    const r = mapSpoonRecipe({
      title: "Lentil soup", servings: 4, readyInMinutes: 40, vegan: true, glutenFree: true, dishTypes: ["soup"],
      extendedIngredients: [{ name: "red lentils", aisle: "Pasta and Rice", measures: { metric: { amount: 200, unitShort: "g" } } }],
      analyzedInstructions: [{ steps: [{ step: "Simmer." }] }],
      nutrition: { nutrients: [{ name: "Protein", amount: 30, unit: "g" }, { name: "Sugar", amount: 4, unit: "g" }] },
    });
    expect(r.ingredients[0]).toEqual({ name: "red lentils", quantity: 200, unit: "g", category: "pantry" });
    expect(r.steps).toEqual(["Simmer."]);
    expect(r.diet_tags.sort()).toEqual(["gluten-free", "high-protein", "low-sugar", "vegan", "vegetarian"]);
    expect(r.meal_types).toContain("lunch");
  });
  it("turns Forkcast diets into search filters", () => {
    const p = searchParams(["vegan", "high-protein", "gluten-free"], "breakfast", "");
    expect(p["diet"]).toBe("vegan");
    expect(p["minProtein"]).toBe("25");
    expect(p["intolerances"]).toBe("gluten");
    expect(p["type"]).toBe("breakfast");
  });
});
