export type StoreId = "mercadona" | "carrefour" | "dia";

export const STORES: { id: StoreId; label: string; domain: string }[] = [
  { id: "mercadona", label: "Mercadona", domain: "mercadona.es" },
  { id: "carrefour", label: "Carrefour", domain: "carrefour.es" },
  { id: "dia", label: "DIA", domain: "dia.es" },
];

export const storeLogoUrl = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

// English grocery terms -> Spanish supermarket search terms. Longest match wins.
const ES: Record<string, string> = {
  "red lentils": "lentejas rojas", lentils: "lentejas", chickpeas: "garbanzos", "black beans": "alubias negras",
  "kidney beans": "alubias rojas", beans: "alubias", rice: "arroz", "brown rice": "arroz integral", quinoa: "quinoa",
  oats: "copos de avena", "rolled oats": "copos de avena", pasta: "pasta", spaghetti: "espaguetis", flour: "harina",
  bread: "pan", "wholemeal bread": "pan integral", tortillas: "tortillas de trigo", couscous: "cuscús",
  "olive oil": "aceite de oliva", "extra virgin olive oil": "aceite de oliva virgen extra", oil: "aceite",
  vinegar: "vinagre", "soy sauce": "salsa de soja", salt: "sal", pepper: "pimienta", "black pepper": "pimienta negra",
  sugar: "azúcar", honey: "miel", "maple syrup": "sirope de arce", cumin: "comino", paprika: "pimentón",
  "smoked paprika": "pimentón ahumado", oregano: "orégano", "dried oregano": "orégano", basil: "albahaca",
  parsley: "perejil", coriander: "cilantro", cilantro: "cilantro", cinnamon: "canela", turmeric: "cúrcuma",
  "chilli flakes": "guindilla", thyme: "tomillo", rosemary: "romero", "bay leaf": "laurel", ginger: "jengibre",
  "curry powder": "curry", "vegetable stock": "caldo de verduras", "chicken stock": "caldo de pollo", stock: "caldo",
  "coconut milk": "leche de coco", "chopped tomatoes": "tomate triturado", "tomato paste": "concentrado de tomate",
  "tinned tomatoes": "tomate triturado", "peanut butter": "crema de cacahuete", tahini: "tahini", nuts: "frutos secos",
  almonds: "almendras", walnuts: "nueces", "chia seeds": "semillas de chía", seeds: "semillas",
  tomato: "tomate", tomatoes: "tomates", "cherry tomatoes": "tomates cherry", onion: "cebolla", onions: "cebollas",
  "red onion": "cebolla morada", garlic: "ajo", potato: "patata", potatoes: "patatas", "sweet potato": "boniato",
  carrot: "zanahoria", carrots: "zanahorias", spinach: "espinacas", lettuce: "lechuga", cucumber: "pepino",
  courgette: "calabacín", zucchini: "calabacín", aubergine: "berenjena", eggplant: "berenjena", broccoli: "brócoli",
  cauliflower: "coliflor", mushrooms: "champiñones", "bell pepper": "pimiento", "red pepper": "pimiento rojo",
  "green pepper": "pimiento verde", peppers: "pimientos", avocado: "aguacate", lemon: "limón", lime: "lima",
  apple: "manzana", banana: "plátano", bananas: "plátanos", berries: "frutos rojos", blueberries: "arándanos",
  strawberries: "fresas", orange: "naranja", kale: "kale", celery: "apio", leek: "puerro", "spring onion": "cebolleta",
  peas: "guisantes", "frozen peas": "guisantes congelados", corn: "maíz", pumpkin: "calabaza",
  chicken: "pollo", "chicken breast": "pechuga de pollo", "chicken thighs": "contramuslos de pollo", beef: "ternera",
  "minced beef": "carne picada de ternera", pork: "cerdo", salmon: "salmón", tuna: "atún", cod: "bacalao",
  prawns: "gambas", shrimp: "gambas", eggs: "huevos", egg: "huevo", tofu: "tofu", tempeh: "tempeh", turkey: "pavo",
  milk: "leche", "oat milk": "bebida de avena", "almond milk": "bebida de almendra", "soy milk": "bebida de soja",
  yogurt: "yogur", yoghurt: "yogur", "greek yogurt": "yogur griego", cheese: "queso", feta: "queso feta",
  parmesan: "queso parmesano", mozzarella: "mozzarella", butter: "mantequilla", cream: "nata",
  "cottage cheese": "queso cottage", "cream cheese": "queso crema",
};

export function toSpanish(item: string): string {
  const n = item.toLowerCase().trim().replace(/\s+/g, " ");
  const direct = ES[n];
  if (direct) return direct;
  // longest English phrase contained in the item
  const hit = Object.keys(ES).filter((k) => new RegExp(`\\b${k}\\b`).test(n)).sort((a, b) => b.length - a.length)[0];
  return (hit && ES[hit]) || item.trim();
}

export function storeSearchUrl(store: StoreId, item: string): string {
  const q = encodeURIComponent(toSpanish(item));
  switch (store) {
    case "mercadona": return `https://tienda.mercadona.es/search-results?query=${q}`;
    case "carrefour": return `https://www.carrefour.es/supermercado/buscar/?q=${q}`;
    case "dia": return `https://www.dia.es/search?q=${q}`;
  }
}

export function plainList(lines: { name: string; qty?: string }[]): string {
  return lines.map((l) => (l.qty ? `- ${l.name} (${l.qty})` : `- ${l.name}`)).join("\n");
}
