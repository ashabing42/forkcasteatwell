// Pure domain logic for MealMap: diets, planning, shopping aggregation, prep scheduling, ICS.

export const DIETS = [
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🥕" },
  { id: "low-sugar", label: "Low-sugar", emoji: "🍋" },
  { id: "high-protein", label: "High-protein", emoji: "💪" },
  { id: "gluten-free", label: "Gluten-free", emoji: "🌾" },
  { id: "balanced", label: "Balanced / No restriction", emoji: "🥗" },
] as const;
export const DIET_TAGS = DIETS.filter((d) => d.id !== "balanced");

export const MEALS = ["breakfast", "lunch", "dinner"] as const;
export type Meal = (typeof MEALS)[number];
export const MEAL_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export const CATEGORIES = ["produce", "protein", "dairy", "bakery", "pantry", "spices", "frozen", "other"] as const;
export const CATEGORY_LABEL: Record<string, string> = {
  produce: "Produce",
  protein: "Meat, fish & protein",
  dairy: "Dairy & eggs",
  bakery: "Bakery",
  pantry: "Pantry",
  spices: "Spices & condiments",
  frozen: "Frozen",
  other: "Other",
};

export type Ingredient = { name: string; quantity: number | null; unit: string; category: string };
export type PrepTask = { title: string; hours_before: number };
export type Recipe = {
  id: string;
  title: string;
  image_url: string | null;
  servings: number;
  prep_minutes: number;
  cook_minutes: number;
  diet_tags: string[];
  meal_types: string[];
  ingredients: Ingredient[];
  steps: string[];
  prep_tasks: PrepTask[];
  source_url?: string | null;
};
export type Slot = { date: string; meal: string; recipe_id: string | null; locked: boolean };
export type Profile = {
  diets: string[];
  meals: string[];
  days: number;
  servings: number;
  breakfast_time: string;
  lunch_time: string;
  dinner_time: string;
  snack_time: string;
  timezone: string;
};

// ---------- dates ----------
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function parseISODate(s: string): Date {
  const [y = 0, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
/** Monday of the week containing the date. */
export function weekStartOf(d: Date): string {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (c.getDay() + 6) % 7;
  c.setDate(c.getDate() - dow);
  return toISODate(c);
}

// ---------- planning ----------
export function matchesDiet(recipe: Pick<Recipe, "diet_tags">, diets: string[]): boolean {
  const req = diets.filter((d) => d !== "balanced");
  return req.every((d) => recipe.diet_tags.includes(d));
}
export function matchesMeal(recipe: Pick<Recipe, "meal_types">, meal: string): boolean {
  return recipe.meal_types.length === 0 || recipe.meal_types.includes(meal);
}

export function buildEmptySlots(weekStart: string, profile: Pick<Profile, "days" | "meals">): Slot[] {
  const meals = MEALS.filter((m) => profile.meals.includes(m));
  const slots: Slot[] = [];
  for (let i = 0; i < profile.days; i++) {
    for (const meal of meals) slots.push({ date: addDays(weekStart, i), meal, recipe_id: null, locked: false });
  }
  return slots;
}

/** Merge existing slots into the shape dictated by the profile (keeps matching date+meal). */
export function reconcileSlots(weekStart: string, profile: Pick<Profile, "days" | "meals">, existing: Slot[]): Slot[] {
  const map = new Map(existing.map((s) => [`${s.date}|${s.meal}`, s]));
  return buildEmptySlots(weekStart, profile).map((s) => map.get(`${s.date}|${s.meal}`) ?? s);
}

/**
 * Fill every unlocked slot with a diet- and meal-matching recipe, avoiding repeats in the week
 * where possible. Locked slots are kept as-is.
 */
export function generatePlan(slots: Slot[], recipes: Recipe[], diets: string[], rand: () => number = Math.random): Slot[] {
  const eligible = recipes.filter((r) => matchesDiet(r, diets));
  const used = new Map<string, number>();
  for (const s of slots) if (s.locked && s.recipe_id) used.set(s.recipe_id, (used.get(s.recipe_id) ?? 0) + 1);
  return slots.map((s) => {
    if (s.locked) return s;
    const pool = eligible.filter((r) => matchesMeal(r, s.meal));
    if (pool.length === 0) return { ...s, recipe_id: null };
    const minUse = Math.min(...pool.map((r) => used.get(r.id) ?? 0));
    const least = pool.filter((r) => (used.get(r.id) ?? 0) === minUse);
    const pick = least[Math.floor(rand() * least.length)]!;
    used.set(pick.id, (used.get(pick.id) ?? 0) + 1);
    return { ...s, recipe_id: pick.id };
  });
}

export function surpriseFor(slot: Slot, slots: Slot[], recipes: Recipe[], diets: string[], rand: () => number = Math.random): string | null {
  const inWeek = new Set(slots.map((s) => s.recipe_id));
  const pool = recipes.filter((r) => matchesDiet(r, diets) && matchesMeal(r, slot.meal) && r.id !== slot.recipe_id);
  const fresh = pool.filter((r) => !inWeek.has(r.id));
  const from = fresh.length ? fresh : pool;
  return from.length ? from[Math.floor(rand() * from.length)]!.id : null;
}

// ---------- shopping ----------
export type ShoppingLine = { key: string; name: string; quantity: number | null; unit: string; category: string };

const UNIT_ALIASES: Record<string, string> = {
  tablespoon: "tbsp", tablespoons: "tbsp", tbsps: "tbsp", tbs: "tbsp",
  teaspoon: "tsp", teaspoons: "tsp", tsps: "tsp",
  cups: "cup", grams: "g", gram: "g", kilograms: "kg", kilogram: "kg",
  milliliters: "ml", millilitres: "ml", liter: "l", liters: "l", litres: "l",
  ounces: "oz", ounce: "oz", pounds: "lb", pound: "lb", lbs: "lb",
  cloves: "clove", cans: "can", pieces: "", piece: "", pcs: "", whole: "",
};
export function normalizeUnit(u: string): string {
  const k = (u || "").trim().toLowerCase().replace(/\.$/, "");
  return UNIT_ALIASES[k] ?? k;
}
function normalizeName(n: string): string {
  let s = n.trim().toLowerCase().replace(/\s+/g, " ");
  if (s.endsWith("oes")) s = s.slice(0, -2);
  else if (s.endsWith("ies")) s = s.slice(0, -3) + "y";
  else if (s.endsWith("s") && !s.endsWith("ss")) s = s.slice(0, -1);
  return s;
}
function roundQty(q: number): number {
  return Math.round(q * 100) / 100;
}

export function buildShoppingList(slots: Slot[], recipes: Recipe[], servings: number): ShoppingLine[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const acc = new Map<string, ShoppingLine>();
  for (const s of slots) {
    const r = s.recipe_id ? byId.get(s.recipe_id) : undefined;
    if (!r) continue;
    const factor = servings / Math.max(1, r.servings || 1);
    for (const ing of r.ingredients) {
      if (!ing.name?.trim()) continue;
      const unit = normalizeUnit(ing.unit);
      const key = `${normalizeName(ing.name)}|${unit}`;
      const prev = acc.get(key);
      const q = ing.quantity == null ? null : ing.quantity * factor;
      if (prev) {
        prev.quantity = prev.quantity == null && q == null ? null : roundQty((prev.quantity ?? 0) + (q ?? 0));
      } else {
        acc.set(key, { key, name: ing.name.trim(), quantity: q == null ? null : roundQty(q), unit, category: ing.category || "other" });
      }
    }
  }
  return [...acc.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function formatQty(q: number | null, unit: string): string {
  if (q == null) return unit;
  const nice = Number.isInteger(q) ? String(q) : q < 10 ? String(Math.round(q * 4) / 4) : String(Math.round(q));
  return unit ? `${nice} ${unit}` : nice;
}

// ---------- prep scheduling ----------
export function mealTime(profile: Pick<Profile, "breakfast_time" | "lunch_time" | "dinner_time" | "snack_time">, meal: string): string {
  return (
    ({ breakfast: profile.breakfast_time, lunch: profile.lunch_time, dinner: profile.dinner_time, snack: profile.snack_time } as Record<string, string>)[meal] ?? "12:00"
  );
}

/** Convert a wall-clock date+time in an IANA timezone to a UTC Date. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y = 0, mo = 1, d = 1] = date.split("-").map(Number);
  const [h = 0, mi = 0] = time.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offset = tzOffsetMs(new Date(guess), timeZone);
  const first = guess - offset;
  const offset2 = tzOffsetMs(new Date(first), timeZone);
  return new Date(guess - offset2);
}
function tzOffsetMs(at: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(at);
    const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"), g("second"));
    return asUtc - at.getTime();
  } catch {
    return 0;
  }
}

export type PrepEvent = {
  id: string;
  title: string;
  recipeTitle: string;
  recipeId: string;
  meal: string;
  mealDate: string;
  due: Date;
  mealAt: Date;
};

export function computePrepEvents(slots: Slot[], recipes: Recipe[], profile: Profile): PrepEvent[] {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const out: PrepEvent[] = [];
  for (const s of slots) {
    const r = s.recipe_id ? byId.get(s.recipe_id) : undefined;
    if (!r) continue;
    const mealAt = zonedToUtc(s.date, mealTime(profile, s.meal), profile.timezone || "UTC");
    r.prep_tasks.forEach((t, i) => {
      out.push({
        id: `${s.date}-${s.meal}-${r.id}-${i}`,
        title: t.title,
        recipeTitle: r.title,
        recipeId: r.id,
        meal: s.meal,
        mealDate: s.date,
        due: new Date(mealAt.getTime() - (Number(t.hours_before) || 0) * 3600_000),
        mealAt,
      });
    });
  }
  return out.sort((a, b) => a.due.getTime() - b.due.getTime());
}

// ---------- ICS ----------
function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
export function buildIcs(events: PrepEvent[], calName = "MealMap prep reminders"): string {
  const now = icsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MealMap//Prep reminders//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(calName)}`, "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H",
  ];
  for (const e of events) {
    const end = new Date(e.due.getTime() + 15 * 60_000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@mealmap`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsDate(e.due)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${icsEscape(`${e.title} — ${e.recipeTitle}`)}`,
      `DESCRIPTION:${icsEscape(`Prep for ${MEAL_LABEL[e.meal] ?? e.meal} on ${e.mealDate}: ${e.recipeTitle}`)}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(e.title)}`, "TRIGGER:-PT0M", "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

// ---------- suggestions ----------
const MEAT = /(chicken|beef|pork|lamb|turkey|steak|mince|sausage|bacon|ham|duck|meat)/;
const SEAFOOD = /(salmon|tuna|cod|fish|shrimp|prawn|scallop|tilapia|halibut|crab|anchov)/;
const DRIED_LEGUME = /(beans|chickpeas|garbanzo)/;

export function suggestPrepTasks(ingredients: Ingredient[], steps: string[]): PrepTask[] {
  const tasks: PrepTask[] = [];
  for (const ing of ingredients) {
    const n = ing.name.toLowerCase();
    if (/frozen/.test(n) && (MEAT.test(n) || SEAFOOD.test(n))) {
      const what = n.replace(/frozen/g, "").trim();
      tasks.push({ title: `Thaw ${what}`, hours_before: SEAFOOD.test(n) ? 12 : 24 });
    } else if (/dried|dry /.test(n) && DRIED_LEGUME.test(n)) {
      const what = n.replace(/dried|dry/g, "").trim();
      tasks.push({ title: `Soak ${what}`, hours_before: 12 });
    }
  }
  if (steps.some((s) => /marinat/i.test(s))) tasks.push({ title: "Marinate", hours_before: 2 });
  const seen = new Set<string>();
  return tasks.filter((t) => (seen.has(t.title) ? false : (seen.add(t.title), true)));
}

const DAIRY_EGG = /(milk|cheese|butter|cream|yogurt|yoghurt|egg|honey|ghee|parmesan|mozzarella|feta)/;
const GLUTEN = /(flour|bread|pasta|spaghetti|noodle|couscous|barley|wheat|tortilla|breadcrumb|soy sauce|bun|pita|cracker|rye)/;
const SUGARY = /(sugar|syrup|honey|jam|chocolate|candy|sweetened|agave|molasses)/;
const PROTEIN = /(chicken|beef|pork|turkey|salmon|tuna|fish|shrimp|egg|tofu|tempeh|lentil|chickpea|beans|greek yogurt|protein|seitan|cottage cheese)/;

export function suggestDietTags(ingredients: Ingredient[]): string[] {
  const names = ingredients.map((i) => i.name.toLowerCase());
  const has = (re: RegExp) => names.some((n) => re.test(n));
  const tags: string[] = [];
  const meaty = has(MEAT) || has(SEAFOOD);
  const glutenFree = names.every((n) => !GLUTEN.test(n) || /gluten[- ]free|tamari/.test(n));
  if (!meaty) tags.push("vegetarian");
  if (!meaty && !has(DAIRY_EGG)) tags.push("vegan");
  if (!has(SUGARY)) tags.push("low-sugar");
  if (names.filter((n) => PROTEIN.test(n)).length >= 1) tags.push("high-protein");
  if (glutenFree) tags.push("gluten-free");
  return DIET_TAGS.map((d) => d.id).filter((d) => tags.includes(d));
}

export function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (/frozen/.test(n)) return "frozen";
  if (MEAT.test(n) || SEAFOOD.test(n) || /(tofu|tempeh|seitan)/.test(n)) return "protein";
  if (/(milk|cheese|butter|cream|yogurt|yoghurt|egg)/.test(n)) return "dairy";
  if (/(bread|bun|pita|tortilla|bagel|baguette)/.test(n)) return "bakery";
  if (/(salt|pepper|cumin|paprika|oregano|cinnamon|chili powder|turmeric|spice|vinegar|mustard|ketchup|soy sauce|tamari|sauce)/.test(n)) return "spices";
  if (/(onion|garlic|tomato|lettuce|spinach|kale|carrot|pepper|cucumber|lemon|lime|apple|banana|berr|avocado|potato|zucchini|mushroom|herb|basil|cilantro|parsley|ginger|broccoli|celery|asparagus|fruit|orange|greens|scallion)/.test(n)) return "produce";
  if (/(flour|rice|pasta|oil|sugar|beans|lentil|chickpea|oat|quinoa|nut|seed|stock|broth|can|honey|syrup|coconut milk|noodle)/.test(n)) return "pantry";
  return "other";
}

const UNIT_WORDS = new Set([
  "cup", "cups", "tbsp", "tablespoon", "tablespoons", "tsp", "teaspoon", "teaspoons", "g", "gram", "grams", "kg", "ml", "l",
  "oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds", "clove", "cloves", "can", "cans", "pinch", "handful", "bunch",
  "slice", "slices", "piece", "pieces", "package", "packet", "stick", "sticks", "quart", "pint",
]);
const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };

/** Parse a free-text ingredient line such as "2 1/2 cups rolled oats". */
export function parseIngredientLine(line: string): Ingredient {
  let s = line.replace(/\s+/g, " ").trim();
  for (const [k, v] of Object.entries(FRACTIONS)) s = s.replace(new RegExp(`(\\d)?\\s?${k}`), (_m, d) => ` ${(d ? Number(d) : 0) + v} `).trim();
  const m = s.match(/^(\d+(?:[.,]\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)(?:\s*-\s*\d+(?:\.\d+)?)?\s*(.*)$/);
  let quantity: number | null = null;
  let rest = s;
  if (m) {
    quantity = m[1]!.split(/\s+/).reduce((acc, part) => {
      if (part.includes("/")) {
        const [a = 0, b = 0] = part.split("/").map(Number);
        return acc + (b ? a / b : 0);
      }
      return acc + Number(part.replace(",", "."));
    }, 0);
    quantity = Math.round(quantity * 100) / 100;
    rest = m[2] ?? "";
  }
  let unit = "";
  const first = rest.split(" ")[0]?.toLowerCase().replace(/[.,]$/, "");
  if (first && UNIT_WORDS.has(first)) {
    unit = normalizeUnit(first);
    rest = rest.split(" ").slice(1).join(" ");
  }
  const name = rest.replace(/^of\s+/i, "").replace(/\(.*?\)/g, "").split(",")[0]!.trim() || line.trim();
  return { name, quantity, unit, category: guessCategory(name) };
}

export function parseIsoDuration(v: unknown): number {
  if (typeof v !== "string") return 0;
  const m = v.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return 0;
  return (Number(m[1] ?? 0) * 24 + Number(m[2] ?? 0)) * 60 + Number(m[3] ?? 0);
}

// ---------- pantry ----------
export const PANTRY_CATEGORIES = ["pantry", "spices", "frozen"] as const;
export function pantryKey(name: string): string {
  return normalizeName(name);
}
/** Split shopping lines into what to buy vs. what's already at home (matched by ingredient name). */
export function splitByPantry<T extends { name: string }>(lines: T[], pantryNames: string[]): { toBuy: T[]; atHome: T[] } {
  const have = new Set(pantryNames.map(pantryKey));
  const toBuy: T[] = [];
  const atHome: T[] = [];
  for (const l of lines) (have.has(pantryKey(l.name)) ? atHome : toBuy).push(l);
  return { toBuy, atHome };
}
