export type StoreId = "mercadona" | "carrefour" | "dia";

export const STORES: { id: StoreId; label: string }[] = [
  { id: "mercadona", label: "Mercadona" },
  { id: "carrefour", label: "Carrefour" },
  { id: "dia", label: "DIA" },
];

export function storeSearchUrl(store: StoreId, item: string): string {
  const q = encodeURIComponent(item.trim());
  switch (store) {
    case "mercadona": return `https://tienda.mercadona.es/search-results?query=${q}`;
    case "carrefour": return `https://www.carrefour.es/supermercado/buscar/?q=${q}`;
    case "dia": return `https://www.dia.es/search?q=${q}`;
  }
}

export function plainList(lines: { name: string; qty?: string }[]): string {
  return lines.map((l) => (l.qty ? `- ${l.name} (${l.qty})` : `- ${l.name}`)).join("\n");
}
