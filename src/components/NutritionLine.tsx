import { recipeNutrition, type Recipe } from "@/lib/mealmap";

export function NutritionLine({ recipe }: { recipe: Recipe }) {
  const n = recipeNutrition(recipe);
  return <p className="text-xs text-muted-foreground tabular" title={n?.source === "estimated" ? "Estimated from representative ingredient values, per serving. Brands and portions vary." : "Per serving"}>{n ? `≈ ${n.kcal} kcal · ${n.protein_g} g protein${n.source === "estimated" ? " · estimated" : ""}` : "Nutrition not available"}</p>;
}