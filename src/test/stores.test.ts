import { describe, it, expect } from "vitest";
import { storeSearchUrl, plainList } from "@/lib/stores";

describe("store search links", () => {
  it("builds a Mercadona search for the item", () => {
    expect(storeSearchUrl("mercadona", "red lentils")).toBe("https://tienda.mercadona.es/search-results?query=red%20lentils");
  });
  it("builds a Carrefour search", () => {
    expect(storeSearchUrl("carrefour", "oats")).toBe("https://www.carrefour.es/supermercado/buscar/?q=oats");
  });
  it("formats a plain list with quantities", () => {
    expect(plainList([{ name: "oats", qty: "200 g" }, { name: "coffee" }])).toBe("- oats (200 g)\n- coffee");
  });
});
