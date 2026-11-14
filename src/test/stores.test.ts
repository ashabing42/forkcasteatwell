import { describe, it, expect } from "vitest";
import { storeSearchUrl, plainList } from "@/lib/stores";

describe("store search links", () => {
  it("builds a Mercadona search for the item", () => {
    expect(storeSearchUrl("mercadona", "red lentils")).toBe("https://tienda.mercadona.es/search-results?query=lentejas%20rojas");
  });
  it("builds a Carrefour search", () => {
    expect(storeSearchUrl("carrefour", "oats")).toBe("https://www.carrefour.es/supermercado/buscar/?q=copos%20de%20avena");
  });
  it("formats a plain list with quantities", () => {
    expect(plainList([{ name: "oats", qty: "200 g" }, { name: "coffee" }])).toBe("- oats (200 g)\n- coffee");
  });
});

import { toSpanish } from "@/lib/stores";
describe("toSpanish", () => {
  it("translates known terms", () => { expect(toSpanish("Red lentils")).toBe("lentejas rojas"); expect(toSpanish("dried oregano")).toBe("orégano"); });
  it("uses longest match inside a phrase", () => expect(toSpanish("fresh chicken breast")).toBe("pechuga de pollo"));
  it("falls back to original", () => expect(toSpanish("za'atar")).toBe("za'atar"));
});
